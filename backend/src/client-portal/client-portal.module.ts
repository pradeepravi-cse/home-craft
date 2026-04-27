import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { Measurement } from '../measurements/measurement.entity';
import { Customer } from '../customers/customer.entity';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../common/mail/mail.module';
import { PortalAuthController } from './portal-auth.controller';
import { PortalOrdersController } from './portal-orders.controller';
import { PortalMeasurementsController } from './portal-measurements.controller';
import { PortalProfileController } from './portal-profile.controller';
import { PortalInviteController } from './portal-invite.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order, Measurement, Customer]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
    UsersModule,
    MailModule,
  ],
  controllers: [
    PortalAuthController,
    PortalOrdersController,
    PortalMeasurementsController,
    PortalProfileController,
    PortalInviteController,
  ],
})
export class ClientPortalModule {}
