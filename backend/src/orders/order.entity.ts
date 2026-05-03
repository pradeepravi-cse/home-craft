import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { OrderItem } from './order-item.entity';
import { Expense } from '../expenses/expense.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, (c) => c.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  /** Sum of all item subtotals after discount */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  /** Total discount applied by pricing rules */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  /** Sum of linked Expense amounts */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalExpenses: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  completedDate: Date;

  /** True when a referral bonus was applied to at least one item in this order */
  @Column({ default: false })
  referralBonusApplied: boolean;

  /** Face value of the service(s) given free via referral bonus (for analytics) */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  referralBonusValue: number | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Expense, (e) => e.order)
  expenses: Expense[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
