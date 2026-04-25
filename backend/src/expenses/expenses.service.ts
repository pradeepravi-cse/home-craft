import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Expense, ExpenseCategory } from './expense.entity';

export class CreateExpenseDto {
  @IsString()
  orderId: string;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;
}

export class UpdateExpenseDto {
  @IsOptional() @IsEnum(ExpenseCategory) category?: ExpenseCategory;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Type(() => Number) amount?: number;
}

@Injectable()
export class ExpensesService {
  constructor(
    @InjectPinoLogger(ExpensesService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Expense)
    private repo: Repository<Expense>,
  ) {}

  async findByOrder(orderId: string): Promise<Expense[]> {
    this.logger.debug({ orderId }, 'expenses:findByOrder');
    return this.repo.find({ where: { orderId }, order: { createdAt: 'ASC' } });
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    // Log orderId, category, amount — skip description (may reference customer name)
    this.logger.info({ orderId: dto.orderId, category: dto.category, amount: dto.amount }, 'expenses:create');
    const expense = this.repo.create(dto);
    const saved = await this.repo.save(expense);
    await this.recalcOrderTotal(dto.orderId);
    this.logger.info({ id: saved.id, orderId: saved.orderId }, 'expenses:created');
    return saved;
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    this.logger.info({ id, category: dto.category, amount: dto.amount }, 'expenses:update');
    const expense = await this.repo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    Object.assign(expense, dto);
    const saved = await this.repo.save(expense);
    await this.recalcOrderTotal(expense.orderId);
    this.logger.info({ id: saved.id }, 'expenses:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'expenses:remove');
    const expense = await this.repo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    const orderId = expense.orderId;
    await this.repo.remove(expense);
    await this.recalcOrderTotal(orderId);
    this.logger.info({ id, orderId }, 'expenses:removed');
  }

  async getSummaryByCategory(): Promise<any[]> {
    this.logger.debug('expenses:getSummaryByCategory');
    return this.repo
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('SUM(CAST(expense.amount AS numeric))', 'total')
      .groupBy('expense.category')
      .getRawMany();
  }

  private async recalcOrderTotal(orderId: string): Promise<void> {
    const expenses = await this.repo.find({ where: { orderId } });
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    await this.repo.manager.query(
      'UPDATE orders SET "totalExpenses" = $1 WHERE id = $2',
      [total, orderId],
    );
    this.logger.debug({ orderId, total }, 'expenses:orderTotal recalculated');
  }
}
