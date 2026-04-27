import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Order, OrderStatus } from '../orders/order.entity';
import { OrderItem, OrderItemType } from '../orders/order-item.entity';
import { Customer } from '../customers/customer.entity';
import { Investment } from '../investments/investment.entity';

@Injectable()
export class DashboardService {
  private readonly s: string;

  constructor(
    @InjectPinoLogger(DashboardService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemsRepo: Repository<OrderItem>,
    @InjectRepository(Customer) private customersRepo: Repository<Customer>,
    @InjectRepository(Investment) private investmentsRepo: Repository<Investment>,
  ) {
    this.s = process.env.DB_SCHEMA || 'public';
  }

  async getOverview(): Promise<any> {
    this.logger.debug('dashboard:getOverview');

    const [
      totalOrders,
      totalCustomers,
      activeOrders,
      monthlyResult,
      recentOrders,
      statusBreakdown,
      revenueSplit,
      allTimeProfitResult,
    ] = await Promise.all([
      this.ordersRepo.count(),
      this.customersRepo.count(),
      this.ordersRepo.count({
        where: {
          status: In([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.IN_PROGRESS]),
        },
      }),
      this.ordersRepo.query(`
        SELECT
          COALESCE(SUM(CAST("totalAmount" AS numeric)), 0) AS total_revenue,
          COALESCE(SUM(CAST("totalExpenses" AS numeric)), 0) AS total_expenses
        FROM "${this.s}".orders
        WHERE status = '${OrderStatus.COMPLETED}'
          AND DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', CURRENT_DATE)
      `),
      // recentOrders contains customer relations — returned to caller, not logged
      this.ordersRepo.find({
        relations: ['customer', 'items'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.ordersRepo.query(`
        SELECT status, COUNT(*) AS count FROM "${this.s}".orders GROUP BY status
      `),
      this.itemsRepo.query(`
        SELECT
          oi.type,
          COALESCE(SUM(CAST(oi.subtotal AS numeric)), 0) AS revenue
        FROM "${this.s}".order_items oi
        INNER JOIN "${this.s}".orders o ON o.id = oi.order_id
        WHERE o.status = '${OrderStatus.COMPLETED}'
        GROUP BY oi.type
      `),
      this.ordersRepo.query(`
        SELECT
          COALESCE(SUM(CAST("totalAmount" AS numeric)), 0) AS total_revenue,
          COALESCE(SUM(CAST("totalExpenses" AS numeric)), 0) AS total_expenses
        FROM "${this.s}".orders
        WHERE status = '${OrderStatus.COMPLETED}'
      `),
    ]);

    let totalInvested = 0;
    try {
      const [invResult] = await this.investmentsRepo.query(
        `SELECT COALESCE(SUM(CAST(amount AS numeric)), 0) AS total_invested FROM "${this.s}".investments`,
      );
      totalInvested = parseFloat(invResult.total_invested) || 0;
    } catch (_) {
      // investments table may not exist yet on first deployment
    }

    const rev = monthlyResult[0];
    const productRevRow = revenueSplit.find((r: any) => r.type === OrderItemType.PRODUCT);
    const serviceRevRow = revenueSplit.find((r: any) => r.type === OrderItemType.SERVICE);

    const allTimeRevenue = parseFloat(allTimeProfitResult[0].total_revenue) || 0;
    const allTimeExpenses = parseFloat(allTimeProfitResult[0].total_expenses) || 0;
    const allTimeProfit = allTimeRevenue - allTimeExpenses;
    const recoveryPct = totalInvested > 0
      ? Math.min(Math.round((allTimeProfit / totalInvested) * 100), 100)
      : 0;

    this.logger.debug({ totalOrders, totalCustomers, activeOrders, recoveryPct }, 'dashboard:getOverview result');

    return {
      totalOrders,
      totalCustomers,
      activeOrders,
      thisMonth: {
        revenue: parseFloat(rev.total_revenue) || 0,
        expenses: parseFloat(rev.total_expenses) || 0,
        profit: (parseFloat(rev.total_revenue) || 0) - (parseFloat(rev.total_expenses) || 0),
      },
      revenueSplit: {
        products: parseFloat(productRevRow?.revenue ?? '0'),
        services: parseFloat(serviceRevRow?.revenue ?? '0'),
      },
      recentOrders,
      statusBreakdown: statusBreakdown.map((r: any) => ({
        status: r.status,
        count: parseInt(r.count),
      })),
      investmentRecovery: {
        totalInvested,
        allTimeProfit,
        recoveryPct,
        breakEven: allTimeProfit >= totalInvested && totalInvested > 0,
      },
    };
  }
}
