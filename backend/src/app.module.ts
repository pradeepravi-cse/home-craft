import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { ClsModule, ClsService } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { ServiceCatalogModule } from './service-catalog/services.module';
import { WorkflowModule } from './workflow/workflow.module';
import { PricingModule } from './pricing/pricing.module';
import { OrdersModule } from './orders/orders.module';
import { ExpensesModule } from './expenses/expenses.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { ProductsModule } from './products/products.module';
import { EarningsModule } from './earnings/earnings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RawMaterialsModule } from './raw-materials/raw-materials.module';
import { RecipesModule } from './recipes/recipes.module';
import { ServiceRecipesModule } from './service-recipes/service-recipes.module';
import { BusinessSettingsModule } from './business-settings/business-settings.module';
import { InvestmentsModule } from './investments/investments.module';

import { AuditLogModule } from './audit/audit-log.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';

const IS_PROD = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    // 1. CLS must be first so its middleware runs before pino-http
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        // Use the incoming x-correlation-id header, or generate a new UUID
        generateId: true,
        idGenerator: (req: Request) =>
          (req.headers['x-correlation-id'] as string) || uuidv4(),
        saveReq: true,
      },
    }),

    // 2. Pino structured logger — reads correlationId from CLS per request
    LoggerModule.forRootAsync({
      inject: [ClsService],
      useFactory: (cls: ClsService) => ({
        pinoHttp: {
          // Re-use the CLS correlation ID as pino-http's req.id
          genReqId: () => (cls.getId() as string) || uuidv4(),
          // Attach correlationId to every log line emitted during a request
          customProps: () => ({ correlationId: cls.getId() }),
          level: process.env.LOG_LEVEL || (IS_PROD ? 'info' : 'debug'),
          // Pretty-print in dev; raw JSON in production (for log aggregators)
          transport: !IS_PROD
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: false,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                  messageFormat: '[{correlationId}] {msg}',
                  singleLine: false,
                },
              }
            : undefined,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.body.password',
              'req.body.passwordHash',
              'req.body.token',
            ],
            censor: '[REDACTED]',
          },
          serializers: {
            req(req: any) {
              return { id: req.id, method: req.method, url: req.url };
            },
            res(res: any) {
              return { statusCode: res.statusCode };
            },
          },
          // pino-http auto-logs each request/response; customise the messages
          customSuccessMessage(req: any, res: any, responseTime: number) {
            return `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`;
          },
          customErrorMessage(req: any, _res: any, err: Error) {
            return `${req.method} ${req.url} — ${err.message}`;
          },
        },
      }),
    }),

    ConfigModule,

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        schema: 'public',
        uuidExtension: 'pgcrypto',
        autoLoadEntities: true,
        synchronize: true,
        // TypeORM query logging off — application-level logging handles this
        logging: false,
      }),
    }),

    AuditLogModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    ServiceCatalogModule,
    WorkflowModule,
    PricingModule,
    OrdersModule,
    ExpensesModule,
    MeasurementsModule,
    ProductsModule,
    EarningsModule,
    DashboardModule,
    RawMaterialsModule,
    RecipesModule,
    ServiceRecipesModule,
    BusinessSettingsModule,
    InvestmentsModule,
  ],
  providers: [
    // Global exception filter — logs 4xx as warn, 5xx as error, adds correlationId to response
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Global interceptor — logs request start/end, sets userId in CLS, writes HTTP audit rows
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
})
export class AppModule {}
