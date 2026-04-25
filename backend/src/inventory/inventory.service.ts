import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InventoryTransaction, InventoryStock, InventoryTxType } from './inventory.entity';

export class CreateTransactionDto {
  @IsString()
  productId: string;

  @IsEnum(InventoryTxType)
  type: InventoryTxType;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitCost?: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectPinoLogger(InventoryService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(InventoryTransaction)
    private txRepo: Repository<InventoryTransaction>,
    @InjectRepository(InventoryStock)
    private stockRepo: Repository<InventoryStock>,
  ) {}

  async getStock(productId?: string): Promise<InventoryStock[]> {
    this.logger.debug({ productId }, 'inventory:getStock');
    const qb = this.stockRepo
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .orderBy('product.name', 'ASC');
    if (productId) qb.where('stock.productId = :productId', { productId });
    return qb.getMany();
  }

  async getLowStock(): Promise<InventoryStock[]> {
    this.logger.debug('inventory:getLowStock');
    const results = await this.stockRepo
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .where('stock.currentStock <= stock.minStock')
      .getMany();
    this.logger.debug({ count: results.length }, 'inventory:getLowStock result');
    return results;
  }

  async getTransactions(productId: string): Promise<InventoryTransaction[]> {
    this.logger.debug({ productId }, 'inventory:getTransactions');
    return this.txRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async addTransaction(dto: CreateTransactionDto): Promise<InventoryTransaction> {
    this.logger.info({ productId: dto.productId, type: dto.type, quantity: dto.quantity }, 'inventory:addTransaction');
    const tx = this.txRepo.create(dto);
    const saved = await this.txRepo.save(tx);
    await this.updateStock(dto.productId, dto.type, dto.quantity);
    this.logger.info({ id: saved.id, productId: dto.productId, type: dto.type }, 'inventory:transactionAdded');
    return saved;
  }

  async setMinStock(productId: string, minStock: number): Promise<InventoryStock> {
    this.logger.info({ productId, minStock }, 'inventory:setMinStock');
    let stock = await this.stockRepo.findOne({ where: { productId } });
    if (!stock) {
      stock = this.stockRepo.create({ productId, currentStock: 0, minStock });
    } else {
      stock.minStock = minStock;
    }
    const saved = await this.stockRepo.save(stock);
    this.logger.info({ productId, minStock: saved.minStock }, 'inventory:minStockSet');
    return saved;
  }

  private async updateStock(productId: string, type: InventoryTxType, quantity: number): Promise<void> {
    let stock = await this.stockRepo.findOne({ where: { productId } });
    if (!stock) {
      stock = this.stockRepo.create({ productId, currentStock: 0, minStock: 0 });
    }
    const before = Number(stock.currentStock);
    if (type === InventoryTxType.IN) {
      stock.currentStock = before + Number(quantity);
    } else if (type === InventoryTxType.OUT) {
      stock.currentStock = Math.max(0, before - Number(quantity));
    } else {
      stock.currentStock = Number(quantity);
    }
    await this.stockRepo.save(stock);
    this.logger.debug({ productId, type, before, after: stock.currentStock }, 'inventory:stockUpdated');
  }
}
