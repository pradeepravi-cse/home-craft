import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderType, OrderStatus } from './order.entity';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsString()
  clientId: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsOptional()
  @IsString()
  sareeDescription?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sareeCount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceCharged?: number;

  @IsOptional()
  @IsString()
  measurementId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  palluLength?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shoulderToNavel?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  waistToFloor?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  bodyWrap?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  scheduledDate?: Date;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private repo: Repository<Order>,
  ) {}

  async findAll(filters?: { clientId?: string; status?: OrderStatus; type?: OrderType }): Promise<Order[]> {
    const qb = this.repo.createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.expenses', 'expenses')
      .orderBy('order.createdAt', 'DESC');

    if (filters?.clientId) qb.andWhere('order.clientId = :clientId', { clientId: filters.clientId });
    if (filters?.status) qb.andWhere('order.status = :status', { status: filters.status });
    if (filters?.type) qb.andWhere('order.type = :type', { type: filters.type });

    return qb.getMany();
  }

  async findOne(id: string): Promise<Order> {
    const o = await this.repo.findOne({
      where: { id },
      relations: ['client', 'expenses'],
    });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    // Auto-calculate price if not provided
    let price = dto.priceCharged;
    if (!price) {
      const count = dto.sareeCount || 1;
      if (dto.type === OrderType.PRE_PLEATING) {
        price = count === 1 ? 20 : count * 15;
      } else if (dto.type === OrderType.DRAPING) {
        price = 30;
      } else if (dto.type === OrderType.COMBO) {
        // RM15 pleating + RM25 draping (RM5 discount each)
        price = count === 1 ? (15 + 25) : (count * 10 + 25);
      }
    }

    const order = this.repo.create({ ...dto, priceCharged: price });
    return this.repo.save(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    if (status === OrderStatus.COMPLETED || status === OrderStatus.COLLECTED || status === OrderStatus.DRAPED) {
      order.completedDate = new Date();
    }
    return this.repo.save(order);
  }

  async update(id: string, dto: Partial<CreateOrderDto>): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, dto);
    return this.repo.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.repo.remove(order);
  }

  async getStats(): Promise<any> {
    const orders = await this.repo.find({ relations: ['expenses'] });
    const totalRevenue = orders.reduce((s, o) => s + Number(o.priceCharged), 0);
    const totalExpenses = orders.reduce((s, o) => s + Number(o.totalExpenses), 0);
    const activeOrders = orders.filter(o =>
      ![OrderStatus.COMPLETED, OrderStatus.COLLECTED, OrderStatus.DRAPED].includes(o.status)
    ).length;

    return {
      totalOrders: orders.length,
      activeOrders,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }

  async updateTotalExpenses(orderId: string, total: number): Promise<void> {
    await this.repo.update(orderId, { totalExpenses: total });
  }
}
