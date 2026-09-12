import { db } from '../../database';
import { eventBus } from '../../common/redis';
import { logger } from '@prosumate/logger';

export interface AutomationTriggerEvent {
  eventType: string;
  locationId: string;
  contactId: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

export interface StepExecutionResult {
  stepId: string;
  actionType: string;
  status: 'completed' | 'skipped' | 'failed';
  output: Record<string, unknown>;
  error?: string;
  executedAt: string;
}

export interface AutomationExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  locationId: string;
  contactId: string;
  triggerEvent: string;
  status: 'completed' | 'partial' | 'failed' | 'waiting';
  stepsExecuted: StepExecutionResult[];
  startedAt: string;
  finishedAt: string;
}

export class InternalAutomationEngine {
  constructor() {
    eventBus.subscribe('platform.event', async (payload) => {
      const event = payload as Partial<AutomationTriggerEvent>;
      if (event.eventType && event.locationId && event.contactId) {
        await this.handleEvent(event as AutomationTriggerEvent);
      }
    });
  }

  evaluateCondition(
    condition: { field?: string; operator?: string; value?: unknown },
    contact: Record<string, any>,
    triggerData: Record<string, unknown> = {}
  ): boolean {
    if (!condition.field) return true;
    const combined: Record<string, unknown> = { ...triggerData, ...contact, tags: contact.tags || [] };
    const actual = condition.field.split('.').reduce<unknown>((value, key) => {
      if (!value || typeof value !== 'object') return undefined;
      return (value as Record<string, unknown>)[key];
    }, combined);
    const expected = condition.value;
    switch (condition.operator || 'equals') {
      case 'not_equals':
        return String(actual).toLowerCase() !== String(expected).toLowerCase();
      case 'contains':
        return Array.isArray(actual)
          ? actual.some((item) => String(item).toLowerCase() === String(expected).toLowerCase())
          : String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'is_set':
        return actual !== undefined && actual !== null && actual !== '';
      default:
        return String(actual).toLowerCase() === String(expected).toLowerCase();
    }
  }

  private normalizeExecution(raw: any, triggerEvent?: string): AutomationExecutionRecord {
    const record: AutomationExecutionRecord = {
      id: raw.id,
      workflowId: raw.workflowId,
      workflowName: raw.workflowName,
      locationId: raw.locationId,
      contactId: raw.contactId,
      triggerEvent: triggerEvent || raw.triggerType || 'MANUAL_TRIGGER',
      status: raw.status === 'failed' ? 'failed' : raw.status === 'waiting' ? 'waiting' : 'completed',
      stepsExecuted: (raw.stepsExecuted || []).map((step: any) => ({
        stepId: step.stepId,
        actionType: step.actionType,
        status: step.status,
        output: step.output || {},
        error: step.errorMessage || undefined,
        executedAt: step.executedAt,
      })),
      startedAt: raw.startedAt,
      finishedAt: raw.completedAt || new Date().toISOString(),
    };
    db().saveInternalAutomationExecution(record);
    return record;
  }

  async handleEvent(event: AutomationTriggerEvent): Promise<AutomationExecutionRecord[]> {
    // The repository is the single production workflow engine. This facade
    // consumes the same domain events instead of running a divergent second
    // implementation with its own state.
    const executions = db().triggerEvent(event.locationId, event.eventType, {
      contactId: event.contactId,
      ...(event.data || {}),
    });
    const records = executions.map((execution: any) => this.normalizeExecution(execution, event.eventType));
    logger.info('[INTERNAL AUTOMATION] Processed platform event', {
      eventType: event.eventType,
      locationId: event.locationId,
      executionCount: records.length,
    });
    return records;
  }

  async executeWorkflow(
    workflowId: string,
    params: { contactId: string; triggerEvent?: string; triggerData?: Record<string, unknown> }
  ): Promise<AutomationExecutionRecord> {
    const raw = db().executeWorkflow(workflowId, {
      contactId: params.contactId,
      triggerData: params.triggerData,
    });
    return this.normalizeExecution(raw, params.triggerEvent);
  }

  listExecutions(workflowId?: string, locationId?: string): AutomationExecutionRecord[] {
    return db().listInternalAutomationExecutions(workflowId, locationId) as AutomationExecutionRecord[];
  }
}

export const internalAutomationEngine = new InternalAutomationEngine();
