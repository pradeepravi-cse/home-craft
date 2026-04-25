import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  HTTP_REQUEST = 'HTTP_REQUEST',
  ENTITY_CREATE = 'ENTITY_CREATE',
  ENTITY_UPDATE = 'ENTITY_UPDATE',
  ENTITY_DELETE = 'ENTITY_DELETE',
}

@Entity('audit_logs')
@Index(['correlationId'])
@Index(['userId'])
@Index(['entityName', 'entityId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  correlationId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ nullable: true })
  entityName: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true })
  httpMethod: string;

  @Column({ nullable: true })
  httpPath: string;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'int', nullable: true })
  durationMs: number;

  @Column({ type: 'jsonb', nullable: true })
  before: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  after: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
