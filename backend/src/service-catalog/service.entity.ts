import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum CustomerTier {
  ALL = 'ALL',
  PRIVILEGED = 'PRIVILEGED',
  STANDARD = 'STANDARD',
}

export interface WorkflowStep {
  id: string;
  label: string;
  transitions: string[];
}

export interface WorkflowDefinition {
  steps: WorkflowStep[];
  initialStep: string;
  completionStep: string;
  /** IDs of services that must also be present in the same order */
  dependencies: string[];
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  basePrice: number;

  /**
   * isOptional = true  → add-on (e.g. Draping)
   * isOptional = false → entry service (e.g. Saree Pleating)
   */
  @Column({ default: false })
  isOptional: boolean;

  @Column({ type: 'jsonb' })
  workflowDefinition: WorkflowDefinition;

  @Column({ default: true })
  isActive: boolean;

  /** Which customer tier can access this service. ALL = everyone. */
  @Column({ type: 'enum', enum: CustomerTier, default: CustomerTier.ALL })
  customerTier: CustomerTier;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
