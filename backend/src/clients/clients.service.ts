import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { IsString, IsOptional } from 'class-validator';

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
    @InjectRepository(Client)
    private clientsRepo: Repository<Client>,
  ) {}

  async findAll(search?: string): Promise<Client[]> {
    const qb = this.clientsRepo.createQueryBuilder('client')
      .leftJoinAndSelect('client.measurements', 'measurements')
      .orderBy('client.createdAt', 'DESC');

    if (search) {
      qb.where(
        'client.name ILIKE :search OR client.phone ILIKE :search OR client.instagram ILIKE :search',
        { search: `%${search}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepo.findOne({
      where: { id },
      relations: ['measurements', 'orders', 'orders.expenses'],
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(dto: CreateClientDto): Promise<Client> {
    const client = this.clientsRepo.create(dto);
    return this.clientsRepo.save(client);
  }

  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, dto);
    return this.clientsRepo.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientsRepo.remove(client);
  }

  async count(): Promise<number> {
    return this.clientsRepo.count();
  }
}
