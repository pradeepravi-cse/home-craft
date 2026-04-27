import {
  Controller, Post, Param, UseGuards,
  NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../common/mail/mail.service';
import { Customer } from '../customers/customer.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('portal/invite')
export class PortalInviteController {
  constructor(
    @InjectPinoLogger(PortalInviteController.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Post(':customerId')
  async invite(@Param('customerId') customerId: string) {
    const customer = await this.customersRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (!customer.email) throw new ConflictException('Customer has no email address — add one first');

    const existing = await this.usersService.findByCustomerId(customerId);
    if (existing) throw new ConflictException('This customer already has a portal account');

    const { user, token } = await this.usersService.createInvited(
      customer.email,
      customer.name,
      UserRole.CLIENT,
      customerId,
    );

    const appUrl = (process.env.APP_URL || 'http://localhost:3001').replace(/\/$/, '');
    // Points to the client portal, not the admin app
    const clientPortalUrl = process.env.CLIENT_PORTAL_URL || `${appUrl}/client`;
    const inviteUrl = `${clientPortalUrl}/accept-invite?token=${token}`;

    try {
      await this.mailService.sendInvite(user.email, user.name, inviteUrl);
    } catch (err) {
      await this.usersService.delete(user.id);
      throw err;
    }

    this.logger.info({ customerId, userId: user.id }, 'portal:invite sent');
    return { message: `Portal invite sent to ${customer.email}` };
  }
}
