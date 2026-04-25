import {
  Controller, Get, Put, Delete, Body, Param,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServiceRecipesService, UpsertServiceRecipeDto } from './service-recipes.service';

@UseGuards(JwtAuthGuard)
@Controller('service-recipes')
export class ServiceRecipesController {
  constructor(private readonly service: ServiceRecipesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('service/:serviceId')
  findByService(@Param('serviceId') serviceId: string) {
    return this.service.findByService(serviceId);
  }

  @Get('service/:serviceId/cost')
  calculateCost(@Param('serviceId') serviceId: string) {
    return this.service.calculateCost(serviceId);
  }

  @Put('service/:serviceId')
  upsert(
    @Param('serviceId') serviceId: string,
    @Body() dto: UpsertServiceRecipeDto,
  ) {
    return this.service.upsert(serviceId, dto);
  }

  @Delete('service/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('serviceId') serviceId: string) {
    return this.service.delete(serviceId);
  }
}
