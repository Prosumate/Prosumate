import { pgTable, text, timestamp, uuid, boolean, jsonb, index } from 'drizzle-orm/pg-core';

export const snapshots = pgTable(
  'snapshots',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    industry: text('industry').notNull(),
    version: text('version').notNull().default('1.0.0'),
    components: jsonb('components').$type<{
      pipelines: Array<Record<string, unknown>>;
      tags: string[];
      customFields: Array<Record<string, unknown>>;
      workflows: Array<Record<string, unknown>>;
    }>().notNull(),
    isSystem: boolean('is_system').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('snapshot_industry_idx').on(table.industry)]
);
