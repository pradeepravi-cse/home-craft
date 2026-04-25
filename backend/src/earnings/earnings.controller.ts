import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EarningsService } from './earnings.service';

@Controller('earnings')
@UseGuards(JwtAuthGuard)
export class EarningsController {
  constructor(private readonly service: EarningsService) {}

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('monthly')
  getMonthly(@Query('year') year?: string) {
    return this.service.getMonthly(year ? parseInt(year) : undefined);
  }

  /** Revenue split: Products vs Services */
  @Get('by-business-line')
  getByBusinessLine() {
    return this.service.getByBusinessLine();
  }

  @Get('top-products')
  getTopProducts(@Query('limit') limit?: string) {
    return this.service.getTopProducts(limit ? parseInt(limit) : 5);
  }

  @Get('top-services')
  getTopServices(@Query('limit') limit?: string) {
    return this.service.getTopServices(limit ? parseInt(limit) : 5);
  }

  @Get('customer-ltv')
  getCustomerLTV(@Query('limit') limit?: string) {
    return this.service.getCustomerLTV(limit ? parseInt(limit) : 10);
  }
}
