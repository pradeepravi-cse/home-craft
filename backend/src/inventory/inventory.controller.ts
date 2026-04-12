import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService, CreateTransactionDto } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get('stock')
  getStock(@Query('productId') productId?: string) {
    return this.service.getStock(productId);
  }

  @Get('low-stock')
  getLowStock() {
    return this.service.getLowStock();
  }

  @Get('transactions/:productId')
  getTransactions(@Param('productId') productId: string) {
    return this.service.getTransactions(productId);
  }

  @Post('transaction')
  addTransaction(@Body() dto: CreateTransactionDto) {
    return this.service.addTransaction(dto);
  }

  @Patch('min-stock/:productId')
  setMinStock(@Param('productId') productId: string, @Body('minStock') minStock: number) {
    return this.service.setMinStock(productId, minStock);
  }
}
