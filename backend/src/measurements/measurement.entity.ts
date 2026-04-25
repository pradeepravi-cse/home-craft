import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';

@Entity('measurements')
export class Measurement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, (c) => c.measurements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  palluLength: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  shoulderToNavel: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  waistToFloor: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  bodyWrap: number;

  /** inches | cm */
  @Column({ default: 'inches' })
  unit: string;

  @Column({ nullable: true })
  notes: string;

  /** e.g. "Wedding 2024", "Default" */
  @Column({ nullable: true })
  label: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
