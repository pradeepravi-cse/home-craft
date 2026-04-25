import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Customer } from '../customers/customer.entity';
import { Investment } from '../investments/investment.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Customer, Investment])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
