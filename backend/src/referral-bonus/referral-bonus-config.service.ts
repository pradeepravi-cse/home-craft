import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsOptional, IsBoolean, IsInt, IsUUID, Min } from 'class-validator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ReferralBonusConfig } from './referral-bonus-config.entity';

export class CreateReferralBonusConfigDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  rewardServiceId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  referralsRequired?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateReferralBonusConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  rewardServiceId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  referralsRequired?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Injectable()
export class ReferralBonusConfigService {
  constructor(
    @InjectPinoLogger(ReferralBonusConfigService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(ReferralBonusConfig)
    private repo: Repository<ReferralBonusConfig>,
  ) {}

  async findAll(): Promise<ReferralBonusConfig[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findActive(): Promise<ReferralBonusConfig | null> {
    return this.repo.findOne({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<ReferralBonusConfig> {
    const config = await this.repo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Referral bonus config not found');
    return config;
  }

  async create(dto: CreateReferralBonusConfigDto): Promise<ReferralBonusConfig> {
    this.logger.info({ name: dto.name }, 'referralBonusConfig:create');
    const config = this.repo.create({ ...dto, referralsRequired: dto.referralsRequired ?? 1 });
    const saved = await this.repo.save(config);
    this.logger.info({ id: saved.id }, 'referralBonusConfig:created');
    return saved;
  }

  async update(id: string, dto: UpdateReferralBonusConfigDto): Promise<ReferralBonusConfig> {
    this.logger.info({ id }, 'referralBonusConfig:update');
    const config = await this.findOne(id);
    Object.assign(config, dto);
    const saved = await this.repo.save(config);
    this.logger.info({ id: saved.id }, 'referralBonusConfig:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'referralBonusConfig:remove');
    const config = await this.findOne(id);
    await this.repo.remove(config);
    this.logger.info({ id }, 'referralBonusConfig:removed');
  }
}
