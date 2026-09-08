import { memoryDb } from './repository';
import { AgencyRole, LocationRole } from '@prosumate/types';
import * as crypto from 'crypto';

export function hashPasswordSimple(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function seedDemoData() {
  // 1. Completely clear all memory tables
  memoryDb.clear();

  // 2. Master Proprietary Administrator (Fresh single user)
  const primaryUser = memoryDb.createUser({
    email: 'Prosumateai@gmail.com',
    passwordHash: hashPasswordSimple('Prosumate@256'),
    firstName: 'Prosumate',
    lastName: 'Admin',
    isPlatformAdmin: true,
  });

  // 3. Primary Organization
  const agency = memoryDb.createAgency({
    name: 'Prosumate',
    slug: 'prosumate',
    billingTier: 'enterprise',
    settings: {
      defaultCurrency: 'USD',
      brandingColor: '#6366f1',
    },
  });

  // 4. Primary Clean Location
  const location = memoryDb.createLocation({
    agencyId: agency.id,
    name: 'Prosumate HQ',
    slug: 'prosumate-hq',
    timezone: 'America/Chicago',
    address: {
      street: '100 Innovation Way',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US',
    },
  });

  // 5. Assign Memberships
  memoryDb.createAgencyMembership({
    userId: primaryUser.id,
    agencyId: agency.id,
    role: AgencyRole.OWNER,
  });

  memoryDb.createLocationMembership({
    userId: primaryUser.id,
    locationId: location.id,
    role: LocationRole.LOCATION_ADMIN,
  });

  // 6. Default Clean Pipeline (0 deals/opportunities)
  memoryDb.createPipeline({
    agencyId: agency.id,
    locationId: location.id,
    name: 'Sales Pipeline',
    isDefault: true,
    stages: [
      { name: 'New Lead', color: '#6366f1' },
      { name: 'Contacted', color: '#8b5cf6' },
      { name: 'Meeting Scheduled', color: '#06b6d4' },
      { name: 'Proposal Sent', color: '#f59e0b' },
      { name: 'Negotiation', color: '#ec4899' },
      { name: 'Closed Won', color: '#10b981' },
    ],
  });

  // 7. Base Subscription Plans (Definitions only - no dummy subscriptions or usage transactions)
  memoryDb.createSubscriptionPlan({
    id: 'plan_starter_growth',
    name: 'Starter Growth',
    tier: 'starter',
    description: 'Essential CRM, pipelines, and unified inbox for emerging single-location businesses',
    priceCents: 9700,
    interval: 'month',
    currency: 'USD',
    features: [
      '1 Operating Location',
      'Up to 5 Team Members',
      'Unlimited CRM Contacts',
      'Sales Pipelines & Kanban',
      'Standard Calendar Booking',
      '$10/mo Included Communication Credits',
    ],
    includedCreditsCents: 1000,
  });

  memoryDb.createSubscriptionPlan({
    id: 'plan_professional_agency',
    name: 'Professional Agency',
    tier: 'professional',
    description: 'Full-featured marketing automation and multi-channel communication suite for growing agencies',
    priceCents: 29700,
    interval: 'month',
    currency: 'USD',
    features: [
      'Up to 3 Operating Locations',
      'Unlimited Team Members',
      'Advanced Visual Workflows',
      'Two-Way Email & SMS Unified Inbox',
      'Custom Form Builder & Webhooks',
      '$50/mo Included Communication Credits',
      'Agency Rebilling Markups',
    ],
    includedCreditsCents: 5000,
    isPopular: true,
  });

  memoryDb.createSubscriptionPlan({
    id: 'plan_enterprise_scale',
    name: 'Enterprise Scale',
    tier: 'enterprise',
    description: 'High-volume infrastructure with custom rebilling margins, dedicated SLA, and white-label capabilities',
    priceCents: 49700,
    interval: 'month',
    currency: 'USD',
    features: [
      'Unlimited Operating Locations',
      'Unlimited Team Members & RBAC',
      'High-Throughput SMS & Email Tier',
      'Dedicated Webhook Pipelines',
      '$150/mo Included Communication Credits',
      'Priority 99.99% Uptime SLA',
      'Custom Integration Engineering',
    ],
    includedCreditsCents: 15000,
  });
}
