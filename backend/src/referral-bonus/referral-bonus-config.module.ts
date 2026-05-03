import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralBonusConfig } from './referral-bonus-config.entity';
import { ReferralBonusConfigService } from './referral-bonus-config.service';
import { ReferralBonusConfigController } from './referral-bonus-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReferralBonusConfig])],
  controllers: [ReferralBonusConfigController],
  providers: [ReferralBonusConfigService],
  exports: [ReferralBonusConfigService],
})
export class ReferralBonusConfigModule {}
