import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum DiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export interface PricingCondition {
  /** All of these service IDs must be present in the order */
  requiredServiceIds?: string[];
  /** All of these product IDs must be present in the order */
  requiredProductIds?: string[];
  /** Minimum number of total items in the order */
  minItemCount?: number;
  /** Minimum combined subtotal before discount */
  minTotalAmount?: number;
}

@Entity('pricing_rules')
export class PricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  /** JSON conditions that must ALL be satisfied to apply this rule */
  @Column({ type: 'jsonb' })
  conditions: PricingCondition;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  /** Flat amount (FIXED) or percentage 0–100 (PERCENTAGE) */
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
