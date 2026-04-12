import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { Measurement } from '../measurements/measurement.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: 'whatsapp' })
  contactSource: string; // whatsapp | instagram

  @OneToMany(() => Order, (order) => order.client)
  orders: Order[];

  @OneToMany(() => Measurement, (m) => m.client)
  measurements: Measurement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
