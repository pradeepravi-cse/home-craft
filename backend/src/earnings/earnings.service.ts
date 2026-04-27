import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Order, OrderStatus } from '../orders/order.entity';
import { OrderItem, OrderItemType } from '../orders/order-item.entity';

@Injectable()
export class EarningsService {
  private readonly s: string; // schema prefix for raw SQL, e.g. "dev-db" or "public"

  constructor(
    @InjectPinoLogger(EarningsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private itemsRepo: Repository<OrderItem>,
  ) {
    this.s = process.env.DB_SCHEMA || 'public';
  }

  async getMonthly(year?: number): Promise<any[]> {
    const y = year || new Date().getFullYear();
    this.logger.debug({ year: y }, 'earnings:getMonthly');

    const rows = await this.ordersRepo.query(
      `
      SELECT
        EXTRACT(MONTH FROM "createdAt") AS month,
        COALESCE(SUM(CAST("totalAmount" AS numeric)), 0) AS revenue,
        COALESCE(SUM(CAST("totalExpenses" AS numeric)), 0) AS expenses,
        COUNT(*) AS order_count
      FROM "${this.s}".orders
      WHERE EXTRACT(YEAR FROM "createdAt") = $1
        AND status = $2
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
      `,
      [y, OrderStatus.COMPLETED],
    );

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = months.map((name, i) => {
      const row = rows.find((r: any) => parseInt(r.month) === i + 1);
      const revenue = row ? parseFloat(row.revenue) : 0;
      const expenses = row ? parseFloat(row.expenses) : 0;
      return {
        month: name,
        revenue,
        expenses,
        profit: revenue - expenses,
        orderCount: row ? parseInt(row.order_count) : 0,
      };
    });
    this.logger.debug({ year: y, months: result.filter((m) => m.orderCount > 0).length }, 'earnings:getMonthly result');
    return result;
  }

  async getSummary(): Promise<any> {
    this.logger.debug('earnings:getSummary');
    const [totals] = await this.ordersRepo.query(`
      SELECT
        COALESCE(SUM(CAST("totalAmount" AS numeric)), 0) AS total_revenue,
        COALESCE(SUM(CAST("totalExpenses" AS numeric)), 0) AS total_expenses,
        COUNT(*) AS total_orders
      FROM "${this.s}".orders
      WHERE status = '${OrderStatus.COMPLETED}'
    `);

    const [thisMonth] = await this.ordersRepo.query(`
      SELECT
        COALESCE(SUM(CAST("totalAmount" AS numeric)), 0) AS revenue,
        COALESCE(SUM(CAST("totalExpenses" AS numeric)), 0) AS expenses,
        COUNT(*) AS order_count
      FROM "${this.s}".orders
      WHERE status = '${OrderStatus.COMPLETED}'
        AND DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', CURRENT_DATE)
    `);

    const totalRevenue = parseFloat(totals.total_revenue);
    const totalExpenses = parseFloat(totals.total_expenses);
    const monthRevenue = parseFloat(thisMonth.revenue);
    const monthExpenses = parseFloat(thisMonth.expenses);

    const summary = {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalOrders: parseInt(totals.total_orders),
      thisMonth: {
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
        orderCount: parseInt(thisMonth.order_count),
      },
    };
    this.logger.debug({ totalRevenue, netProfit: summary.netProfit }, 'earnings:getSummary result');
    return summary;
  }

  async getByBusinessLine(): Promise<any> {
    this.logger.debug('earnings:getByBusinessLine');
    const rows = await this.itemsRepo.query(`
      SELECT
        oi.type,
        COALESCE(SUM(CAST(oi.subtotal AS numeric)), 0) AS revenue,
        COUNT(DISTINCT oi.order_id) AS order_count
      FROM "${this.s}".order_items oi
      INNER JOIN "${this.s}".orders o ON o.id = oi.order_id
      WHERE o.status = '${OrderStatus.COMPLETED}'
      GROUP BY oi.type
    `);

    const productRow = rows.find((r: any) => r.type === OrderItemType.PRODUCT);
    const serviceRow = rows.find((r: any) => r.type === OrderItemType.SERVICE);

    return {
      products: {
        revenue: productRow ? parseFloat(productRow.revenue) : 0,
        orderCount: productRow ? parseInt(productRow.order_count) : 0,
      },
      services: {
        revenue: serviceRow ? parseFloat(serviceRow.revenue) : 0,
        orderCount: serviceRow ? parseInt(serviceRow.order_count) : 0,
      },
    };
  }

  async getTopProducts(limit = 5): Promise<any[]> {
    this.logger.debug({ limit }, 'earnings:getTopProducts');
    return this.itemsRepo.query(
      `
      SELECT
        oi.reference_id AS "productId",
        oi.name,
        COALESCE(SUM(CAST(oi.subtotal AS numeric)), 0) AS revenue,
        SUM(oi.quantity) AS units_sold
      FROM "${this.s}".order_items oi
      INNER JOIN "${this.s}".orders o ON o.id = oi.order_id
      WHERE oi.type = '${OrderItemType.PRODUCT}'
        AND o.status = '${OrderStatus.COMPLETED}'
      GROUP BY oi.reference_id, oi.name
      ORDER BY revenue DESC
      LIMIT $1
      `,
      [limit],
    );
  }

  async getTopServices(limit = 5): Promise<any[]> {
    this.logger.debug({ limit }, 'earnings:getTopServices');
    return this.itemsRepo.query(
      `
      SELECT
        oi.reference_id AS "serviceId",
        oi.name,
        COALESCE(SUM(CAST(oi.subtotal AS numeric)), 0) AS revenue,
        SUM(oi.quantity) AS count
      FROM "${this.s}".order_items oi
      INNER JOIN "${this.s}".orders o ON o.id = oi.order_id
      WHERE oi.type = '${OrderItemType.SERVICE}'
        AND o.status = '${OrderStatus.COMPLETED}'
      GROUP BY oi.reference_id, oi.name
      ORDER BY revenue DESC
      LIMIT $1
      `,
      [limit],
    );
  }

  async getCustomerLTV(limit = 10): Promise<any[]> {
    // Result contains customerName — that's PII returned to the caller.
    // We do NOT log the result rows; we only log that the query ran.
    this.logger.debug({ limit }, 'earnings:getCustomerLTV');
    return this.ordersRepo.query(
      `
      SELECT
        o.customer_id AS "customerId",
        c.name AS "customerName",
        COALESCE(SUM(CAST(o."totalAmount" AS numeric)), 0) AS total_spent,
        COUNT(o.id) AS order_count
      FROM "${this.s}".orders o
      INNER JOIN "${this.s}".customers c ON c.id = o.customer_id
      WHERE o.status = '${OrderStatus.COMPLETED}'
      GROUP BY o.customer_id, c.name
      ORDER BY total_spent DESC
      LIMIT $1
      `,
      [limit],
    );
  }
}
