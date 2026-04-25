import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum RawMaterialCategory {
  INGREDIENT = 'INGREDIENT',
  PACKAGING = 'PACKAGING',
  OVERHEAD = 'OVERHEAD',
}

@Entity('raw_materials')
export class RawMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** Storage unit — what you buy/stock in: kg, g, ml, L, pcs, roll */
  @Column()
  unit: string;

  /** Cost per one unit (e.g. RM 8.50 per kg) */
  @Column({ type: 'numeric', precision: 10, scale: 4 })
  costPerUnit: number;

  @Column({ type: 'enum', enum: RawMaterialCategory, default: RawMaterialCategory.INGREDIENT })
  category: RawMaterialCategory;

  @Column({ type: 'numeric', precision: 10, scale: 3, default: 0 })
  currentStock: number;

  @Column({ type: 'numeric', precision: 10, scale: 3, default: 0 })
  minStock: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
