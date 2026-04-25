import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { IsArray, ValidateNested, IsEnum, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  PricingService,
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
  OrderItemInput,
} from './pricing.service';
import { OrderItemType } from '../orders/order-item.entity';

class CalculateItemDto implements OrderItemInput {
  @IsEnum(OrderItemType) type: OrderItemType;
  @IsString() referenceId: string;
  @IsNumber() unitPrice: number;
  @IsNumber() quantity: number;
}

class CalculatePriceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateItemDto)
  items: CalculateItemDto[];
}

@Controller('pricing-rules')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  findAll() {
    return this.pricingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pricingService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePricingRuleDto) {
    return this.pricingService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePricingRuleDto) {
    return this.pricingService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.pricingService.remove(id);
  }

  /** Preview pricing for a set of items without creating an order */
  @Post('calculate')
  calculate(@Body() dto: CalculatePriceDto) {
    return this.pricingService.calculate(dto.items);
  }
}
