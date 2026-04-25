import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRecipe, RecipeItem } from './recipe.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { Product } from '../products/product.entity';
import { RawMaterial } from '../raw-materials/raw-material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductRecipe, RecipeItem, Product, RawMaterial])],
  providers: [RecipesService],
  controllers: [RecipesController],
  exports: [RecipesService],
})
export class RecipesModule {}
