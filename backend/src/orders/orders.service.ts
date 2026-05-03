import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  IsString, IsOptional, IsEnum, IsArray, ValidateNested,
  IsInt, IsNumber, IsBoolean, Min, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Order, OrderStatus } from './order.entity';
import { OrderItem, OrderItemType } from './order-item.entity';
import { Product } from '../products/product.entity';
import { PricingService } from '../pricing/pricing.service';
import { WorkflowService } from '../workflow/workflow.service';
import { ServiceCatalogService } from '../service-catalog/services.service';
import { ProductRecipe } from '../recipes/recipe.entity';
import { ServiceRecipe } from '../service-recipes/service-recipe.entity';
import { Expense, ExpenseCategory } from '../expenses/expense.entity';
import { BusinessSettings } from '../business-settings/business-settings.entity';

// ---- DTOs ----------------------------------------------------------------

export class CreateOrderItemDto {
  @IsEnum(OrderItemType)
  type: OrderItemType;

  @IsString()
  referenceId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  /** Owner can explicitly override the unit price (e.g. to 0 when applying a referral bonus) */
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPriceOverride?: number;
}

export class CreateOrderDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsBoolean()
  referralBonusApplied?: boolean;

  /** Original price of the bonus service before it was zeroed out */
  @IsOptional()
  @IsNumber()
  @Min(0)
  referralBonusValue?: number;
}

export class UpdateOrderDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() scheduledDate?: string;
}

export class UpdateItemStatusDto {
  @IsString()
  targetStep: string;
}

// ---- Service -------------------------------------------------------------

@Injectable()
export class OrdersService {
  constructor(
    @InjectPinoLogger(OrdersService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private itemsRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    @InjectRepository(ProductRecipe)
    private productRecipeRepo: Repository<ProductRecipe>,
    @InjectRepository(ServiceRecipe)
    private serviceRecipeRepo: Repository<ServiceRecipe>,
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
    @InjectRepository(BusinessSettings)
    private settingsRepo: Repository<BusinessSettings>,
    private pricingService: PricingService,
    private workflowService: WorkflowService,
    private serviceCatalog: ServiceCatalogService,
  ) {}

  async findAll(filters?: {
    customerId?: string;
    status?: OrderStatus;
    referralBonusApplied?: boolean;
  }): Promise<Order[]> {
    this.logger.debug(
      { customerId: filters?.customerId, status: filters?.status, referralBonusApplied: filters?.referralBonusApplied },
      'orders:findAll',
    );
    const query = this.ordersRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.expenses', 'expenses')
      .orderBy('order.createdAt', 'DESC');

    if (filters?.customerId) {
      query.andWhere('order.customerId = :customerId', { customerId: filters.customerId });
    }
    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }
    if (filters?.referralBonusApplied !== undefined) {
      query.andWhere('order.referralBonusApplied = :rba', { rba: filters.referralBonusApplied });
    }

    const results = await query.getMany();
    this.logger.debug({ count: results.length }, 'orders:findAll result');
    return results;
  }

