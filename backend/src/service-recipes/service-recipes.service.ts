import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsNumber, IsOptional, Min, ValidateNested, ArrayMinSize, IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ServiceRecipe, ServiceRecipeItem } from './service-recipe.entity';
import { Service } from '../service-catalog/service.entity';
import { RawMaterial } from '../raw-materials/raw-material.entity';

export class ServiceRecipeItemDto {
  @IsUUID() rawMaterialId: string;
  @IsNumber() @Min(0) @Type(() => Number) quantity: number;
}

export class UpsertServiceRecipeDto {
  @IsOptional() @IsString() description?: string;
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ServiceRecipeItemDto)
  items: ServiceRecipeItemDto[];
}

export interface ServiceCostLine {
  rawMaterialId: string;
  name: string;
  unit: string;
  category: string;
  quantity: number;
  costPerUnit: number;
  lineCost: number;
}

export interface ServiceCostResult {
  description: string;
  lines: ServiceCostLine[];
  totalCost: number;
}

@Injectable()
export class ServiceRecipesService {
  constructor(
    @InjectPinoLogger(ServiceRecipesService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(ServiceRecipe) private recipeRepo: Repository<ServiceRecipe>,
    @InjectRepository(ServiceRecipeItem) private itemRepo: Repository<ServiceRecipeItem>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(RawMaterial) private materialRepo: Repository<RawMaterial>,
  ) {}

  async findByService(serviceId: string): Promise<ServiceRecipe | null> {
    this.logger.debug({ serviceId }, 'serviceRecipes:findByService');
    return this.recipeRepo.findOne({
      where: { serviceId },
      relations: ['service', 'items', 'items.rawMaterial'],
    });
  }

  async findAll(): Promise<ServiceRecipe[]> {
    this.logger.debug('serviceRecipes:findAll');
    const results = await this.recipeRepo.find({
      relations: ['service', 'items', 'items.rawMaterial'],
      order: { createdAt: 'DESC' },
    });
    this.logger.debug({ count: results.length }, 'serviceRecipes:findAll result');
    return results;
  }

  async upsert(serviceId: string, dto: UpsertServiceRecipeDto): Promise<ServiceRecipe> {
    this.logger.info({ serviceId, itemCount: dto.items.length }, 'serviceRecipes:upsert');
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');

    const existing = await this.recipeRepo.findOne({ where: { serviceId } });
    if (existing) await this.recipeRepo.remove(existing);

    const recipe = this.recipeRepo.create({ serviceId, description: dto.description });
    const saved = await this.recipeRepo.save(recipe);

    const items = dto.items.map((i) =>
      this.itemRepo.create({
        recipeId: saved.id,
        rawMaterialId: i.rawMaterialId,
        quantity: i.quantity,
      }),
    );
    await this.itemRepo.save(items);

    this.logger.info({ id: saved.id, serviceId }, 'serviceRecipes:upserted');
    return this.recipeRepo.findOne({
      where: { id: saved.id },
      relations: ['service', 'items', 'items.rawMaterial'],
    });
  }

  async delete(serviceId: string): Promise<void> {
    this.logger.info({ serviceId }, 'serviceRecipes:delete');
    const recipe = await this.recipeRepo.findOne({ where: { serviceId } });
    if (!recipe) throw new NotFoundException('Recipe not found for this service');
    await this.recipeRepo.remove(recipe);
    this.logger.info({ serviceId }, 'serviceRecipes:deleted');
  }

  async calculateCost(serviceId: string): Promise<ServiceCostResult> {
    this.logger.debug({ serviceId }, 'serviceRecipes:calculateCost');
    const recipe = await this.recipeRepo.findOne({
      where: { serviceId },
      relations: ['items', 'items.rawMaterial'],
    });
    if (!recipe) throw new NotFoundException('No recipe found for this service');
    const result = this.computeCost(recipe);
    this.logger.debug({ serviceId, totalCost: result.totalCost }, 'serviceRecipes:costCalculated');
    return result;
  }

  computeCost(recipe: ServiceRecipe): ServiceCostResult {
    const lines: ServiceCostLine[] = recipe.items.map((item) => {
      const m = item.rawMaterial;
      const lineCost = Number(m.costPerUnit) * Number(item.quantity);
      return {
        rawMaterialId: m.id,
        name: m.name,
        unit: m.unit,
        category: m.category,
        quantity: Number(item.quantity),
        costPerUnit: Number(m.costPerUnit),
        lineCost: Math.round(lineCost * 10000) / 10000,
      };
    });
    const totalCost = lines.reduce((s, l) => s + l.lineCost, 0);
    return {
      description: recipe.description,
      lines,
      totalCost: Math.round(totalCost * 10000) / 10000,
    };
  }
}
