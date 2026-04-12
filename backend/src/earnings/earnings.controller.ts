import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EarningsService } from './earnings.service';

@Controller('earnings')
@UseGuards(JwtAuthGuard)
export class EarningsController {
  constructor(private service: EarningsService) {}

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('monthly')
  getMonthly(@Query('year') year?: number) {
    return this.service.getMonthly(year ? parseInt(year as any) : undefined);
  }

  @Get('by-type')
  getByType() {
    return this.service.getByType();
  }
}
