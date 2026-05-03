import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Service } from '../service-catalog/service.entity';

@Entity('referral_bonus_configs')
export class ReferralBonusConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  /** The service that becomes free when a bonus is redeemed */
  @Column()
  rewardServiceId: string;

  @ManyToOne(() => Service, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rewardServiceId' })
  rewardService: Service;

  /** How many referrals equal one reward credit */
  @Column({ type: 'int', default: 1 })
  referralsRequired: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
