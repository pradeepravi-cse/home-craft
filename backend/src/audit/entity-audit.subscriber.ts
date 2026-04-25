import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from './audit-log.entity';
import { maskPii } from '../common/utils/pii-masker';

// Entities excluded from audit (to avoid infinite recursion and noisy system tables)
const EXCLUDED_ENTITIES = new Set(['AuditLog']);

@EventSubscriber()
@Injectable()
export class EntityAuditSubscriber implements EntitySubscriberInterface {
  constructor(
    dataSource: DataSource,
    private readonly cls: ClsService,
    private readonly auditLogService: AuditLogService,
  ) {
    dataSource.subscribers.push(this);
  }

  private getClsContext() {
    try {
      return {
        correlationId: this.cls.getId() as string | undefined,
        userId: this.cls.get<string>('userId'),
        userEmail: this.cls.get<string>('userEmail'),
      };
    } catch {
      // Outside of request context (seed scripts, migrations, etc.)
      return { correlationId: undefined, userId: undefined, userEmail: undefined };
    }
  }

  private getEntityId(entity: any): string | undefined {
    return entity?.id?.toString();
  }

  afterInsert(event: InsertEvent<any>): void {
    if (EXCLUDED_ENTITIES.has(event.metadata.name)) return;

    void this.auditLogService.log({
      ...this.getClsContext(),
      action: AuditAction.ENTITY_CREATE,
      entityName: event.metadata.name,
      entityId: this.getEntityId(event.entity),
      after: maskPii(event.entity),
    });
  }

  afterUpdate(event: UpdateEvent<any>): void {
    if (EXCLUDED_ENTITIES.has(event.metadata.name)) return;

    const changedColumns = event.updatedColumns?.map((c) => c.propertyName) ?? [];

    let before: Record<string, any> | undefined;
    let after: Record<string, any> | undefined;

    if (changedColumns.length > 0) {
      before = {};
      after = {};
      for (const col of changedColumns) {
        // Mask individual field values if they are PII fields
        const raw = { [col]: (event.databaseEntity as any)?.[col] };
        before[col] = maskPii(raw)[col];
        const rawAfter = { [col]: (event.entity as any)?.[col] };
        after[col] = maskPii(rawAfter)[col];
      }
    } else {
      // QueryBuilder update — no column-level diff available
      before = event.databaseEntity ? maskPii(event.databaseEntity) : undefined;
      after = event.entity ? maskPii(event.entity) : undefined;
    }

    void this.auditLogService.log({
      ...this.getClsContext(),
      action: AuditAction.ENTITY_UPDATE,
      entityName: event.metadata.name,
      entityId: this.getEntityId(event.entity ?? event.databaseEntity),
      before,
      after,
    });
  }

  afterRemove(event: RemoveEvent<any>): void {
    if (EXCLUDED_ENTITIES.has(event.metadata.name)) return;

    void this.auditLogService.log({
      ...this.getClsContext(),
      action: AuditAction.ENTITY_DELETE,
      entityName: event.metadata.name,
      entityId: event.entityId?.toString() ?? this.getEntityId(event.entity),
      before: maskPii(event.entity),
    });
  }

  afterSoftRemove(event: SoftRemoveEvent<any>): void {
    if (EXCLUDED_ENTITIES.has(event.metadata.name)) return;

    void this.auditLogService.log({
      ...this.getClsContext(),
      action: AuditAction.ENTITY_DELETE,
      entityName: event.metadata.name,
      entityId: this.getEntityId(event.entity),
      before: maskPii(event.entity),
    });
  }
}
