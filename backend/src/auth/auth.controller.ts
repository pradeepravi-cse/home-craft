import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

class AcceptInviteDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 5 attempts per 15 minutes per IP
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
