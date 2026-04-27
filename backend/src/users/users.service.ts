import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
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

  findByResetToken(token: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { resetToken: token } });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    this.logger.info({ id }, 'users:updatePassword');
    await this.usersRepo.update(id, { password: hashedPassword, resetToken: null, resetTokenExpiry: null });
  }

  async saveResetToken(id: string, token: string, expiry: Date): Promise<void> {
    this.logger.info({ id }, 'users:saveResetToken');
    await this.usersRepo.update(id, { resetToken: token, resetTokenExpiry: expiry });
  }

  async clearResetToken(id: string): Promise<void> {
    this.logger.info({ id }, 'users:clearResetToken');
    await this.usersRepo.update(id, { resetToken: null, resetTokenExpiry: null });
  }

  async delete(id: string): Promise<void> {
    this.logger.info({ id }, 'users:delete');
    await this.usersRepo.delete(id);
  }

  async createInvited(email: string, name: string, role: UserRole): Promise<{ user: User; token: string }> {
    this.logger.info({ role }, 'users:createInvited');
    // Random unusable password — user sets their own via invite link
    const hashed = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = this.usersRepo.create({
      email, name, role,
      password: hashed,
      isActive: false, // inactive until they accept the invite
      resetToken: token,
      resetTokenExpiry: expiry,
    });
    const saved = await this.usersRepo.save(user);
    this.logger.info({ id: saved.id, role }, 'users:invited created');
    return { user: saved, token };
  }

  async activateFromInvite(id: string, hashedPassword: string): Promise<void> {
    this.logger.info({ id }, 'users:activateFromInvite');
    await this.usersRepo.update(id, {
      password: hashedPassword,
      isActive: true,
      resetToken: null,
      resetTokenExpiry: null,
    });
  }
}
