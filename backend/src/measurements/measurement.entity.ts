import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { Client } from '../clients/client.entity';

@Entity('measurements')
export class Measurement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, (c) => c.measurements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: string;

  // Core saree measurements
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  palluLength: number; // in inches or cm

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  shoulderToNavel: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  waistToFloor: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bodyWrap: number;

  @Column({ default: 'inches' })
  unit: string; // inches | cm

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  label: string; // e.g. "Wedding 2024", "Default"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
