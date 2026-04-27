import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // Populated only for CLIENT-role users — links them to a customer record
  @Column({ nullable: true, name: 'customer_id', type: 'uuid' })
  customerId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  resetToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  resetTokenExpiry: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
