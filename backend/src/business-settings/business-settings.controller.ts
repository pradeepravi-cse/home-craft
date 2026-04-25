import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BusinessSettingsService, UpdateBusinessSettingsDto } from './business-settings.service';

@UseGuards(JwtAuthGuard)
@Controller('business-settings')
export class BusinessSettingsController {
  constructor(private readonly service: BusinessSettingsService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Patch()
  update(@Body() dto: UpdateBusinessSettingsDto) {
    return this.service.update(dto);
  }
}
