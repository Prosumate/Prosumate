import { pgTable, text, timestamp, uuid, jsonb, index, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { agencies } from './agencies';
import { locations } from './locations';
import { contacts } from './crm';
import { users } from './users';

export const workflowFolders = pgTable(
  'workflow_folders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    icon: text('icon'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('workflow_folder_location_id_idx').on(table.locationId),
    index('workflow_folder_location_name_idx').on(table.locationId, table.name),
  ]
);

export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    folderId: uuid('folder_id').references(() => workflowFolders.id, { onDelete: 'set null' }),
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
    duplicatedFrom: uuid('duplicated_from').references((): AnyPgColumn => workflows.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('workflow_location_id_idx').on(table.locationId),
    index('workflow_status_idx').on(table.status),
    index('workflow_folder_id_idx').on(table.folderId),
    index('workflow_deleted_at_idx').on(table.deletedAt),
    index('workflow_duplicated_from_idx').on(table.duplicatedFrom),
    index('workflow_created_by_idx').on(table.createdBy),
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
