import { pgTable, text, timestamp, uuid, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { agencies } from './agencies';
import { locations } from './locations';
import { users } from './users';

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    domain: text('domain'),
    phone: text('phone'),
    industry: text('industry'),
    address: jsonb('address').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('company_location_id_idx').on(table.locationId),
    index('company_name_idx').on(table.name),
  ]
);

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    source: text('source').default('direct'),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    tags: jsonb('tags').$type<string[]>().default([]),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
    status: text('status').notNull().default('lead'), // lead, customer, unresponsive, archived
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('contact_location_id_idx').on(table.locationId),
    index('contact_email_idx').on(table.email),
    index('contact_phone_idx').on(table.phone),
    index('contact_status_idx').on(table.status),
  ]
);

export const contactNotes = pgTable(
  'contact_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').notNull().references(() => users.id),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('note_contact_id_idx').on(table.contactId)]
);

export const contactTasks = pgTable(
  'contact_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    status: text('status').notNull().default('pending'), // pending, in_progress, completed
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('task_contact_id_idx').on(table.contactId),
    index('task_assigned_user_idx').on(table.assignedUserId),
  ]
);

export const pipelines = pgTable(
  'pipelines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isDefault: text('is_default').default('false'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('pipeline_location_id_idx').on(table.locationId)]
);

export const pipelineStages = pgTable(
  'pipeline_stages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    order: integer('order').notNull(),
    color: text('color'),
  },
  (table) => [index('stage_pipeline_id_idx').on(table.pipelineId)]
);

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
    stageId: uuid('stage_id').notNull().references(() => pipelineStages.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    monetaryValue: integer('monetary_value').default(0).notNull(),
    currency: text('currency').default('USD').notNull(),
    status: text('status').default('open').notNull(), // open, won, lost, abandoned
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    expectedCloseDate: timestamp('expected_close_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('opp_location_id_idx').on(table.locationId),
    index('opp_pipeline_stage_idx').on(table.pipelineId, table.stageId),
    index('opp_contact_id_idx').on(table.contactId),
  ]
);

export const opportunityMovements = pgTable(
  'opportunity_movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id, { onDelete: 'cascade' }),
    fromStageId: uuid('from_stage_id').references(() => pipelineStages.id),
    toStageId: uuid('to_stage_id').notNull().references(() => pipelineStages.id),
    actorId: uuid('actor_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('opp_mov_opp_id_idx').on(table.opportunityId)]
);
