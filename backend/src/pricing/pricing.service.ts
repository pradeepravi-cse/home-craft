import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString, IsOptional, IsBoolean, IsNumber, IsEnum, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PricingRule, DiscountType, PricingCondition } from './pricing-rule.entity';
import { OrderItemType } from '../orders/order-item.entity';

class ConditionsDto implements PricingCondition {
  @IsOptional() @IsString({ each: true }) requiredServiceIds?: string[];
  @IsOptional() @IsString({ each: true }) requiredProductIds?: string[];
  @IsOptional() @IsNumber() minItemCount?: number;
  @IsOptional() @IsNumber() minTotalAmount?: number;
}

export class CreatePricingRuleDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @ValidateNested() @Type(() => ConditionsDto) conditions: ConditionsDto;
  @IsEnum(DiscountType) discountType: DiscountType;
  @IsNumber() discountValue: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdatePricingRuleDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @ValidateNested() @Type(() => ConditionsDto) conditions?: ConditionsDto;
  @IsOptional() @IsEnum(DiscountType) discountType?: DiscountType;
  @IsOptional() @IsNumber() discountValue?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export interface OrderItemInput {
  type: OrderItemType;
  referenceId: string;
  unitPrice: number;
  quantity: number;
}

export interface PricingResult {
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  appliedRules: string[];
}

@Injectable()
export class PricingService {
  constructor(
    @InjectPinoLogger(PricingService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(PricingRule)
    private repo: Repository<PricingRule>,
  ) {}

  async findAll(): Promise<PricingRule[]> {
    this.logger.debug('pricing:findAll');
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<PricingRule> {
    this.logger.debug({ id }, 'pricing:findOne');
    const rule = await this.repo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Pricing rule not found');
    return rule;
  }

  async create(dto: CreatePricingRuleDto): Promise<PricingRule> {
    this.logger.info({ name: dto.name, discountType: dto.discountType, discountValue: dto.discountValue }, 'pricing:create');
    const saved = await this.repo.save(this.repo.create(dto));
    this.logger.info({ id: saved.id, name: saved.name }, 'pricing:created');
    return saved;
  }

  async update(id: string, dto: UpdatePricingRuleDto): Promise<PricingRule> {
    this.logger.info({ id }, 'pricing:update');
    const rule = await this.findOne(id);
    Object.assign(rule, dto);
    const saved = await this.repo.save(rule);
    this.logger.info({ id: saved.id }, 'pricing:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'pricing:remove');
    const rule = await this.findOne(id);
    await this.repo.remove(rule);
    this.logger.info({ id }, 'pricing:removed');
  }

  async calculate(items: OrderItemInput[]): Promise<PricingResult> {
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const rules = await this.repo.find({ where: { isActive: true } });

    const serviceIds = items
      .filter((i) => i.type === OrderItemType.SERVICE)
      .map((i) => i.referenceId);
    const productIds = items
      .filter((i) => i.type === OrderItemType.PRODUCT)
      .map((i) => i.referenceId);
    const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    let discountAmount = 0;
    const appliedRules: string[] = [];

    for (const rule of rules) {
      if (this.conditionsMet(rule.conditions, serviceIds, productIds, totalItemCount, subtotal)) {
        const discount = rule.discountType === DiscountType.PERCENTAGE
          ? (subtotal * Number(rule.discountValue)) / 100
          : Number(rule.discountValue);
        discountAmount += discount;
        appliedRules.push(rule.name);
      }
    }

    discountAmount = Math.min(discountAmount, subtotal);
    const result: PricingResult = {
      subtotal,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round((subtotal - discountAmount) * 100) / 100,
      appliedRules,
    };

    this.logger.debug({ subtotal: result.subtotal, discountAmount: result.discountAmount, appliedRules }, 'pricing:calculate result');
    return result;
  }

  private conditionsMet(
    cond: PricingCondition,
    serviceIds: string[],
    productIds: string[],
    itemCount: number,
    subtotal: number,
  ): boolean {
    if (cond.requiredServiceIds?.length) {
      if (!cond.requiredServiceIds.every((id) => serviceIds.includes(id))) return false;
    }
    if (cond.requiredProductIds?.length) {
      if (!cond.requiredProductIds.every((id) => productIds.includes(id))) return false;
    }
    if (cond.minItemCount !== undefined && itemCount < cond.minItemCount) return false;
    if (cond.minTotalAmount !== undefined && subtotal < cond.minTotalAmount) return false;
    return true;
  }
}
