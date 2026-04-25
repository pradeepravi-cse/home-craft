import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { BusinessSettings } from './business-settings.entity';

export class UpdateBusinessSettingsDto {
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  electricityRatePerService?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  laborRatePerService?: number;
}

@Injectable()
export class BusinessSettingsService {
  constructor(
    @InjectPinoLogger(BusinessSettingsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(BusinessSettings)
    private repo: Repository<BusinessSettings>,
  ) {}

  async get(): Promise<BusinessSettings> {
    this.logger.debug('businessSettings:get');
    let settings = await this.repo.findOne({ where: { id: 'singleton' } });
    if (!settings) {
      this.logger.info('businessSettings:initialising defaults');
      settings = this.repo.create({
        id: 'singleton',
        electricityRatePerService: 0,
        laborRatePerService: 0,
      });
      await this.repo.save(settings);
    }
    return settings;
  }

  async update(dto: UpdateBusinessSettingsDto): Promise<BusinessSettings> {
    this.logger.info(dto, 'businessSettings:update');
    await this.get();
    await this.repo.update('singleton', dto);
    const saved = await this.get();
    this.logger.info({ electricityRatePerService: saved.electricityRatePerService, laborRatePerService: saved.laborRatePerService }, 'businessSettings:updated');
    return saved;
  }
}
