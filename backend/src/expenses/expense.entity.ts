import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';

export enum ExpenseCategory {
  PACKING = 'PACKING',
  SAFETY_PINS = 'SAFETY_PINS',
  IRON = 'IRON',
  ELECTRICITY = 'ELECTRICITY',
  TRANSPORT = 'TRANSPORT',
  MATERIAL = 'MATERIAL',
  LABOR = 'LABOR',
  OTHER = 'OTHER',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (o) => o.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ type: 'enum', enum: ExpenseCategory, default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Column()
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}
