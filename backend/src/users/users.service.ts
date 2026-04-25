import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectPinoLogger(UsersService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });
    this.logger.debug({ count: users.length }, 'users:findAll');
    return users;
  }

  findByEmail(email: string): Promise<User | null> {
    // Do not log the email — PII
    this.logger.debug('users:findByEmail');
    return this.usersRepo.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    this.logger.debug({ id }, 'users:findById');
    return this.usersRepo.findOne({ where: { id } });
  }

  async create(email: string, password: string, name: string, role = UserRole.ADMIN): Promise<User> {
    // Do not log email or name — PII
    this.logger.info({ role }, 'users:create');
    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({ email, password: hashed, name, role });
    const saved = await this.usersRepo.save(user);
    this.logger.info({ id: saved.id, role: saved.role }, 'users:created');
    return saved;
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    this.logger.info({ id, role }, 'users:updateRole');
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    const saved = await this.usersRepo.save(user);
    this.logger.info({ id, role }, 'users:role updated');
    return saved;
  }

  async toggleActive(id: string): Promise<User> {
    this.logger.info({ id }, 'users:toggleActive');
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = !user.isActive;
    const saved = await this.usersRepo.save(user);
    this.logger.info({ id, isActive: saved.isActive }, 'users:active toggled');
    return saved;
  }

  count(): Promise<number> {
    return this.usersRepo.count();
  }
}
