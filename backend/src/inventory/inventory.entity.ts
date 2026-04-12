import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { Product } from '../products/product.entity';

export enum InventoryTxType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
}

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;

  @Column({ type: 'enum', enum: InventoryTxType })
  type: InventoryTxType;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  quantity: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  unitCost: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('inventory_stock')
export class InventoryStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ unique: true })
  productId: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  currentStock: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  minStock: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
