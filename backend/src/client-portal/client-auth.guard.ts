import {
  Injectable, ExecutionContext, UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../users/user.entity';

/**
 * Guards client-portal routes. Validates the JWT and additionally
 * enforces role === CLIENT and that customerId is present.
 */
@Injectable()
export class ClientAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) throw new UnauthorizedException('Authentication required');
    if (user.role !== UserRole.CLIENT) throw new UnauthorizedException('Access denied');
    if (!user.customerId) throw new UnauthorizedException('No customer profile linked to this account');
    return user;
  }
}
