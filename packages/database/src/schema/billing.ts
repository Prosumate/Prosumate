import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { locations } from './locations';

export const subscriptionPlans = pgTable('subscription_plans', {
  id: text('id').primaryKey(), // starter, growth, scale
  name: text('name').notNull(),
  tier: text('tier').notNull(),
  priceMonthlyCents: integer('price_monthly_cents').notNull().default(0),
  priceAnnualCents: integer('price_annual_cents').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  features: jsonb('features').$type<string[]>().default([]),
  limits: jsonb('limits').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const locationSubscriptions = pgTable(
  'location_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().unique().references(() => locations.id, { onDelete: 'cascade' }),
    planId: text('plan_id').notNull().references(() => subscriptionPlans.id),
    status: text('status').notNull().default('active'), // active, trialing, past_due, canceled
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).defaultNow().notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    paymentMethodId: text('payment_method_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('subscription_location_id_idx').on(table.locationId)]
);

export const creditWallets = pgTable(
  'credit_wallets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().unique().references(() => locations.id, { onDelete: 'cascade' }),
    balanceCents: integer('balance_cents').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
    autoRechargeEnabled: boolean('auto_recharge_enabled').notNull().default(false),
    autoRechargeThresholdCents: integer('auto_recharge_threshold_cents').notNull().default(1000),
    autoRechargeAmountCents: integer('auto_recharge_amount_cents').notNull().default(5000),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('wallet_location_id_idx').on(table.locationId)]
);

export const usageTransactions = pgTable(
  'usage_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    category: text('category').notNull(), // telephony, email, ai, storage
    units: integer('units').notNull().default(1),
    costCents: integer('cost_cents').notNull().default(0),
    description: text('description').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('usage_location_id_idx').on(table.locationId),
    index('usage_category_idx').on(table.category),
    index('usage_created_at_idx').on(table.createdAt),
  ]
);

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
    number: text('number').notNull().unique(),
    amountDueCents: integer('amount_due_cents').notNull(),
    amountPaidCents: integer('amount_paid_cents').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
    status: text('status').notNull().default('paid'), // draft, open, paid, uncollectible, void
    invoicePdfUrl: text('invoice_pdf_url'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('invoice_location_id_idx').on(table.locationId),
    index('invoice_status_idx').on(table.status),
  ]
);
