import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService, CreateOrderDto, UpdateOrderStatusDto } from './orders.service';
import { OrderStatus, OrderType } from './order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Get()
  findAll(
    @Query('clientId') clientId?: string,
    @Query('status') status?: OrderStatus,
    @Query('type') type?: OrderType,
  ) {
    return this.service.findAll({ clientId, status, type });
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateOrderDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
