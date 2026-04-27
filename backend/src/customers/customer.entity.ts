import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { Measurement } from '../measurements/measurement.entity';

export enum ContactSource {
  WHATSAPP = 'whatsapp',
  INSTAGRAM = 'instagram',
  REFERRAL = 'referral',
  WALK_IN = 'walk-in',
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** Short name / WhatsApp name the customer goes by */
  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  notes: string;

  // email and instagram kept nullable for backward compatibility with existing records
  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ type: 'enum', enum: ContactSource, default: ContactSource.WHATSAPP })
  contactSource: ContactSource;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToMany(() => Measurement, (m) => m.customer)
  measurements: Measurement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
