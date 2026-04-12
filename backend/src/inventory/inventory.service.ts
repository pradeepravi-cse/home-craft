import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTransaction, InventoryStock, InventoryTxType } from './inventory.entity';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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
    @InjectRepository(InventoryTransaction)
    private txRepo: Repository<InventoryTransaction>,
    @InjectRepository(InventoryStock)
    private stockRepo: Repository<InventoryStock>,
  ) {}

  async getStock(productId?: string): Promise<InventoryStock[]> {
    const qb = this.stockRepo.createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .orderBy('product.name', 'ASC');
    if (productId) qb.where('stock.productId = :productId', { productId });
    return qb.getMany();
  }

  async getLowStock(): Promise<InventoryStock[]> {
    return this.stockRepo.createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .where('stock.currentStock <= stock.minStock')
      .getMany();
  }

  async getTransactions(productId: string): Promise<InventoryTransaction[]> {
    return this.txRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async addTransaction(dto: CreateTransactionDto): Promise<InventoryTransaction> {
    const tx = this.txRepo.create(dto);
    const saved = await this.txRepo.save(tx);
    await this.updateStock(dto.productId, dto.type, dto.quantity);
    return saved;
  }

  async setMinStock(productId: string, minStock: number): Promise<InventoryStock> {
    let stock = await this.stockRepo.findOne({ where: { productId } });
    if (!stock) {
      stock = this.stockRepo.create({ productId, currentStock: 0, minStock });
    } else {
      stock.minStock = minStock;
    }
    return this.stockRepo.save(stock);
  }

  private async updateStock(productId: string, type: InventoryTxType, quantity: number): Promise<void> {
    let stock = await this.stockRepo.findOne({ where: { productId } });
    if (!stock) {
      stock = this.stockRepo.create({ productId, currentStock: 0, minStock: 0 });
    }
    if (type === InventoryTxType.IN) {
      stock.currentStock = Number(stock.currentStock) + Number(quantity);
    } else if (type === InventoryTxType.OUT) {
      stock.currentStock = Math.max(0, Number(stock.currentStock) - Number(quantity));
    } else {
      stock.currentStock = Number(quantity);
    }
    await this.stockRepo.save(stock);
  }
}
