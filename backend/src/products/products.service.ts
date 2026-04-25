import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsOptional, IsNumber, IsEnum, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Product, ProductCategory } from './product.entity';

export class CreateProductDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ProductCategory) category?: ProductCategory;
  @IsNumber() @Type(() => Number) price: number;
  @IsOptional() @IsNumber() @Type(() => Number) costPrice?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() unit?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ProductCategory) category?: ProductCategory;
  @IsOptional() @IsNumber() @Type(() => Number) price?: number;
  @IsOptional() @IsNumber() @Type(() => Number) costPrice?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() unit?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectPinoLogger(ProductsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Product)
    private repo: Repository<Product>,
  ) {}

  async findAll(category?: ProductCategory, publicOnly = false): Promise<Product[]> {
    this.logger.debug({ category, publicOnly }, 'products:findAll');
    const where: any = {};
    if (category) where.category = category;
    if (publicOnly) { where.isPublic = true; where.isActive = true; }
    const results = await this.repo.find({ where, order: { createdAt: 'DESC' } });
    this.logger.debug({ count: results.length }, 'products:findAll result');
    return results;
  }

  async findOne(id: string): Promise<Product> {
    this.logger.debug({ id }, 'products:findOne');
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    this.logger.info({ name: dto.name, category: dto.category, price: dto.price }, 'products:create');
    const saved = await this.repo.save(this.repo.create(dto));
    this.logger.info({ id: saved.id, name: saved.name }, 'products:created');
    return saved;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    this.logger.info({ id }, 'products:update');
    const p = await this.findOne(id);
    Object.assign(p, dto);
    const saved = await this.repo.save(p);
    this.logger.info({ id: saved.id }, 'products:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'products:remove');
    const p = await this.findOne(id);
    await this.repo.remove(p);
    this.logger.info({ id }, 'products:removed');
  }
}
