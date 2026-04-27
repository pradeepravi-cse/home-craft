import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { IsString, IsOptional } from 'class-validator';
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
          relations: ['measurements'],
          order: { createdAt: 'DESC' },
        })
      : await this.repo.find({
          relations: ['measurements'],
          order: { createdAt: 'DESC' },
        });
    this.logger.debug({ count: results.length }, 'customers:findAll result');
    return results;
  }

  async findOne(id: string): Promise<Customer> {
    this.logger.debug({ id }, 'customers:findOne');
    const customer = await this.repo.findOne({
      where: { id },
      relations: ['measurements', 'orders', 'orders.items', 'orders.expenses'],
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    this.logger.info('customers:create');
    const customer = this.repo.create({ ...dto, contactSource: ContactSource.WHATSAPP });
    const saved = await this.repo.save(customer);
    this.logger.info({ id: saved.id }, 'customers:created');
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

  count(): Promise<number> {
    return this.repo.count();
  }
}
