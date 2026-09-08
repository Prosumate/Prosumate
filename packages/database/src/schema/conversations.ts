import { pgTable, text, timestamp, uuid, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { agencies } from './agencies';
import { locations } from './locations';
import { contacts } from './crm';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    channel: text('channel').notNull(), // email, sms, webchat, whatsapp
    subject: text('subject'),
    unreadCount: integer('unread_count').notNull().default(0),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('conversation_location_id_idx').on(table.locationId),
    index('conversation_contact_id_idx').on(table.contactId),
    index('conversation_channel_idx').on(table.channel),
  ]
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: text('sender_id'),
    senderType: text('sender_type').notNull(), // user, contact, system
    channel: text('channel').notNull(), // email, sms, webchat
    direction: text('direction').notNull(), // inbound, outbound
    content: text('content').notNull(),
    subject: text('subject'),
    status: text('status').notNull().default('delivered'), // queued, sent, delivered, failed, received
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('message_conversation_id_idx').on(table.conversationId),
    index('message_status_idx').on(table.status),
    index('message_created_at_idx').on(table.createdAt),
  ]
);
