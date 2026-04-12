import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';

@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  async getMonthly(year?: number): Promise<any[]> {
    const y = year || new Date().getFullYear();
    const rows = await this.orderRepo.query(`
      SELECT
        EXTRACT(MONTH FROM "createdAt") as month,
        SUM("priceCharged") as revenue,
        SUM("totalExpenses") as expenses,
        COUNT(*) as order_count
      FROM orders
      WHERE EXTRACT(YEAR FROM "createdAt") = $1
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
    `, [y]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((name, i) => {
      const row = rows.find((r: any) => parseInt(r.month) === i + 1);
      return {
        month: name,
        revenue: row ? parseFloat(row.revenue) : 0,
        expenses: row ? parseFloat(row.expenses) : 0,
        profit: row ? parseFloat(row.revenue) - parseFloat(row.expenses) : 0,
        orderCount: row ? parseInt(row.order_count) : 0,
      };
    });
  }

  async getSummary(): Promise<any> {
    const [result] = await this.orderRepo.query(`
      SELECT
        SUM("priceCharged") as total_revenue,
        SUM("totalExpenses") as total_expenses,
        COUNT(*) as total_orders
      FROM orders
    `);
    const thisMonth = await this.orderRepo.query(`
      SELECT
        SUM("priceCharged") as revenue,
        SUM("totalExpenses") as expenses,
        COUNT(*) as order_count
      FROM orders
      WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', CURRENT_DATE)
    `);
    const m = thisMonth[0];
    return {
      totalRevenue: parseFloat(result.total_revenue) || 0,
      totalExpenses: parseFloat(result.total_expenses) || 0,
      netProfit: (parseFloat(result.total_revenue) || 0) - (parseFloat(result.total_expenses) || 0),
      totalOrders: parseInt(result.total_orders) || 0,
      thisMonth: {
        revenue: parseFloat(m.revenue) || 0,
        expenses: parseFloat(m.expenses) || 0,
        profit: (parseFloat(m.revenue) || 0) - (parseFloat(m.expenses) || 0),
        orderCount: parseInt(m.order_count) || 0,
      },
    };
  }

  async getByType(): Promise<any[]> {
    return this.orderRepo.query(`
      SELECT
        type,
        COUNT(*) as count,
        SUM("priceCharged") as revenue,
        SUM("totalExpenses") as expenses
      FROM orders
      GROUP BY type
    `);
  }
}
