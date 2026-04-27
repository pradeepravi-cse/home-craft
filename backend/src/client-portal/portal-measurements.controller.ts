import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Measurement } from '../measurements/measurement.entity';
import { ClientAuthGuard } from './client-auth.guard';

@UseGuards(ClientAuthGuard)
@Controller('portal/measurements')
export class PortalMeasurementsController {
  constructor(
    @InjectPinoLogger(PortalMeasurementsController.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Measurement)
    private readonly measurementsRepo: Repository<Measurement>,
  ) {}

  @Get()
  async list(@Request() req: any) {
    const { customerId } = req.user;
    this.logger.debug({ customerId }, 'portal:measurements:list');
    return this.measurementsRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }
}
