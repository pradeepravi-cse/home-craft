import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UsersService } from '../users/users.service';
import { MailService } from '../common/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(email: string, password: string) {
    // Never log the email — it is PII
    this.logger.info('auth:login attempt');

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn({ reason: 'user_not_found' }, 'auth:login failed');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.logger.warn({ userId: user.id, reason: 'account_inactive' }, 'auth:login failed');
      throw new UnauthorizedException('Your account has been deactivated. Contact the administrator.');
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

  async forgotPassword(email: string) {
    this.logger.info('auth:forgotPassword attempt');
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.warn({ reason: 'user_not_found' }, 'auth:forgotPassword no account found');
      throw new BadRequestException('No account found with that email address.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.usersService.saveResetToken(user.id, token, expiry);

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    try {
      await this.mailService.sendPasswordReset(user.email, resetUrl);
      this.logger.info({ userId: user.id }, 'auth:forgotPassword reset email dispatched');
    } catch (err) {
      // Roll back the token so it doesn't sit orphaned in the DB
      await this.usersService.clearResetToken(user.id);
      this.logger.error({ userId: user.id }, 'auth:forgotPassword email failed — token cleared');
      throw err; // propagates the ServiceUnavailableException from MailService
    }

    return { message: 'Reset link sent. Check your email.' };
  }

  async resetPassword(token: string, newPassword: string) {
    this.logger.info('auth:resetPassword attempt');
    const user = await this.usersService.findByResetToken(token);

    if (!user || !user.resetTokenExpiry) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashed);
    this.logger.info({ userId: user.id }, 'auth:resetPassword success');

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  async acceptInvite(token: string, newPassword: string) {
    this.logger.info('auth:acceptInvite attempt');
    const user = await this.usersService.findByResetToken(token);

    if (!user || !user.resetTokenExpiry) {
      throw new BadRequestException('Invalid or expired invite link');
    }

    if (new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('This invite link has expired. Ask the admin to resend.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.activateFromInvite(user.id, hashed);
    this.logger.info({ userId: user.id }, 'auth:acceptInvite success');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    this.logger.info({ userId }, 'auth:changePassword attempt');
    const user = await this.usersService.findById(userId);

    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      this.logger.warn({ userId, reason: 'wrong_current_password' }, 'auth:changePassword failed');
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashed);
    this.logger.info({ userId }, 'auth:changePassword success');

    return { message: 'Password changed successfully.' };
  }
}
