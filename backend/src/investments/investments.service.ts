import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Investment, InvestmentCategory } from './investment.entity';
import { Order, OrderStatus } from '../orders/order.entity';

export class CreateInvestmentDto {
  @IsString() description: string;
  @IsEnum(InvestmentCategory) category: InvestmentCategory;
  @IsNumber() @Min(0.01) @Type(() => Number) amount: number;
  @IsDateString() investedAt: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateInvestmentDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(InvestmentCategory) category?: InvestmentCategory;
  @IsOptional() @IsNumber() @Min(0.01) @Type(() => Number) amount?: number;
  @IsOptional() @IsDateString() investedAt?: string;
  @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class InvestmentsService {
  private readonly s: string;

  constructor(
    @InjectPinoLogger(InvestmentsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Investment) private repo: Repository<Investment>,
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
  ) {
    this.s = process.env.DB_SCHEMA || 'public';
  }

  async findAll(): Promise<Investment[]> {
    this.logger.debug('investments:findAll');
    const results = await this.repo.find({ order: { investedAt: 'DESC' } });
    this.logger.debug({ count: results.length }, 'investments:findAll result');
    return results;
  }

  async create(dto: CreateInvestmentDto): Promise<Investment> {
    // description and notes may contain freeform text — log only safe fields
    this.logger.info({ category: dto.category, amount: dto.amount }, 'investments:create');
    const inv = this.repo.create({ ...dto, investedAt: new Date(dto.investedAt) });
    const saved = await this.repo.save(inv);
    this.logger.info({ id: saved.id, category: saved.category, amount: saved.amount }, 'investments:created');
    return saved;
  }

  async update(id: string, dto: UpdateInvestmentDto): Promise<Investment> {
    this.logger.info({ id, category: dto.category, amount: dto.amount }, 'investments:update');
    const inv = await this.repo.findOne({ where: { id } });
    if (!inv) throw new NotFoundException('Investment not found');
    if (dto.investedAt) (dto as any).investedAt = new Date(dto.investedAt);
    Object.assign(inv, dto);
    const saved = await this.repo.save(inv);
    this.logger.info({ id: saved.id }, 'investments:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'investments:remove');
    const inv = await this.repo.findOne({ where: { id } });
    if (!inv) throw new NotFoundException('Investment not found');
    await this.repo.remove(inv);
    this.logger.info({ id }, 'investments:removed');
  }

  async getSummary(): Promise<any> {
    this.logger.debug('investments:getSummary');
    const [invTotals] = await this.repo.query(`
      SELECT
        COALESCE(SUM(CAST(amount AS numeric)), 0) AS total_invested,
        COUNT(*) AS investment_count
      FROM "${this.s}".investments
    `);

    const [profitTotals] = await this.ordersRepo.query(`
      SELECT
        COALESCE(SUM(CAST("totalAmount" AS numeric)), 0) AS total_revenue,
        COALESCE(SUM(CAST("totalExpenses" AS numeric)), 0) AS total_expenses
      FROM "${this.s}".orders
      WHERE status = '${OrderStatus.COMPLETED}'
    `);

    const totalInvested = parseFloat(invTotals.total_invested);
    const totalRevenue = parseFloat(profitTotals.total_revenue);
    const totalExpenses = parseFloat(profitTotals.total_expenses);
    const totalProfit = totalRevenue - totalExpenses;
    const recoveryPct = totalInvested > 0
      ? Math.round((totalProfit / totalInvested) * 100)
      : 0;

    const monthlyRows = await this.ordersRepo.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS ym,
        COALESCE(SUM(CAST("totalAmount" AS numeric) - CAST("totalExpenses" AS numeric)), 0) AS profit
      FROM "${this.s}".orders
      WHERE status = '${OrderStatus.COMPLETED}'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY ym
    `);

    let cumulative = 0;
    const growthSeries = monthlyRows.map((r: any) => {
      cumulative += parseFloat(r.profit);
      return { period: r.ym, monthlyProfit: parseFloat(r.profit), cumulativeProfit: Math.round(cumulative * 100) / 100 };
    });

    const categoryBreakdown = await this.repo.query(`
      SELECT category, COALESCE(SUM(CAST(amount AS numeric)), 0) AS total
      FROM "${this.s}".investments
      GROUP BY category
      ORDER BY total DESC
    `);

    const summary = {
      totalInvested,
      totalRevenue,
      totalExpenses,
      totalProfit,
      recoveryPct,
      breakEven: totalProfit >= totalInvested,
      investmentCount: parseInt(invTotals.investment_count),
      growthSeries,
      categoryBreakdown: categoryBreakdown.map((r: any) => ({
        category: r.category,
        total: parseFloat(r.total),
      })),
    };
    this.logger.debug({ totalInvested, recoveryPct }, 'investments:getSummary result');
    return summary;
  }
}
