import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RawMaterial, RawMaterialCategory } from './raw-material.entity';

export class CreateRawMaterialDto {
  @IsString() name: string;
  @IsString() unit: string;
  @IsNumber() @Min(0) @Type(() => Number) costPerUnit: number;
  @IsOptional() @IsEnum(RawMaterialCategory) category?: RawMaterialCategory;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) currentStock?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) minStock?: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateRawMaterialDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) costPerUnit?: number;
  @IsOptional() @IsEnum(RawMaterialCategory) category?: RawMaterialCategory;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) minStock?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class AdjustStockDto {
  @IsNumber() @Type(() => Number) quantity: number;
  @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class RawMaterialsService {
  constructor(
    @InjectPinoLogger(RawMaterialsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(RawMaterial)
    private repo: Repository<RawMaterial>,
  ) {}

  async findAll(category?: RawMaterialCategory, activeOnly = false): Promise<RawMaterial[]> {
    this.logger.debug({ category, activeOnly }, 'rawMaterials:findAll');
    const where: any = {};
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;
    const results = await this.repo.find({ where, order: { category: 'ASC', name: 'ASC' } });
    this.logger.debug({ count: results.length }, 'rawMaterials:findAll result');
    return results;
  }

  async findOne(id: string): Promise<RawMaterial> {
    this.logger.debug({ id }, 'rawMaterials:findOne');
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Raw material not found');
    return m;
  }

  async create(dto: CreateRawMaterialDto): Promise<RawMaterial> {
    this.logger.info({ name: dto.name, category: dto.category, costPerUnit: dto.costPerUnit }, 'rawMaterials:create');
    const saved = await this.repo.save(this.repo.create(dto));
    this.logger.info({ id: saved.id, name: saved.name }, 'rawMaterials:created');
    return saved;
  }

  async update(id: string, dto: UpdateRawMaterialDto): Promise<RawMaterial> {
    this.logger.info({ id }, 'rawMaterials:update');
    const m = await this.findOne(id);
    Object.assign(m, dto);
    const saved = await this.repo.save(m);
    this.logger.info({ id: saved.id }, 'rawMaterials:updated');
    return saved;
  }

  async adjustStock(id: string, dto: AdjustStockDto): Promise<RawMaterial> {
    this.logger.info({ id, quantity: dto.quantity }, 'rawMaterials:adjustStock');
    const m = await this.findOne(id);
    const newStock = Number(m.currentStock) + dto.quantity;
    if (newStock < 0) throw new BadRequestException('Stock cannot go below zero');
    m.currentStock = newStock;
    const saved = await this.repo.save(m);
    this.logger.info({ id, newStock: saved.currentStock }, 'rawMaterials:stockAdjusted');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'rawMaterials:remove');
    const m = await this.findOne(id);
    await this.repo.remove(m);
    this.logger.info({ id }, 'rawMaterials:removed');
  }
}
