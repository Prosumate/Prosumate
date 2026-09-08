import { pgTable, text, timestamp, uuid, integer, index } from 'drizzle-orm/pg-core';
import { locations } from './locations';
import { contacts } from './crm';

export const customerReviews = pgTable(
  'customer_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    reviewerName: text('reviewer_name').notNull(),
    content: text('content').notNull(),
    source: text('source').notNull().default('direct'), // google, facebook, direct
    status: text('status').notNull().default('published'), // published, flagged, archived
    replyContent: text('reply_content'),
    repliedAt: timestamp('replied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('review_location_id_idx').on(table.locationId),
    index('review_rating_idx').on(table.rating),
  ]
);

export const reviewRequests = pgTable(
  'review_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    channel: text('channel').notNull(), // sms, email
    status: text('status').notNull().default('sent'), // sent, delivered, opened, clicked, completed
    sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    openedAt: timestamp('opened_at', { withTimezone: true }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }),
  },
  (table) => [
    index('req_location_id_idx').on(table.locationId),
    index('req_contact_id_idx').on(table.contactId),
  ]
);
