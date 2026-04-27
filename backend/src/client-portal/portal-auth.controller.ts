import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString } from 'class-validator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ClientAuthGuard } from './client-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

class PortalLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('portal/auth')
export class PortalAuthController {
  constructor(
    @InjectPinoLogger(PortalAuthController.name)
    private readonly logger: PinoLogger,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // 5 login attempts per 15 minutes per IP — industry standard brute-force protection
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  @Post('login')
  async login(@Body() dto: PortalLoginDto) {
    this.logger.info('portal:login attempt');

    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    if (!user || !user.isActive) {
      this.logger.warn({ reason: 'user_not_found_or_inactive' }, 'portal:login failed');
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.customerId) {
      this.logger.warn({ userId: user.id, reason: 'no_customer_linked' }, 'portal:login failed');
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.logger.warn({ userId: user.id, reason: 'wrong_password' }, 'portal:login failed');
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
    };
    this.logger.info({ userId: user.id, customerId: user.customerId }, 'portal:login success');

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, customerId: user.customerId },
    };
  }

  @UseGuards(ClientAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return req.user;
  }
}
