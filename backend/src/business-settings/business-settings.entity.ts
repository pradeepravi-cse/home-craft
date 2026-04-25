import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * Singleton settings row — always one row with id = 'singleton'.
 */
@Entity('business_settings')
export class BusinessSettings {
  @PrimaryColumn({ default: 'singleton' })
  id: string;

  /**
   * Flat RM fee added as an ELECTRICITY expense for each item in an order.
   */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  electricityRatePerService: number;

  /**
   * Flat RM fee added as a LABOR expense for each item in an order.
   */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  laborRatePerService: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
