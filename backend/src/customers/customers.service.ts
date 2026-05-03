import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { IsString, IsOptional, IsBoolean, IsUUID, IsInt, Min } from 'class-validator';
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

  /** The existing customer who introduced this new customer */
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
  @IsInt()
  @Min(0)
  referralBonusUsed?: number;

  /** Update or clear the referral source for an existing customer */
  @IsOptional()
  @IsUUID()
  referredById?: string | null;
}

export interface ReferralStat {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  isPrivileged: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: Date;
}

export interface ReferralStats {
  referredBy: { id: string; name: string; nickname: string | null; phone: string | null } | null;
  referrals: ReferralStat[];
  totalReferrals: number;
  totalRevenueFromReferrals: number;
  /** Earned but unused reward credits (based on active bonus config ratio) */
  availableCredits: number;
  referralBonusUsed: number;
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

    if (referredById) {
      const referrer = await this.repo.findOne({ where: { id: referredById } });
      if (!referrer) throw new NotFoundException('Referrer customer not found');
    }

    const customer = this.repo.create({
      ...rest,
      contactSource: ContactSource.WHATSAPP,
      referredById: referredById ?? null,
    });
    const saved = await this.repo.save(customer);
    this.logger.info({ id: saved.id, referredById: referredById ?? null }, 'customers:created');
    return saved;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    this.logger.info({ id }, 'customers:update');
    const customer = await this.findOne(id);
    const { referredById, ...rest } = dto;
    Object.assign(customer, rest);
    // Handle referredById explicitly — null must also clear the loaded relation
    // object, otherwise TypeORM uses the in-memory relation to re-derive the FK.
    if ('referredById' in dto) {
      customer.referredById = referredById ?? null;
      customer.referredBy = referredById ? customer.referredBy : null;
    }
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

  /**
   * Redeem one referral bonus credit for the customer (as referrer).
   * Caller must verify the customer actually has available credits before calling.
   */
  async redeemReferralBonus(id: string): Promise<{ referralBonusUsed: number }> {
    this.logger.info({ id }, 'customers:redeemReferralBonus');
    const customer = await this.findOne(id);
    if (customer.referralBonusUsed === undefined) {
      throw new BadRequestException('Customer has no referral bonus tracking');
    }
    customer.referralBonusUsed = (customer.referralBonusUsed ?? 0) + 1;
    await this.repo.save(customer);
    this.logger.info({ id, referralBonusUsed: customer.referralBonusUsed }, 'customers:bonusRedeemed');
    return { referralBonusUsed: customer.referralBonusUsed };
  }

  /**
   * Returns referral network stats.
   * availableCredits is computed with a default ratio of 1:1 if no config is provided.
   * The frontend passes the active config's referralsRequired after fetching it separately.
   */
  async getReferralStats(id: string, referralsRequired = 1): Promise<ReferralStats> {
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
        orderCount: (r.orders ?? []).length,
        totalSpent,
        createdAt: r.createdAt,
      };
    });

    const totalReferrals = referrals.length;
    const totalRevenueFromReferrals = referrals.reduce((s, r) => s + r.totalSpent, 0);
    const earned = Math.floor(totalReferrals / referralsRequired);
    const availableCredits = Math.max(0, earned - (customer.referralBonusUsed ?? 0));

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
      totalReferrals,
      totalRevenueFromReferrals,
      availableCredits,
      referralBonusUsed: customer.referralBonusUsed ?? 0,
    };
  }

  count(): Promise<number> {
    return this.repo.count();
  }
}
