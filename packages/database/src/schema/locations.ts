import { pgTable, text, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core';
import { agencies } from './agencies';

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    address: jsonb('address').$type<{
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }>(),
    status: text('status').notNull().default('active'), // active, archived
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('location_agency_id_idx').on(table.agencyId),
    index('location_slug_idx').on(table.slug),
    index('location_status_idx').on(table.status),
  ]
);
