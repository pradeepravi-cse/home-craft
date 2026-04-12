import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

export enum ProductCategory {
  COOKIES = 'cookies',
  CAKES = 'cakes',
  BROWNIES = 'brownies',
  PUFFS = 'puffs',
  OTHER = 'other',
}

export enum BusinessLine {
  SAREE = 'saree',
  BAKING = 'baking',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: BusinessLine, default: BusinessLine.BAKING })
  businessLine: BusinessLine;

  @Column({ type: 'enum', enum: ProductCategory, nullable: true })
  category: ProductCategory;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  costPrice: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isPublic: boolean; // visible on public API

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  unit: string; // e.g. "per piece", "per dozen", "per box"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
