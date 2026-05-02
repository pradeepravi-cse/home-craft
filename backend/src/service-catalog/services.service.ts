import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsOptional, IsBoolean, IsNumber, ValidateNested, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Service, WorkflowDefinition, CustomerTier } from './service.entity';

class WorkflowStepDto {
  @IsString() id: string;
  @IsString() label: string;
  @IsString({ each: true }) transitions: string[];
}

export class WorkflowDefinitionDto {
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];

  @IsString() initialStep: string;
  @IsString() completionStep: string;
  @IsString({ each: true }) dependencies: string[];
}

export class CreateServiceDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() basePrice: number;
  @IsOptional() @IsBoolean() isOptional?: boolean;
  @ValidateNested() @Type(() => WorkflowDefinitionDto) workflowDefinition: WorkflowDefinitionDto;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsEnum(CustomerTier) customerTier?: CustomerTier;
}

export class UpdateServiceDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsBoolean() isOptional?: boolean;
  @IsOptional() @ValidateNested() @Type(() => WorkflowDefinitionDto) workflowDefinition?: WorkflowDefinitionDto;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsEnum(CustomerTier) customerTier?: CustomerTier;
}

@Injectable()
export class ServiceCatalogService {
  constructor(
    @InjectPinoLogger(ServiceCatalogService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Service)
    private repo: Repository<Service>,
  ) {}

  async findAll(activeOnly = false): Promise<Service[]> {
    this.logger.debug({ activeOnly }, 'serviceCatalog:findAll');
    const results = await this.repo.find({
      where: activeOnly ? { isActive: true } : {},
      order: { createdAt: 'ASC' },
    });
    this.logger.debug({ count: results.length }, 'serviceCatalog:findAll result');
    return results;
  }

  async findOne(id: string): Promise<Service> {
    this.logger.debug({ id }, 'serviceCatalog:findOne');
    const service = await this.repo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    this.logger.info({ name: dto.name, basePrice: dto.basePrice }, 'serviceCatalog:create');
    const service = this.repo.create(dto);
    const saved = await this.repo.save(service);
    this.logger.info({ id: saved.id, name: saved.name }, 'serviceCatalog:created');
    return saved;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    this.logger.info({ id }, 'serviceCatalog:update');
    const service = await this.findOne(id);
    Object.assign(service, dto);
    const saved = await this.repo.save(service);
    this.logger.info({ id: saved.id }, 'serviceCatalog:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'serviceCatalog:remove');
    const service = await this.findOne(id);
    await this.repo.remove(service);
    this.logger.info({ id }, 'serviceCatalog:removed');
  }
}
