import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuditAction } from '../../audit/audit-log.entity';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(HttpLoggingInterceptor.name)
    private readonly logger: PinoLogger,
    private readonly cls: ClsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = req;
    const user = (req as any).user as
      | { id: string; email: string; role: string }
      | undefined;

    // Propagate authenticated user into CLS so downstream code (subscribers, filters) can read it
    if (user) {
      this.cls.set('userId', user.id);
      this.cls.set('userEmail', user.email);
    }

    const correlationId = this.cls.getId() as string;
    const userAgent = (headers['user-agent'] as string) || '';
    const start = Date.now();

    this.logger.info(
      { correlationId, userId: user?.id, method, url },
      `→ ${method} ${url}`,
    );

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const durationMs = Date.now() - start;
        const { statusCode } = res;

        this.logger.info(
          { correlationId, userId: user?.id, method, url, statusCode, durationMs },
          `← ${method} ${url} ${statusCode} (${durationMs}ms)`,
        );

        void this.auditLogService.log({
          correlationId,
          userId: user?.id,
          userEmail: user?.email,
          action: AuditAction.HTTP_REQUEST,
          httpMethod: method,
          httpPath: url,
          statusCode,
          ipAddress: ip,
          userAgent,
          durationMs,
        });
      }),
      catchError((err: unknown) => {
        const durationMs = Date.now() - start;
        const statusCode =
          err instanceof HttpException ? err.getStatus() : 500;
        const message =
          err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;

        const logCtx = { correlationId, userId: user?.id, method, url, statusCode, durationMs, error: message };

        if (statusCode >= 500) {
          this.logger.error({ ...logCtx, stack }, `✗ ${method} ${url} ${statusCode} (${durationMs}ms)`);
        } else {
          this.logger.warn(logCtx, `✗ ${method} ${url} ${statusCode} (${durationMs}ms)`);
        }

        void this.auditLogService.log({
          correlationId,
          userId: user?.id,
          userEmail: user?.email,
          action: AuditAction.HTTP_REQUEST,
          httpMethod: method,
          httpPath: url,
          statusCode,
          ipAddress: ip,
          userAgent,
          durationMs,
        });

        return throwError(() => err);
      }),
    );
  }
}
