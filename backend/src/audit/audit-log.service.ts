import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

export interface CreateAuditLogDto {
  correlationId?: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  entityName?: string;
  entityId?: string;
  httpMethod?: string;
  httpPath?: string;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
  durationMs?: number;
  before?: Record<string, any>;
  after?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.repo.save(this.repo.create(dto));
    } catch {
      // Never let audit log errors bubble up into the main request flow
    }
  }

  findAll(filters?: {
    userId?: string;
    entityName?: string;
    action?: AuditAction;
    from?: Date;
    to?: Date;
  }) {
    const qb = this.repo
      .createQueryBuilder('al')
      .orderBy('al.createdAt', 'DESC')
      .limit(500);

    if (filters?.userId) qb.andWhere('al.userId = :userId', { userId: filters.userId });
    if (filters?.entityName) qb.andWhere('al.entityName = :entityName', { entityName: filters.entityName });
    if (filters?.action) qb.andWhere('al.action = :action', { action: filters.action });
    if (filters?.from) qb.andWhere('al.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('al.createdAt <= :to', { to: filters.to });

    return qb.getMany();
  }
}
