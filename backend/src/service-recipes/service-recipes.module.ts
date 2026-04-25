import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRecipe, ServiceRecipeItem } from './service-recipe.entity';
import { ServiceRecipesService } from './service-recipes.service';
import { ServiceRecipesController } from './service-recipes.controller';
import { Service } from '../service-catalog/service.entity';
import { RawMaterial } from '../raw-materials/raw-material.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRecipe, ServiceRecipeItem, Service, RawMaterial]),
  ],
  providers: [ServiceRecipesService],
  controllers: [ServiceRecipesController],
  exports: [ServiceRecipesService],
})
export class ServiceRecipesModule {}
