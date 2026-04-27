import { Controller, Get, Param, NotFoundException, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Order } from '../orders/order.entity';
import { ClientAuthGuard } from './client-auth.guard';

@UseGuards(ClientAuthGuard)
@Controller('portal/orders')
export class PortalOrdersController {
  constructor(
    @InjectPinoLogger(PortalOrdersController.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
  ) {}

  @Get()
  async list(@Request() req: any) {
    const { customerId } = req.user;
    this.logger.debug({ customerId }, 'portal:orders:list');
    return this.ordersRepo.find({
      where: { customerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':id')
  async get(@Param('id') id: string, @Request() req: any) {
    const { customerId } = req.user;
    const order = await this.ordersRepo.findOne({
      where: { id, customerId }, // customerId scoping prevents accessing other customers' orders
      relations: ['items', 'expenses'],
    });
    if (!order) throw new NotFoundException('Order not found');
    this.logger.debug({ customerId, orderId: id }, 'portal:orders:get');
    return order;
  }
}
