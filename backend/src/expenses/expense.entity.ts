import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { Order } from '../orders/order.entity';

export enum ExpenseCategory {
  PACKING = 'packing',
  SAFETY_PINS = 'safety_pins',
  IRON = 'iron',
  ELECTRICITY = 'electricity',
  TRANSPORT = 'transport',
  MATERIAL = 'material',
  OTHER = 'other',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (o) => o.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;

  @Column({ type: 'enum', enum: ExpenseCategory, default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}
