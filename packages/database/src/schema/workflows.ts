import { pgTable, text, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core';
import { agencies } from './agencies';
import { locations } from './locations';
import { contacts } from './crm';

export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').notNull().default('draft'), // draft, published, paused
    trigger: jsonb('trigger').$type<{ type: string; config?: Record<string, unknown> }>().notNull(),
    steps: jsonb('steps').$type<Array<{
      id: string;
      name: string;
      actionType: string;
      order: number;
      config?: Record<string, unknown>;
    }>>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('workflow_location_id_idx').on(table.locationId),
    index('workflow_status_idx').on(table.status),
  ]
);

export const workflowExecutions = pgTable(
  'workflow_executions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    workflowName: text('workflow_name').notNull(),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    triggerType: text('trigger_type').notNull(),
    status: text('status').notNull(), // completed, failed, running
    stepsExecuted: jsonb('steps_executed').$type<Array<Record<string, unknown>>>().default([]),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    error: text('error'),
  },
  (table) => [
    index('execution_workflow_id_idx').on(table.workflowId),
    index('execution_location_id_idx').on(table.locationId),
    index('execution_status_idx').on(table.status),
  ]
);
