import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToMany, ManyToOne, JoinColumn,
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

  /** Who introduced this customer to the business */
  @Column({ nullable: true })
  referredById: string | null;

  @ManyToOne(() => Customer, (c) => c.referrals, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'referredById' })
  referredBy: Customer | null;

  @OneToMany(() => Customer, (c) => c.referredBy)
  referrals: Customer[];

  /** Exclusive offers and priority handling */
  @Column({ default: false })
  isPrivileged: boolean;

  /** True when this customer has a referral benefit (e.g. free pleating) not yet used */
  @Column({ default: false })
  referralBenefitPending: boolean;

  /** Timestamp when the referral benefit was consumed */
  @Column({ type: 'timestamptz', nullable: true })
  referralBenefitUsedAt: Date | null;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToMany(() => Measurement, (m) => m.customer)
  measurements: Measurement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
