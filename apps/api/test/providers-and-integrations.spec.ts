import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  emailProvider,
  smsProvider,
  paymentProvider,
  aiProvider,
  MockEmailProvider,
  MockSmsProvider,
  MockPaymentProvider,
  MockAiProvider,
} from '../src/providers';
import { sendWebhookHttp } from '../src/modules/webhooks/webhooks.service';
import { cache } from '../src/common/redis';

describe('Free Test Providers & Integrations Suite', () => {
  test('Mock Email Provider delivers simulated message with unique ID', async () => {
    const provider = new MockEmailProvider();
    const result = await provider.sendEmail({
      to: 'tester@prosumate.local',
      subject: 'Welcome to Beta Test',
      text: 'Hello, your test account is ready.',
    });

    assert.equal(result.success, true);
    assert.equal(result.provider, 'mock');
    assert.equal(result.status, 'simulated');
    assert.ok(result.messageId.startsWith('mock-email-'));
  });

  test('Mock SMS Provider delivers simulated SMS with status simulated', async () => {
    const provider = new MockSmsProvider();
    const result = await provider.sendSms({
      to: '+1-555-0199',
      body: 'Your test verification code is 123456',
    });

    assert.equal(result.success, true);
    assert.equal(result.provider, 'mock');
    assert.equal(result.status, 'simulated');
    assert.ok(result.messageId.startsWith('mock-sms-'));
  });

  test('Mock Payment Provider creates simulated subscriptions and wallet credits at $0 cost', async () => {
    const provider = new MockPaymentProvider();
    
    // 1. Subscription
    const sub = await provider.createSubscription({
      locationId: 'loc-test-1',
      planId: 'growth',
    });
    assert.equal(sub.provider, 'mock');
    assert.equal(sub.status, 'active');
    assert.ok(sub.id.startsWith('sub_mock_'));

    // 2. Top-up
    const topup = await provider.topUpWallet({
      locationId: 'loc-test-1',
      amountCents: 5000,
    });
    assert.equal(topup.success, true);
    assert.equal(topup.provider, 'mock');
    assert.equal(topup.newBalanceCents, 5000);
  });

  test('Mock AI Provider produces structured lead scoring and qualification heuristics', async () => {
    const provider = new MockAiProvider();
    const result = await provider.generateTask({
      task: 'lead_qualification',
      prompt: 'Lead: John Doe, Budget: $15,000, Needs CRM and marketing automation ASAP',
    });

    assert.equal(result.provider, 'mock');
    assert.equal(result.task, 'lead_qualification');
    assert.equal(result.costCents, 0);
    const parsed = JSON.parse(result.result);
    assert.ok(parsed.score >= 80);
    assert.equal(parsed.qualification, 'High Intent');
    assert.ok(parsed.recommendedAction);
  });

  test('Outbound Webhook Service computes HMAC-SHA256 signature and delivers test event', async () => {
    const testSecret = 'whsec_test_secret_key_12345';
    const payload = { event: 'contact.created', contactId: 'cnt-1' };
    const result = await sendWebhookHttp('https://test.local/webhook', testSecret, 'contact.created', payload);

    assert.equal(result.statusCode, 200);
    assert.ok(result.signature.startsWith('sha256='));
  });

  test('Cache client stores, retrieves, increments, and deletes keys', async () => {
    await cache.set('test:counter', '10', 60);
    const val = await cache.get('test:counter');
    assert.equal(val, '10');

    const incremented = await cache.incr('test:counter');
    assert.equal(incremented, 11);

    await cache.del('test:counter');
    const deletedVal = await cache.get('test:counter');
    assert.equal(deletedVal, null);
  });
});
