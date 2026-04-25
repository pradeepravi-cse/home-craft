import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { EntityAuditSubscriber } from './entity-audit.subscriber';
import { AuditLogsController } from './audit-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService, EntityAuditSubscriber],
  controllers: [AuditLogsController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