  async findOne(id: string): Promise<Order> {
    this.logger.debug({ id }, 'orders:findOne');
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['customer', 'items', 'expenses'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    // Log customerId and item count — never notes (PII risk)
    this.logger.info({ customerId: dto.customerId, itemCount: dto.items?.length }, 'orders:create');

    if (!dto.items?.length) {
      throw new BadRequestException('An order must have at least one item');
    }

    const resolvedItems = await this.resolveItems(dto.items);

    const pricing = await this.pricingService.calculate(
      resolvedItems.map((i) => ({
        type: i.type,
        referenceId: i.referenceId,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
    );

    const order = this.ordersRepo.create({
      customerId: dto.customerId,
      status: dto.status ?? OrderStatus.PENDING,
      notes: dto.notes,
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      totalAmount: pricing.totalAmount,
      discountAmount: pricing.discountAmount,
      referralBonusApplied: dto.referralBonusApplied ?? false,
      referralBonusValue: dto.referralBonusValue ?? null,
    });

    order.items = resolvedItems.map((ri) =>
      this.itemsRepo.create({
        type: ri.type,
        referenceId: ri.referenceId,
        name: ri.name,
        unitPrice: ri.unitPrice,
        quantity: ri.quantity,
        subtotal: ri.unitPrice * ri.quantity,
        itemStatus: ri.itemStatus,
      }),
    );

    const saved = await this.ordersRepo.save(order);
    await this.createAutoExpenses(saved.id, resolvedItems);

    this.logger.info({
      id: saved.id,
      customerId: saved.customerId,
      status: saved.status,
      totalAmount: saved.totalAmount,
      appliedRules: pricing.appliedRules,
    }, 'orders:created');

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    this.logger.info({ id, status: dto.status }, 'orders:update');
    const order = await this.findOne(id);
    if (dto.status) {
      order.status = dto.status;
      if (
        [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(dto.status) &&
        !order.completedDate
      ) {
        order.completedDate = new Date();
      }
    }
    if (dto.notes !== undefined) order.notes = dto.notes;
    if (dto.scheduledDate !== undefined) {
      order.scheduledDate = new Date(dto.scheduledDate);
    }
    const saved = await this.ordersRepo.save(order);
    this.logger.info({ id: saved.id, status: saved.status }, 'orders:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'orders:remove');
    const order = await this.findOne(id);
    await this.ordersRepo.remove(order);
    this.logger.info({ id }, 'orders:removed');
  }

  async updateItemStatus(
    orderId: string,
    itemId: string,
    dto: UpdateItemStatusDto,
  ): Promise<OrderItem> {
    this.logger.info({ orderId, itemId, targetStep: dto.targetStep }, 'orders:updateItemStatus');
    const order = await this.findOne(orderId);
    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Order item not found');
    if (item.type !== OrderItemType.SERVICE) {
      throw new BadRequestException('Workflow transitions only apply to SERVICE items');
    }

    const service = await this.serviceCatalog.findOne(item.referenceId);
    item.itemStatus = this.workflowService.transition(
      service.workflowDefinition,
      item.itemStatus,
      dto.targetStep,
    );

    const saved = await this.itemsRepo.save(item);
    this.logger.info({ orderId, itemId, newStep: saved.itemStatus }, 'orders:itemStatus updated');
    return saved;
  }

  async getWorkflowState(orderId: string) {
    this.logger.debug({ orderId }, 'orders:getWorkflowState');
    const order = await this.findOne(orderId);
    const serviceItems = order.items.filter((i) => i.type === OrderItemType.SERVICE);

    const states = await Promise.all(
      serviceItems.map(async (item) => {
        const service = await this.serviceCatalog.findOne(item.referenceId);
        return {
          itemId: item.id,
          serviceName: item.name,
          ...this.workflowService.getState(service.workflowDefinition, item.itemStatus),
        };
      }),
    );

    return { orderId, workflowStates: states };
  }

  async recalcExpenses(orderId: string, total: number): Promise<void> {
    this.logger.debug({ orderId, total }, 'orders:recalcExpenses');
    await this.ordersRepo.update(orderId, { totalExpenses: total });
  }

  async getStats() {
    this.logger.debug('orders:getStats');
    const [totalOrders, activeOrders] = await Promise.all([
      this.ordersRepo.count(),
      this.ordersRepo.count({
        where: {
          status: In([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.IN_PROGRESS]),
        },
      }),
    ]);

    const revenueResult = await this.ordersRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(CAST(o.totalAmount AS numeric)), 0)', 'total')
      .where('o.status = :status', { status: OrderStatus.COMPLETED })
      .getRawOne();

    const stats = {
      totalOrders,
      activeOrders,
      totalRevenue: parseFloat(revenueResult.total),
    };
    this.logger.debug(stats, 'orders:getStats result');
    return stats;
  }

  async getReferralBonusStats() {
    this.logger.debug('orders:getReferralBonusStats');
    const result = await this.ordersRepo
      .createQueryBuilder('o')
      .select('COUNT(*)', 'totalOrders')
      .addSelect('COALESCE(SUM(CAST(o.referralBonusValue AS numeric)), 0)', 'totalBonusValue')
      .addSelect('COALESCE(SUM(CAST(o.totalAmount AS numeric)), 0)', 'totalOrderRevenue')
      .where('o.referralBonusApplied = true')
      .getRawOne();

    return {
      totalOrders: parseInt(result.totalOrders, 10),
      totalBonusValue: parseFloat(result.totalBonusValue),
      totalOrderRevenue: parseFloat(result.totalOrderRevenue),
    };
  }

  // ---- Private helpers ---------------------------------------------------

  private async resolveItems(dtos: CreateOrderItemDto[]) {
    const results: Array<{
      type: OrderItemType;
      referenceId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      itemStatus: string | null;
    }> = [];

    for (const dto of dtos) {
      if (dto.type === OrderItemType.SERVICE) {
        const service = await this.serviceCatalog.findOne(dto.referenceId);
        if (!service.isActive) {
          throw new BadRequestException(`Service "${service.name}" is not currently active`);
        }

        const otherServiceIds = dtos
          .filter((d) => d.type === OrderItemType.SERVICE && d.referenceId !== dto.referenceId)
          .map((d) => d.referenceId);
        this.workflowService.validateDependencies(service.workflowDefinition, otherServiceIds);

        results.push({
          type: OrderItemType.SERVICE,
          referenceId: service.id,
          name: service.name,
          unitPrice: dto.unitPriceOverride !== undefined ? dto.unitPriceOverride : Number(service.basePrice),
          quantity: dto.quantity,
          itemStatus: this.workflowService.getInitialStep(service.workflowDefinition),
        });
      } else {
        const product = await this.productsRepo.findOne({ where: { id: dto.referenceId } });
        if (!product) throw new NotFoundException(`Product ${dto.referenceId} not found`);
        if (!product.isActive) {
          throw new BadRequestException(`Product "${product.name}" is not currently active`);
        }
        results.push({
          type: OrderItemType.PRODUCT,
          referenceId: product.id,
          name: product.name,
          unitPrice: Number(product.price),
          quantity: dto.quantity,
          itemStatus: null,
        });
      }
    }

    return results;
  }

  private async createAutoExpenses(
    orderId: string,
    resolvedItems: Array<{
      type: OrderItemType;
      referenceId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      itemStatus: string | null;
    }>,
  ): Promise<void> {
    const expensesToCreate: Array<{
      orderId: string;
      category: ExpenseCategory;
      description: string;
      amount: number;
    }> = [];

    const settings = await this.settingsRepo.findOne({ where: { id: 'singleton' } });
    const electricityRate = settings ? Number(settings.electricityRatePerService) : 0;
    const laborRate = settings ? Number(settings.laborRatePerService) : 0;

    for (const item of resolvedItems) {
      const qty = item.quantity;

      if (item.type === OrderItemType.PRODUCT) {
        const recipe = await this.productRecipeRepo.findOne({
          where: { productId: item.referenceId },
          relations: ['items', 'items.rawMaterial'],
        });
        if (recipe && recipe.items.length > 0) {
          for (const recipeItem of recipe.items) {
            const m = recipeItem.rawMaterial;
            const costPerProduct =
              (Number(m.costPerUnit) * Number(recipeItem.quantity)) / Number(recipe.batchYield);
            const amount = Math.round(costPerProduct * qty * 100) / 100;
            if (amount > 0) {
              expensesToCreate.push({
                orderId,
                category: this.mapToExpenseCategory(m.category, m.name),
                description: `${m.name} (${item.name} ×${qty})`,
                amount,
              });
            }
          }
        }
        if (electricityRate > 0) {
          expensesToCreate.push({
            orderId,
            category: ExpenseCategory.ELECTRICITY,
            description: `Electricity (${item.name} ×${qty})`,
            amount: Math.round(electricityRate * qty * 100) / 100,
          });
        }
        if (laborRate > 0) {
          expensesToCreate.push({
            orderId,
            category: ExpenseCategory.LABOR,
            description: `Labour (${item.name} ×${qty})`,
            amount: Math.round(laborRate * qty * 100) / 100,
          });
        }
      } else if (item.type === OrderItemType.SERVICE) {
        const recipe = await this.serviceRecipeRepo.findOne({
          where: { serviceId: item.referenceId },
          relations: ['items', 'items.rawMaterial'],
        });
        if (recipe && recipe.items.length > 0) {
          for (const recipeItem of recipe.items) {
            const m = recipeItem.rawMaterial;
            const amount = Math.round(Number(m.costPerUnit) * Number(recipeItem.quantity) * qty * 100) / 100;
            if (amount > 0) {
              expensesToCreate.push({
                orderId,
                category: this.mapToExpenseCategory(m.category, m.name),
                description: `${m.name} (${item.name} ×${qty})`,
                amount,
              });
            }
          }
        }
        if (electricityRate > 0) {
          expensesToCreate.push({
            orderId,
            category: ExpenseCategory.ELECTRICITY,
            description: `Electricity (${item.name} ×${qty})`,
            amount: Math.round(electricityRate * qty * 100) / 100,
          });
        }
        if (laborRate > 0) {
          expensesToCreate.push({
            orderId,
            category: ExpenseCategory.LABOR,
            description: `Labour (${item.name} ×${qty})`,
            amount: Math.round(laborRate * qty * 100) / 100,
          });
        }
      }
    }

    if (expensesToCreate.length > 0) {
      await this.expenseRepo.save(
        expensesToCreate.map((e) => this.expenseRepo.create(e)),
      );
      const total = expensesToCreate.reduce((s, e) => s + e.amount, 0);
      await this.ordersRepo.update(orderId, {
        totalExpenses: Math.round(total * 100) / 100,
      });
      this.logger.debug({ orderId, expenseCount: expensesToCreate.length, total }, 'orders:autoExpenses created');
    }
  }

  private mapToExpenseCategory(materialCategory: string, materialName: string): ExpenseCategory {
    if (materialCategory === 'PACKAGING') return ExpenseCategory.PACKING;
    const lower = materialName.toLowerCase();
    if (lower.includes('electric') || lower.includes('power') || lower.includes('utility')) {
      return ExpenseCategory.ELECTRICITY;
    }
    if (lower.includes('safety pin') || lower.includes('pin')) return ExpenseCategory.SAFETY_PINS;
    return ExpenseCategory.MATERIAL;
  }
}
