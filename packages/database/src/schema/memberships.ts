import { pgTable, text, timestamp, uuid, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { agencies } from './agencies';
import { locations } from './locations';
import { Permission } from '@prosumate/types';

export const userAgencyMemberships = pgTable(
  'user_agency_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencies.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('MEMBER'), // OWNER, ADMIN, MEMBER
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_agency_unique_idx').on(table.userId, table.agencyId),
    index('uam_user_id_idx').on(table.userId),
    index('uam_agency_id_idx').on(table.agencyId),
  ]
);

export const userLocationMemberships = pgTable(
  'user_location_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('LOCATION_USER'), // LOCATION_ADMIN, LOCATION_USER, LOCATION_READONLY
    permissionsOverride: jsonb('permissions_override').$type<Permission[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_location_unique_idx').on(table.userId, table.locationId),
    index('ulm_user_id_idx').on(table.userId),
    index('ulm_location_id_idx').on(table.locationId),
  ]
);
