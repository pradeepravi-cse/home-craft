import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Measurement } from './measurement.entity';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMeasurementDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  palluLength?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shoulderToNavel?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  waistToFloor?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  bodyWrap?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  label?: string;
}

@Injectable()
export class MeasurementsService {
  constructor(
    @InjectRepository(Measurement)
    private repo: Repository<Measurement>,
  ) {}

  async findByClient(clientId: string): Promise<Measurement[]> {
    return this.repo.find({ where: { clientId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Measurement> {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Measurement not found');
    return m;
  }

  async create(dto: CreateMeasurementDto): Promise<Measurement> {
    const m = this.repo.create(dto);
    return this.repo.save(m);
  }

  async update(id: string, dto: Partial<CreateMeasurementDto>): Promise<Measurement> {
    const m = await this.findOne(id);
    Object.assign(m, dto);
    return this.repo.save(m);
  }

  async remove(id: string): Promise<void> {
    const m = await this.findOne(id);
    await this.repo.remove(m);
  }
}
