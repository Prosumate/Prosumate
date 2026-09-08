import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { locations } from './locations';

export const aiConfigs = pgTable(
  'ai_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().unique().references(() => locations.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').notNull().default(true),
    personality: text('personality').notNull().default('professional and helpful sales assistant'),
    tone: text('tone').notNull().default('professional'),
    defaultKeywords: jsonb('default_keywords').$type<string[]>().default([]),
    customInstructions: text('custom_instructions'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('ai_config_location_id_idx').on(table.locationId)]
);

export const aiGenerations = pgTable(
  'ai_generations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    task: text('task').notNull(),
    prompt: text('prompt').notNull(),
    response: text('response').notNull(),
    tokensUsed: integer('tokens_used').notNull().default(0),
    costCents: integer('cost_cents').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('generation_location_id_idx').on(table.locationId),
    index('generation_task_idx').on(table.task),
  ]
);
