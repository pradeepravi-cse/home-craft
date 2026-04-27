import { Controller, Get, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Customer } from '../customers/customer.entity';
import { ClientAuthGuard } from './client-auth.guard';

@UseGuards(ClientAuthGuard)
@Controller('portal/profile')
export class PortalProfileController {
  constructor(
    @InjectPinoLogger(PortalProfileController.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
  ) {}

  @Get()
  async get(@Request() req: any) {
    const { customerId } = req.user;
    const customer = await this.customersRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Profile not found');
    this.logger.debug({ customerId }, 'portal:profile:get');
    // Strip internal fields before returning
    const { ...profile } = customer;
    return profile;
  }
}
