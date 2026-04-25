import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { WorkflowDefinition, WorkflowStep } from '../service-catalog/service.entity';

export interface WorkflowState {
  currentStep: string;
  currentLabel: string;
  availableTransitions: string[];
  isCompleted: boolean;
}

@Injectable()
export class WorkflowService {
  constructor(
    @InjectPinoLogger(WorkflowService.name)
    private readonly logger: PinoLogger,
  ) {}

  getInitialStep(definition: WorkflowDefinition): string {
    return definition.initialStep;
  }

  transition(
    definition: WorkflowDefinition,
    currentStep: string,
    targetStep: string,
  ): string {
    const step = this.findStep(definition, currentStep);
    if (!step.transitions.includes(targetStep)) {
      this.logger.warn(
        { currentStep, targetStep, allowed: step.transitions },
        'workflow:transition invalid',
      );
      throw new BadRequestException(
        `Invalid transition: cannot move from "${currentStep}" to "${targetStep}". ` +
        `Allowed: [${step.transitions.join(', ')}]`,
      );
    }
    this.logger.debug({ from: currentStep, to: targetStep }, 'workflow:transition');
    return targetStep;
  }

  getState(definition: WorkflowDefinition, currentStep: string): WorkflowState {
    const step = this.findStep(definition, currentStep);
    return {
      currentStep: step.id,
      currentLabel: step.label,
      availableTransitions: step.transitions,
      isCompleted: step.id === definition.completionStep,
    };
  }

  validateDependencies(
    definition: WorkflowDefinition,
    existingServiceIds: string[],
  ): void {
    const missing = definition.dependencies.filter(
      (depId) => !existingServiceIds.includes(depId),
    );
    if (missing.length > 0) {
      this.logger.warn({ missing }, 'workflow:dependency validation failed');
      throw new BadRequestException(
        `This service requires the following services to also be in the order: [${missing.join(', ')}]`,
      );
    }
  }

  private findStep(definition: WorkflowDefinition, stepId: string): WorkflowStep {
    const step = definition.steps.find((s) => s.id === stepId);
    if (!step) {
      this.logger.warn({ stepId }, 'workflow:step not found');
      throw new NotFoundException(`Workflow step "${stepId}" not found in definition`);
    }
    return step;
  }
}
