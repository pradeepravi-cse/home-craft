import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Client } from '../clients/client.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

  async getOverview(): Promise<any> {
    const [
      totalOrders,
      totalClients,
      activeOrders,
      revenueResult,
      recentOrders,
      statusBreakdown,
    ] = await Promise.all([
      this.orderRepo.count(),
      this.clientRepo.count(),
      this.orderRepo.count({
        where: [
          { status: OrderStatus.RECEIVED },
          { status: OrderStatus.PROCESSING },
          { status: OrderStatus.READY },
        ],
      }),
      this.orderRepo.query(`
        SELECT
          COALESCE(SUM("priceCharged"), 0) as total_revenue,
          COALESCE(SUM("totalExpenses"), 0) as total_expenses
        FROM orders
        WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', CURRENT_DATE)
      `),
      this.orderRepo.find({
        relations: ['client'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.orderRepo.query(`
        SELECT status, COUNT(*) as count FROM orders GROUP BY status
      `),
    ]);

    const rev = revenueResult[0];
    return {
      totalOrders,
      totalClients,
      activeOrders,
      thisMonthRevenue: parseFloat(rev.total_revenue) || 0,
      thisMonthExpenses: parseFloat(rev.total_expenses) || 0,
      thisMonthProfit: (parseFloat(rev.total_revenue) || 0) - (parseFloat(rev.total_expenses) || 0),
      recentOrders,
      statusBreakdown,
    };
  }
}
