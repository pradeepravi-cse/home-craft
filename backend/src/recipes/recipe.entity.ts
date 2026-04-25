import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { RawMaterial } from '../raw-materials/raw-material.entity';

/**
 * A recipe ties a finished product to its raw material inputs.
 * One product can have one active recipe.
 */
@Entity('product_recipes')
export class ProductRecipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  /** Description of what one batch produces, e.g. "300g box of 10 cookies" */
  @Column({ nullable: true })
  batchDescription: string;

  /** How many finished sellable units does one batch produce */
  @Column({ type: 'numeric', precision: 8, scale: 2, default: 1 })
  batchYield: number;

  /** Target gross margin percentage (e.g. 40 = 40%) */
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 40 })
  targetMarginPct: number;

  @OneToMany(() => RecipeItem, (item) => item.recipe, { cascade: true, eager: true })
  items: RecipeItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * One line in a recipe: how much of a raw material is used per batch.
 */
@Entity('recipe_items')
export class RecipeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductRecipe, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: ProductRecipe;

  @Column({ name: 'recipe_id' })
  recipeId: string;

  @ManyToOne(() => RawMaterial, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'raw_material_id' })
  rawMaterial: RawMaterial;

  @Column({ name: 'raw_material_id' })
  rawMaterialId: string;

  /** Amount of raw material used per batch (in the raw material's own unit) */
  @Column({ type: 'numeric', precision: 10, scale: 4 })
  quantity: number;
}
