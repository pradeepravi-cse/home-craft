import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum ProductCategory {
  COOKIES = 'COOKIES',
  CAKES = 'CAKES',
  BROWNIES = 'BROWNIES',
  PUFFS = 'PUFFS',
  OTHER = 'OTHER',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ProductCategory, default: ProductCategory.OTHER })
  category: ProductCategory;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  /** e.g. "per piece", "per dozen", "per box" */
  @Column({ nullable: true })
  unit: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
