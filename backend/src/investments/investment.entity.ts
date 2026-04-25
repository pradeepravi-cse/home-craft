import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum InvestmentCategory {
  EQUIPMENT = 'EQUIPMENT',
  INVENTORY = 'INVENTORY',
  MARKETING = 'MARKETING',
  TOOLS = 'TOOLS',
  TRAINING = 'TRAINING',
  OTHER = 'OTHER',
}

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: InvestmentCategory, default: InvestmentCategory.OTHER })
  category: InvestmentCategory;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  /** Date the investment was made */
  @Column({ type: 'date' })
  investedAt: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
