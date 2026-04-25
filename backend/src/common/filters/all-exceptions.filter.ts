import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
    private readonly cls: ClsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const correlationId = (this.cls.getId() as string) || 'unknown';
    const userId = this.cls.get<string>('userId') || 'anonymous';

    let message: string | string[];
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      message =
        typeof body === 'object' && body !== null && 'message' in body
          ? (body as any).message
          : exception.message;
    } else {
      message = 'Internal server error';
    }

    const logCtx = {
      correlationId,
      userId,
      method: req.method,
      url: req.url,
      statusCode: status,
      ip: req.ip,
    };

    if (status >= 500) {
      this.logger.error(
        {
          ...logCtx,
          stack: exception instanceof Error ? exception.stack : undefined,
          cause: exception instanceof Error ? exception.message : String(exception),
        },
        `Unhandled exception on ${req.method} ${req.url}`,
      );
    } else if (status >= 400) {
      this.logger.warn(
        { ...logCtx, reason: Array.isArray(message) ? message.join(' | ') : message },
        `HTTP ${status} on ${req.method} ${req.url}`,
      );
    }

    res.status(status).json({
      statusCode: status,
      correlationId,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
