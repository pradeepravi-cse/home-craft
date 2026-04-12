import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { EarningsController } from './earnings.controller';
import { EarningsService } from './earnings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [EarningsService],
  controllers: [EarningsController],
})
export class EarningsModule {}
