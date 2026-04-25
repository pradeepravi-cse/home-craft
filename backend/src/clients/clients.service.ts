import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsOptional } from 'class-validator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Client } from './client.entity';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  contactSource?: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  contactSource?: string;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectPinoLogger(ClientsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Client)
    private clientsRepo: Repository<Client>,
  ) {}

  async findAll(search?: string): Promise<Client[]> {
    // Do not log the search string — it may be a name, phone, or handle (all PII)
    this.logger.debug({ hasSearch: !!search }, 'clients:findAll');
    const qb = this.clientsRepo
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.measurements', 'measurements')
      .orderBy('client.createdAt', 'DESC');

    if (search) {
      qb.where(
        'client.name ILIKE :search OR client.phone ILIKE :search OR client.instagram ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const results = await qb.getMany();
    this.logger.debug({ count: results.length }, 'clients:findAll result');
    return results;
  }

  async findOne(id: string): Promise<Client> {
    this.logger.debug({ id }, 'clients:findOne');
    const client = await this.clientsRepo.findOne({
      where: { id },
      relations: ['measurements', 'orders', 'orders.expenses'],
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(dto: CreateClientDto): Promise<Client> {
    // Log contactSource only — never name/phone/instagram/notes
    this.logger.info({ contactSource: dto.contactSource }, 'clients:create');
    const client = this.clientsRepo.create(dto);
    const saved = await this.clientsRepo.save(client);
    this.logger.info({ id: (saved as any).id }, 'clients:created');
    return saved;
  }

  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    this.logger.info({ id }, 'clients:update');
    const client = await this.findOne(id);
    Object.assign(client, dto);
    const saved = await this.clientsRepo.save(client);
    this.logger.info({ id: (saved as any).id }, 'clients:updated');
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.info({ id }, 'clients:remove');
    const client = await this.findOne(id);
    await this.clientsRepo.remove(client);
    this.logger.info({ id }, 'clients:removed');
  }

  async count(): Promise<number> {
    return this.clientsRepo.count();
  }
}
