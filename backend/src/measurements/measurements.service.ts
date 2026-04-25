import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Measurement } from './measurement.entity';

export class CreateMeasurementDto {
  @IsString()
  customerId: string;

  @IsOptional() @IsNumber() @Type(() => Number) palluLength?: number;
  @IsOptional() @IsNumber() @Type(() => Number) shoulderToNavel?: number;
  @IsOptional() @IsNumber() @Type(() => Number) waistToFloor?: number;
  @IsOptional() @IsNumber() @Type(() => Number) bodyWrap?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() label?: string;
}

export class UpdateMeasurementDto {
  @IsOptional() @IsNumber() @Type(() => Number) palluLength?: number;
  @IsOptional() @IsNumber() @Type(() => Number) shoulderToNavel?: number;
  @IsOptional() @IsNumber() @Type(() => Number) waistToFloor?: number;
  @IsOptional() @IsNumber() @Type(() => Number) bodyWrap?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() label?: string;
}

@Injectable()
export class MeasurementsService {
  constructor(
    @InjectPinoLogger(MeasurementsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Measurement)
    private repo: Repository<Measurement>,
  ) {}

  async findByCustomer(customerId: string): Promise<Measurement[]> {
    this.logger.debug({ customerId }, 'measurements:findByCustomer');
    const results = await this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
    this.logger.debug({ customerId, count: results.length }, 'measurements:findByCustomer result');
    return results;
  }

  async findOne(id: string): Promise<Measurement> {
    this.logger.debug({ id }, 'measurements:findOne');
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Measurement not found');
    return m;
  }

  async create(dto: CreateMeasurementDto): Promise<Measurement> {
    // Log customerId and unit only — never the actual measurement values or notes/label (PII)
    this.logger.info({ customerId: dto.customerId, unit: dto.unit }, 'measurements:create');
    const saved = await this.repo.save(this.repo.create(dto));
    this.logger.info({ id: saved.id, customerId: saved.customerId }, 'measurements:created');
    return saved;
  }

  async update(id: string, dto: UpdateMeasurementDto): Promise<Measurement> {
    this.logger.info({ id }, 'measurements:update');
    const m = await this.findOne(id);
    Object.assign(m, dto);
    const saved = await this.repo.save(m);
    this.logger.info({ id: saved.id }, 'measurements:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'measurements:remove');
    const m = await this.findOne(id);
    await this.repo.remove(m);
    this.logger.info({ id }, 'measurements:removed');
  }
}
