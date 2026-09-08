import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { agencies } from './agencies';
import { locations } from './locations';
import { contacts } from './crm';
import { users } from './users';

export const calendars = pgTable(
  'calendars',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    defaultDurationMinutes: integer('default_duration_minutes').notNull().default(30),
    timezone: text('timezone').notNull().default('America/Chicago'),
    availability: jsonb('availability').$type<Array<{ dayOfWeek: number; startTime: string; endTime: string }>>().default([]),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('calendar_location_id_idx').on(table.locationId),
    index('calendar_slug_idx').on(table.slug),
  ]
);

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    calendarId: uuid('calendar_id').notNull().references(() => calendars.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('scheduled'), // scheduled, confirmed, completed, cancelled, no_show
    notes: text('notes'),
    meetUrl: text('meet_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('appointment_location_id_idx').on(table.locationId),
    index('appointment_calendar_id_idx').on(table.calendarId),
    index('appointment_contact_id_idx').on(table.contactId),
    index('appointment_start_time_idx').on(table.startTime),
  ]
);
