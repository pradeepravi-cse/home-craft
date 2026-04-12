import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseCategory } from './expense.entity';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private repo: Repository<Expense>,
  ) {}

  async findByOrder(orderId: string): Promise<Expense[]> {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'ASC' } });
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const expense = this.repo.create(dto);
    const saved = await this.repo.save(expense);
    await this.recalcOrderTotal(dto.orderId);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const expense = await this.repo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    const orderId = expense.orderId;
    await this.repo.remove(expense);
    await this.recalcOrderTotal(orderId);
  }

  private async recalcOrderTotal(orderId: string): Promise<void> {
    const expenses = await this.repo.find({ where: { orderId } });
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    // Use raw query to avoid circular dep
    await this.repo.query(
      'UPDATE orders SET "totalExpenses" = $1 WHERE id = $2',
      [total, orderId]
    );
  }

  async getSummaryByCategory(): Promise<any[]> {
    return this.repo.createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('SUM(expense.amount)', 'total')
      .groupBy('expense.category')
      .getRawMany();
  }
}
