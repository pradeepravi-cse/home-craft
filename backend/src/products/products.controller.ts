import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService, CreateProductDto } from './products.service';
import { BusinessLine } from './product.entity';

// Public endpoint - no auth required
@Controller('public/products')
export class PublicProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  findPublic(@Query('businessLine') businessLine?: BusinessLine) {
    return this.service.findAll(businessLine, true);
  }
}

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  findAll(@Query('businessLine') businessLine?: BusinessLine) {
    return this.service.findAll(businessLine);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
