import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { agencies } from './agencies';
import { locations } from './locations';

export const funnels = pgTable(
  'funnels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    steps: jsonb('steps').$type<Array<{
      id: string;
      name: string;
      slug: string;
      order: number;
      sections: Array<Record<string, unknown>>;
    }>>().notNull().default([]),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('funnel_location_id_idx').on(table.locationId),
    index('funnel_slug_idx').on(table.slug),
  ]
);

export const campaignMetrics = pgTable(
  'campaign_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    funnelId: uuid('funnel_id').notNull().references(() => funnels.id, { onDelete: 'cascade' }),
    stepId: text('step_id').notNull(),
    pageViews: integer('page_views').notNull().default(0),
    uniqueVisitors: integer('unique_visitors').notNull().default(0),
    formSubmissions: integer('form_submissions').notNull().default(0),
    conversions: integer('conversions').notNull().default(0),
    revenueCents: integer('revenue_cents').notNull().default(0),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('metrics_location_id_idx').on(table.locationId),
    index('metrics_funnel_id_idx').on(table.funnelId),
  ]
);
