import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Service } from '../service-catalog/service.entity';
import { RawMaterial } from '../raw-materials/raw-material.entity';

/**
 * A recipe ties a service to its raw material inputs (per execution).
 * One service can have one active recipe.
 */
@Entity('service_recipes')
export class ServiceRecipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'service_id' })
  serviceId: string;

  /** Optional description, e.g. "Materials used per pleating session" */
  @Column({ nullable: true })
  description: string;

  @OneToMany(() => ServiceRecipeItem, (item) => item.recipe, { cascade: true, eager: true })
  items: ServiceRecipeItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * One line in a service recipe: how much of a raw material is used per service execution.
 */
@Entity('service_recipe_items')
export class ServiceRecipeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServiceRecipe, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: ServiceRecipe;

  @Column({ name: 'recipe_id' })
  recipeId: string;

  @ManyToOne(() => RawMaterial, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'raw_material_id' })
  rawMaterial: RawMaterial;

  @Column({ name: 'raw_material_id' })
  rawMaterialId: string;

  /** Amount of raw material used per service execution (in the raw material's own unit) */
  @Column({ type: 'numeric', precision: 10, scale: 4 })
  quantity: number;
}
