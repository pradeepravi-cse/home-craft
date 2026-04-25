import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsNumber, IsOptional, Min, ValidateNested, ArrayMinSize, IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ProductRecipe, RecipeItem } from './recipe.entity';
import { Product } from '../products/product.entity';
import { RawMaterial } from '../raw-materials/raw-material.entity';

export class RecipeItemDto {
  @IsUUID() rawMaterialId: string;
  @IsNumber() @Min(0) @Type(() => Number) quantity: number;
}

export class UpsertRecipeDto {
  @IsOptional() @IsString() batchDescription?: string;
  @IsNumber() @Min(0.01) @Type(() => Number) batchYield: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) targetMarginPct?: number;
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
}

export interface CostBreakdownLine {
  rawMaterialId: string;
  name: string;
  unit: string;
  quantity: number;
  costPerUnit: number;
  lineCost: number;
}

export interface CostResult {
  batchYield: number;
  targetMarginPct: number;
  lines: CostBreakdownLine[];
  totalBatchCost: number;
  costPerUnit: number;
  suggestedPrice: number;
}

@Injectable()
export class RecipesService {
  constructor(
    @InjectPinoLogger(RecipesService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(ProductRecipe)
    private recipeRepo: Repository<ProductRecipe>,
    @InjectRepository(RecipeItem)
    private itemRepo: Repository<RecipeItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(RawMaterial)
    private materialRepo: Repository<RawMaterial>,
  ) {}

  async findByProduct(productId: string): Promise<ProductRecipe | null> {
    this.logger.debug({ productId }, 'recipes:findByProduct');
    return this.recipeRepo.findOne({
      where: { productId },
      relations: ['product', 'items', 'items.rawMaterial'],
    });
  }

  async findAll(): Promise<ProductRecipe[]> {
    this.logger.debug('recipes:findAll');
    const results = await this.recipeRepo.find({
      relations: ['product', 'items', 'items.rawMaterial'],
      order: { createdAt: 'DESC' },
    });
    this.logger.debug({ count: results.length }, 'recipes:findAll result');
    return results;
  }

  async upsert(productId: string, dto: UpsertRecipeDto): Promise<ProductRecipe> {
    this.logger.info({ productId, batchYield: dto.batchYield, itemCount: dto.items.length }, 'recipes:upsert');
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.recipeRepo.findOne({ where: { productId } });
    if (existing) await this.recipeRepo.remove(existing);

    const recipe = this.recipeRepo.create({
      productId,
      batchDescription: dto.batchDescription,
      batchYield: dto.batchYield,
      targetMarginPct: dto.targetMarginPct ?? 40,
    });
    const saved = await this.recipeRepo.save(recipe);

    const items = dto.items.map((i) =>
      this.itemRepo.create({
        recipeId: saved.id,
        rawMaterialId: i.rawMaterialId,
        quantity: i.quantity,
      }),
    );
    await this.itemRepo.save(items);

    this.logger.info({ id: saved.id, productId }, 'recipes:upserted');
    return this.recipeRepo.findOne({
      where: { id: saved.id },
      relations: ['product', 'items', 'items.rawMaterial'],
    });
  }

  async delete(productId: string): Promise<void> {
    this.logger.info({ productId }, 'recipes:delete');
    const recipe = await this.recipeRepo.findOne({ where: { productId } });
    if (!recipe) throw new NotFoundException('Recipe not found');
    await this.recipeRepo.remove(recipe);
    this.logger.info({ productId }, 'recipes:deleted');
  }

  async calculateCost(productId: string): Promise<CostResult> {
    this.logger.debug({ productId }, 'recipes:calculateCost');
    const recipe = await this.recipeRepo.findOne({
      where: { productId },
      relations: ['items', 'items.rawMaterial'],
    });
    if (!recipe) throw new NotFoundException('No recipe found for this product');
    const result = this.computeCost(recipe);
    this.logger.debug({ productId, costPerUnit: result.costPerUnit, suggestedPrice: result.suggestedPrice }, 'recipes:costCalculated');
    return result;
  }

  async previewCost(dto: UpsertRecipeDto): Promise<CostResult> {
    this.logger.debug({ batchYield: dto.batchYield, itemCount: dto.items.length }, 'recipes:previewCost');
    const materialIds = dto.items.map((i) => i.rawMaterialId);
    const materials = await this.materialRepo.findByIds(materialIds);
    const materialMap = new Map(materials.map((m) => [m.id, m]));

    const lines: CostBreakdownLine[] = dto.items.map((i) => {
      const m = materialMap.get(i.rawMaterialId);
      const lineCost = m ? Number(m.costPerUnit) * i.quantity : 0;
      return {
        rawMaterialId: i.rawMaterialId,
        name: m?.name ?? 'Unknown',
        unit: m?.unit ?? '',
        quantity: i.quantity,
        costPerUnit: m ? Number(m.costPerUnit) : 0,
        lineCost,
      };
    });

    return this.buildResult(lines, dto.batchYield, dto.targetMarginPct ?? 40);
  }

  private computeCost(recipe: ProductRecipe): CostResult {
    const lines: CostBreakdownLine[] = recipe.items.map((item) => {
      const m = item.rawMaterial;
      const lineCost = Number(m.costPerUnit) * Number(item.quantity);
      return {
        rawMaterialId: m.id,
        name: m.name,
        unit: m.unit,
        quantity: Number(item.quantity),
        costPerUnit: Number(m.costPerUnit),
        lineCost,
      };
    });

    return this.buildResult(
      lines,
      Number(recipe.batchYield),
      Number(recipe.targetMarginPct),
    );
  }

  private buildResult(
    lines: CostBreakdownLine[],
    batchYield: number,
    targetMarginPct: number,
  ): CostResult {
    const totalBatchCost = lines.reduce((s, l) => s + l.lineCost, 0);
    const costPerUnit = batchYield > 0 ? totalBatchCost / batchYield : 0;
    const suggestedPrice =
      targetMarginPct < 100 ? costPerUnit / (1 - targetMarginPct / 100) : costPerUnit * 2;

    return {
      batchYield,
      targetMarginPct,
      lines,
      totalBatchCost: Math.round(totalBatchCost * 10000) / 10000,
      costPerUnit: Math.round(costPerUnit * 10000) / 10000,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    };
  }
}
