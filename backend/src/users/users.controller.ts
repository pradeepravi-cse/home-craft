import {
  Controller, Get, Post, Delete, Param, Patch, Body, UseGuards, Request,
  ConflictException, ForbiddenException,
} from '@nestjs/common';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';
import { UsersService } from './users.service';
import { MailService } from '../common/mail/mail.service';

class InviteUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}

class UpdateRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  async invite(@Body() dto: InviteUserDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('A user with this email already exists');

    const { user, token } = await this.usersService.createInvited(dto.email, dto.name, dto.role);

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

    try {
      await this.mailService.sendInvite(user.email, user.name, inviteUrl);
    } catch (err) {
      // Roll back — don't leave an unusable account if email fails
      await this.usersService.delete(user.id);
      throw err;
    }

    return { message: `Invite sent to ${dto.email}` };
  }

  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    if (req.user.id === id) throw new ForbiddenException('You cannot delete your own account');
    return this.usersService.delete(id);
  }
}
