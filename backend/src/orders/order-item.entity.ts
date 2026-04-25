import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum OrderItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ type: 'enum', enum: OrderItemType })
  type: OrderItemType;

  /** UUID of the referenced Product or Service */
  @Column({ name: 'reference_id' })
  referenceId: string;

  /** Snapshot of name at time of order */
  @Column()
  name: string;

  /** Snapshot of price at time of order */
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: number;

  /**
   * Current workflow step for SERVICE items.
   * Null for PRODUCT items.
   */
  @Column({ name: 'item_status', nullable: true })
  itemStatus: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
