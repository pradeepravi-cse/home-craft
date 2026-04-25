import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { ProductRecipe, RecipeItem } from '../recipes/recipe.entity';
import { ServiceRecipe, ServiceRecipeItem } from '../service-recipes/service-recipe.entity';
import { Expense } from '../expenses/expense.entity';
import { BusinessSettings } from '../business-settings/business-settings.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PricingModule } from '../pricing/pricing.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { ServiceCatalogModule } from '../service-catalog/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, OrderItem, Product,
      ProductRecipe, RecipeItem,
      ServiceRecipe, ServiceRecipeItem,
      Expense, BusinessSettings,
    ]),
    PricingModule,
    WorkflowModule,
    ServiceCatalogModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
