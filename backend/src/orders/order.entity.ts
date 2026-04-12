import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne,
  JoinColumn, OneToMany
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { Expense } from '../expenses/expense.entity';

export enum OrderType {
  PRE_PLEATING = 'pre_pleating',
  DRAPING = 'draping',
  COMBO = 'combo',
}

export enum OrderStatus {
  RECEIVED = 'received',        // Saree received
  PROCESSING = 'processing',    // Being ironed/pleated
  READY = 'ready',              // Done, waiting for collection
  COLLECTED = 'collected',      // Client collected
  DRAPED = 'draped',            // Draping done
  COMPLETED = 'completed',      // All done
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, (c) => c.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: string;

  @Column({ type: 'enum', enum: OrderType })
  type: OrderType;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.RECEIVED })
  status: OrderStatus;

  @Column({ nullable: true })
  sareeDescription: string; // color, fabric, etc.

  @Column({ nullable: true })
  sareeCount: number;

  // Pricing
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  priceCharged: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  totalExpenses: number;

  // Measurement snapshot
  @Column({ nullable: true })
  measurementId: string;

  @Column({ nullable: true })
  palluLength: number;

  @Column({ nullable: true })
  shoulderToNavel: number;

  @Column({ nullable: true })
  waistToFloor: number;

  @Column({ nullable: true })
  bodyWrap: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  completedDate: Date;

  @OneToMany(() => Expense, (e) => e.order, { cascade: true })
  expenses: Expense[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
