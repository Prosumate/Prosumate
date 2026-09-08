import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Stripe Billing, Subscriptions & Usage Metering Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let locationAId: string;

  beforeEach(async () => {
    memoryDb.clear();

    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'billing-owner-a@agency.com',
        password: 'Password123!',
        firstName: 'Billing',
        lastName: 'Admin A',
        agencyName: 'Billing Agency A',
        initialLocationName: 'Billing Location A',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'billing-owner-b@agency.com',
        password: 'Password123!',
        firstName: 'Billing',
        lastName: 'Admin B',
        agencyName: 'Billing Agency B',
        initialLocationName: 'Billing Location B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;

    // Seed default plans into DB
    memoryDb.createSubscriptionPlan({
      id: 'plan_starter_growth',
      name: 'Starter Growth',
      tier: 'starter',
      description: 'Starter tier plan',
      priceCents: 9700,
      interval: 'month',
      currency: 'USD',
      features: ['1 Location', '5 Users'],
      includedCreditsCents: 1000,
    });

    memoryDb.createSubscriptionPlan({
      id: 'plan_professional_agency',
      name: 'Professional Agency',
      tier: 'professional',
      description: 'Professional tier plan',
      priceCents: 29700,
      interval: 'month',
      currency: 'USD',
      features: ['3 Locations', 'Unlimited Users'],
      includedCreditsCents: 5000,
    });
  });

  test('Public plan listing and location subscription lifecycle', async () => {
    // 1. List Public Plans
    const plansRes = await app.inject({
      method: 'GET',
      url: '/api/v1/billing/plans',
    });
    assert.equal(plansRes.statusCode, 200);
    const plans = plansRes.json().data;
    assert.ok(plans.length >= 2);
    assert.ok(plans.some((p: any) => p.id === 'plan_starter_growth'));

    // 2. Subscribe Location A to Starter Plan
    const subRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/billing/subscription`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        planId: 'plan_starter_growth',
        paymentMethodId: 'pm_card_visa',
      },
    });
    assert.equal(subRes.statusCode, 200);
    const sub = subRes.json().data;
    assert.equal(sub.planId, 'plan_starter_growth');
    assert.equal(sub.status, 'active');
    assert.equal(sub.cancelAtPeriodEnd, false);

    // 3. Verify Wallet received included credits ($10.00 = 1000 cents)
    const walletRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/billing/wallet`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(walletRes.statusCode, 200);
    assert.equal(walletRes.json().data.balanceCents, 1000);

    // 4. Upgrade to Professional Plan
    const upgradeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/billing/subscription`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        planId: 'plan_professional_agency',
      },
    });
    assert.equal(upgradeRes.statusCode, 200);
    assert.equal(upgradeRes.json().data.planId, 'plan_professional_agency');

    // 5. Cancel subscription at period end
    const cancelRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/locations/${locationAId}/billing/subscription`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(cancelRes.statusCode, 200);
    assert.equal(cancelRes.json().data.cancelAtPeriodEnd, true);
  });

  test('Credit wallet top-up and usage metering deduction', async () => {
    // 1. Initial wallet top-up ($25.00 = 2500 cents)
    const topUpRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/billing/wallet/topup`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        amountCents: 2500,
      },
    });
    assert.equal(topUpRes.statusCode, 200);
    assert.equal(topUpRes.json().data.balanceCents, 2500);

    // 2. Record SMS Usage (100 units at 2c base + 20% margin = 240 cents)
    const usageRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/billing/usage`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        type: 'sms',
        units: 100,
        description: 'Customer notification SMS blast',
      },
    });
    assert.equal(usageRes.statusCode, 201);
    const usageData = usageRes.json().data;
    assert.equal(usageData.transaction.amountCents, 240);
    assert.equal(usageData.wallet.balanceCents, 2500 - 240);

    // 3. Inspect Usage Ledger
    const ledgerRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/billing/usage`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(ledgerRes.statusCode, 200);
    assert.equal(ledgerRes.json().data.length, 1);
    assert.equal(ledgerRes.json().data[0].type, 'sms');

    // 4. Verify Invoice History
    const invRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/billing/invoices`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(invRes.statusCode, 200);
    assert.ok(invRes.json().data.length >= 1);
    assert.equal(invRes.json().data[0].status, 'paid');
  });

  test('Auto-recharge trigger when balance drops below configured threshold', async () => {
    // 1. Configure auto-recharge: threshold $10 (1000 cents), reload $50 (5000 cents)
    await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationAId}/billing/wallet/config`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        autoRechargeEnabled: true,
        autoRechargeThresholdCents: 1000,
        autoRechargeAmountCents: 5000,
      },
    });

    // 2. Top up initial balance to $12 (1200 cents)
    await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/billing/wallet/topup`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { amountCents: 1200 },
    });

    // 3. Consume 200 SMS segments (approx 480 cents), dropping balance from 1200 to 720 (below 1000 threshold)
    const usageRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/billing/usage`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        type: 'sms',
        units: 200,
        description: 'Large marketing campaign SMS',
      },
    });

    assert.equal(usageRes.statusCode, 201);
    const result = usageRes.json().data;
    assert.equal(result.autoRechargeTriggered, true);
    // Balance should be (1200 - 480) + 5000 = 5720 cents!
    assert.equal(result.wallet.balanceCents, 5720);
  });

  test('Cross-tenant isolation: User B cannot access Location A billing or wallet', async () => {
    // User B attempts to access Location A wallet
    const crossWallet = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/billing/wallet`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossWallet.statusCode, 403);
    assert.equal(crossWallet.json().error.code, 'FORBIDDEN');

    // User B attempts to top up Location A wallet
    const crossTopUp = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/billing/wallet/topup`,
      headers: { authorization: `Bearer ${tokenUserB}` },
      payload: { amountCents: 1000 },
    });
    assert.equal(crossTopUp.statusCode, 403);

    // User B attempts to view Location A invoices
    const crossInvoices = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/billing/invoices`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossInvoices.statusCode, 403);
  });
});
