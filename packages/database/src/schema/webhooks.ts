import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { agencies } from './agencies';
import { locations } from './locations';

export const webhooks = pgTable(
  'webhooks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    secretKey: text('secret_key').notNull(),
    events: jsonb('events').$type<string[]>().default([]),
    isActive: boolean('is_active').notNull().default(true),
    lastDeliveredAt: timestamp('last_delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('webhook_location_id_idx').on(table.locationId)]
);

export const webhookLogs = pgTable(
  'webhook_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    webhookId: uuid('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
    event: text('event').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    signature: text('signature').notNull(),
    responseStatus: integer('response_status').notNull(),
    responseBody: text('response_body'),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('log_webhook_id_idx').on(table.webhookId),
    index('log_delivered_at_idx').on(table.deliveredAt),
  ]
);

export const ssoConfigs = pgTable(
  'sso_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().unique().references(() => locations.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('saml'), // saml, oidc
    idpMetadataUrl: text('idp_metadata_url'),
    clientId: text('client_id'),
    clientSecret: text('client_secret'),
    enforceSso: boolean('enforce_sso').notNull().default(false),
    allowedDomains: jsonb('allowed_domains').$type<string[]>().default([]),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('sso_location_id_idx').on(table.locationId)]
);
