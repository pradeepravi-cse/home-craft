import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Customer, ContactSource } from './customer.entity';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  referredById?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isPrivileged?: boolean;

  @IsOptional()
  @IsBoolean()
  referralBenefitPending?: boolean;

  @IsOptional()
  referralBenefitUsedAt?: Date | null;
}

export interface ReferralStat {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  isPrivileged: boolean;
  referralBenefitPending: boolean;
  referralBenefitUsedAt: Date | null;
  orderCount: number;
  totalSpent: number;
  createdAt: Date;
}

export interface ReferralStats {
  referredBy: { id: string; name: string; nickname: string | null; phone: string | null } | null;
  referrals: ReferralStat[];
  totalReferrals: number;
  totalRevenueFromReferrals: number;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectPinoLogger(CustomersService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Customer)
    private repo: Repository<Customer>,
  ) {}

  async findAll(search?: string): Promise<Customer[]> {
    // Do not log the search string — it may be a name, phone, or handle (all PII)
    this.logger.debug({ hasSearch: !!search }, 'customers:findAll');
    const results = search
      ? await this.repo.find({
          where: [
            { name: ILike(`%${search}%`) },
            { nickname: ILike(`%${search}%`) },
            { phone: ILike(`%${search}%`) },
          ],
          relations: ['measurements', 'referredBy'],
          order: { createdAt: 'DESC' },
        })
      : await this.repo.find({
          relations: ['measurements', 'referredBy'],
          order: { createdAt: 'DESC' },
        });
    this.logger.debug({ count: results.length }, 'customers:findAll result');
    return results;
  }

  async findOne(id: string): Promise<Customer> {
    this.logger.debug({ id }, 'customers:findOne');
    const customer = await this.repo.findOne({
      where: { id },
      relations: ['measurements', 'orders', 'orders.items', 'orders.expenses', 'referredBy', 'referrals'],
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    this.logger.info('customers:create');
    const { referredById, ...rest } = dto;
    const customer = this.repo.create({
      ...rest,
      contactSource: ContactSource.WHATSAPP,
      referredById: referredById ?? null,
      referralBenefitPending: Boolean(referredById),
    });
    const saved = await this.repo.save(customer);
    this.logger.info({ id: saved.id, hasReferral: Boolean(referredById) }, 'customers:created');
    return saved;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    this.logger.info({ id }, 'customers:update');
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    const saved = await this.repo.save(customer);
    this.logger.info({ id: saved.id }, 'customers:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'customers:remove');
    const customer = await this.findOne(id);
    await this.repo.remove(customer);
    this.logger.info({ id }, 'customers:removed');
  }

  async getReferralStats(id: string): Promise<ReferralStats> {
    this.logger.debug({ id }, 'customers:getReferralStats');
    const customer = await this.repo.findOne({
      where: { id },
      relations: ['referredBy', 'referrals', 'referrals.orders'],
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const referrals: ReferralStat[] = customer.referrals.map((r) => {
      const completedOrders = (r.orders ?? []).filter((o) => o.status === 'COMPLETED');
      const totalSpent = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      return {
        id: r.id,
        name: r.name,
        nickname: r.nickname ?? null,
        phone: r.phone ?? null,
        isPrivileged: r.isPrivileged,
        referralBenefitPending: r.referralBenefitPending,
        referralBenefitUsedAt: r.referralBenefitUsedAt ?? null,
        orderCount: (r.orders ?? []).length,
        totalSpent,
        createdAt: r.createdAt,
      };
    });

    const totalRevenueFromReferrals = referrals.reduce((s, r) => s + r.totalSpent, 0);

    return {
      referredBy: customer.referredBy
        ? {
            id: customer.referredBy.id,
            name: customer.referredBy.name,
            nickname: customer.referredBy.nickname ?? null,
            phone: customer.referredBy.phone ?? null,
          }
        : null,
      referrals,
      totalReferrals: referrals.length,
      totalRevenueFromReferrals,
    };
  }

  count(): Promise<number> {
    return this.repo.count();
  }
}
