import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessSettings } from './business-settings.entity';
import { BusinessSettingsService } from './business-settings.service';
import { BusinessSettingsController } from './business-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessSettings])],
  providers: [BusinessSettingsService],
  controllers: [BusinessSettingsController],
  exports: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
