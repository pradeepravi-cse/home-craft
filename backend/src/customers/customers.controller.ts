import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomersService, CreateCustomerDto, UpdateCustomerDto } from './customers.service';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id/referral-stats')
  getReferralStats(@Param('id') id: string, @Query('referralsRequired') referralsRequired?: string) {
    return this.customersService.getReferralStats(id, referralsRequired ? parseInt(referralsRequired, 10) : 1);
  }

  @Post(':id/redeem-referral-bonus')
  @HttpCode(HttpStatus.OK)
  redeemReferralBonus(@Param('id') id: string) {
    return this.customersService.redeemReferralBonus(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
