import {
  Controller, Get, Put, Delete, Post,
  Param, Body, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { RecipesService, UpsertRecipeDto } from './recipes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly svc: RecipesService) {}

  /** All recipes (for the recipes overview page) */
  @Get()
  findAll() {
    return this.svc.findAll();
  }

  /** Recipe for a specific product */
  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.svc.findByProduct(productId);
  }

  /** Calculated cost for a product's saved recipe */
  @Get('product/:productId/cost')
  calculateCost(@Param('productId') productId: string) {
    return this.svc.calculateCost(productId);
  }

  /** Preview cost without saving (pass recipe items in body) */
  @Post('preview-cost')
  @HttpCode(HttpStatus.OK)
  previewCost(@Body() dto: UpsertRecipeDto) {
    return this.svc.previewCost(dto);
  }

  /** Create or replace recipe for a product */
  @Put('product/:productId')
  upsert(@Param('productId') productId: string, @Body() dto: UpsertRecipeDto) {
    return this.svc.upsert(productId, dto);
  }

  /** Delete recipe for a product */
  @Delete('product/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('productId') productId: string) {
    return this.svc.delete(productId);
  }
}
