import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    // Never log the email — it is PII
    this.logger.info('auth:login attempt');

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn({ reason: 'user_not_found' }, 'auth:login failed');
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      this.logger.warn({ userId: user.id, reason: 'wrong_password' }, 'auth:login failed');
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    this.logger.info({ userId: user.id, role: user.role }, 'auth:login success');

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async register(email: string, password: string, name: string) {
    // Never log email or name — both are PII
    this.logger.info('auth:register attempt');

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      this.logger.warn({ reason: 'email_already_registered' }, 'auth:register conflict');
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.create(email, password, name);
    const payload = { sub: user.id, email: user.email, role: user.role };
    this.logger.info({ userId: user.id, role: user.role }, 'auth:register success');

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async setupCheck() {
    const count = await this.usersService.count();
    const setupRequired = count === 0;
    this.logger.debug({ setupRequired }, 'auth:setupCheck');
    return { setupRequired };
  }
}
