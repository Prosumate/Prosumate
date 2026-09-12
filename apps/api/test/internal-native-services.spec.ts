import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  InternalEmailProvider,
  InternalSmsProvider,
  InternalPaymentProvider,
  InternalAiProvider,
} from '../src/providers';
import { internalAutomationEngine } from '../src/modules/workflows/internal-automation.service';
import { cache, eventBus, jobQueue } from '../src/common/redis';
import { buildApp } from '../src/app';
import { db } from '../src/database';
import { config } from '../src/config';

describe('100% Native Internal Architecture Suite', () => {
  // 1. Internal Email Provider
  describe('Native Internal Email Engine', () => {
    test('dispatches email, stores record in outbox, and computes deliverability score', async () => {
      const emailEngine = new InternalEmailProvider();
      const res = await emailEngine.sendEmail({
        to: 'client@prosumate.local',
        subject: 'Your Onboarding Briefing',
        text: 'Welcome to your internal workspace.',
      });

      assert.equal(res.success, true);
      assert.equal(res.provider, 'internal');
      assert.equal(res.status, 'delivered');
      assert.ok(res.deliverabilityScore! >= 80);

      const outbox = emailEngine.getOutbox();
      assert.equal(outbox.length, 1);
      assert.equal(outbox[0]!.to[0], 'client@prosumate.local');
      assert.equal(outbox[0]!.status, 'delivered');

      // Test lifecycle: open and click tracking
      const opened = emailEngine.markOpened(res.messageId);
      assert.equal(opened, true);
      assert.equal(emailEngine.getEmailById(res.messageId)?.status, 'opened');

      const clicked = emailEngine.markClicked(res.messageId);
      assert.equal(clicked, true);
      assert.equal(emailEngine.getEmailById(res.messageId)?.status, 'clicked');
    });

    test('rejects invalid recipient format cleanly without external errors', async () => {
      const emailEngine = new InternalEmailProvider();
      const res = await emailEngine.sendEmail({
        to: 'invalid-email-address',
        subject: 'Test',
        text: 'Body',
      });

      assert.equal(res.success, false);
      assert.equal(res.status, 'failed');
      assert.equal(res.error, 'Invalid recipient email format');
    });
  });

  // 2. Internal SMS & Telephony Engine
  describe('Native Internal SMS & Telephony Engine', () => {
    test('sends SMS and calculates GSM segments accurately', async () => {
      const smsEngine = new InternalSmsProvider();
      const res = await smsEngine.sendSms({
        to: '+1 (555) 234-5678',
        body: 'Hello from Prosumate! Your appointment is confirmed.',
      });

      assert.equal(res.success, true);
      assert.equal(res.provider, 'internal');
      assert.equal(res.status, 'delivered');
      assert.equal(res.segments, 1);
      assert.ok(smsEngine.getVirtualNumbers().length >= 3);
    });

    test('handles carrier compliance STOP and START opt-out keywords', async () => {
      const smsEngine = new InternalSmsProvider();
      const testPhone = '+1 (555) 999-8888';

      // 1. Receive STOP keyword
      const stopResult = smsEngine.receiveInboundSms(testPhone, 'STOP');
      assert.ok(stopResult.autoReply?.includes('opted out'));
      assert.equal(smsEngine.isOptedOut(testPhone), true);

      // 2. Subsequent outbound SMS is blocked
      const outboundBlocked = await smsEngine.sendSms({
        to: testPhone,
        body: 'Should not deliver',
      });
      assert.equal(outboundBlocked.success, false);
      assert.ok(outboundBlocked.error?.includes('opted out'));

      // 3. Receive START keyword to resubscribe
      const startResult = smsEngine.receiveInboundSms(testPhone, 'START');
      assert.ok(startResult.autoReply?.includes('re-subscribed'));
      assert.equal(smsEngine.isOptedOut(testPhone), false);

      // 4. Now outbound SMS succeeds
      const outboundAllowed = await smsEngine.sendSms({
        to: testPhone,
        body: 'Welcome back!',
      });
      assert.equal(outboundAllowed.success, true);
    });
  });

  // 3. Internal Payment & Invoicing Engine
  describe('Native Internal Billing & Payment Engine', () => {
    beforeEach(() => {
      if (!db().findLocationById('loc-int-test-1')) {
        const agency = db().createAgency({ id: 'agency-int-test-1', name: 'Internal Billing Agency' });
        db().createLocation({ id: 'loc-int-test-1', agencyId: agency.id, name: 'Billing Test Loc' });
      }
      const wallet = db().getCreditWallet('loc-int-test-1');
      wallet.balanceCents = 0;
    });

    test('validates card numbers with Luhn check', () => {
      assert.equal(InternalPaymentProvider.validateLuhn('4242424242424242'), true);
      assert.equal(InternalPaymentProvider.validateLuhn('1234567812345670'), true);
      assert.equal(InternalPaymentProvider.validateLuhn('1234567812345678'), false);
    });

    test('creates subscription with coupon discount and generates HTML invoice', async () => {
      const billingEngine = new InternalPaymentProvider();

      const sub = await billingEngine.createSubscription({
        locationId: 'loc-int-test-1',
        planId: 'growth',
        couponCode: 'PROSU20', // 20% off
      });

      assert.equal(sub.provider, 'internal');
      assert.equal(sub.status, 'active');
      assert.ok(sub.invoiceId);

      const invoices = billingEngine.listInvoices('loc-int-test-1');
      assert.equal(invoices.length, 1);
      assert.equal(invoices[0]!.amountDueCents, 23760); // 29700 - 20% (5940) = 23760
      assert.ok(invoices[0]!.pdfHtml.includes('INVOICE'));
      assert.ok(invoices[0]!.pdfHtml.includes('PROSU20'));
    });

    test('tops up wallet and generates receipt invoice', async () => {
      const billingEngine = new InternalPaymentProvider();
      const res = await billingEngine.topUpWallet({
        locationId: 'loc-int-test-1',
        amountCents: 5000,
      });

      assert.equal(res.success, true);
      assert.equal(res.provider, 'internal');
      assert.equal(res.newBalanceCents, 5000);
      assert.ok(res.invoicePdfUrl?.includes('/download'));
    });
  });

  // 4. Internal AI Assistant
  describe('Native Internal AI Assistant Engine', () => {
    test('qualifies lead with BANT score and action recommendations', async () => {
      const aiEngine = new InternalAiProvider();
      const res = await aiEngine.generateTask({
        task: 'qualify_lead',
        prompt: 'We are an enterprise agency with 50 employees, $50k monthly budget, CEO is decision maker, looking to replace manual outreach immediately.',
        tone: 'professional',
      });

      assert.equal(res.provider, 'internal');
      assert.equal(res.costCents, 0); // $0 offline cost
      assert.ok(res.qualificationScore! >= 80);
      assert.ok(res.result.includes('High ($10k+/mo potential)'));
      assert.ok(res.result.includes('Direct Decision Maker'));
    });

    test('performs sentiment analysis and intent detection', async () => {
      const aiEngine = new InternalAiProvider();
      const res = await aiEngine.generateTask({
        task: 'suggest_reply',
        prompt: 'How much does the Agency Pro tier cost per month?',
      });

      assert.equal(res.intent, 'pricing_inquiry');
      assert.ok(res.result.includes('pricing'));
    });

    test('generates marketing copy across channels at $0 cost', async () => {
      const aiEngine = new InternalAiProvider();
      const emailCopy = await aiEngine.generateTask({
        task: 'generate_copy',
        prompt: 'B2B Lead gen',
        channel: 'email',
      });
      assert.ok(emailCopy.result.includes('Subject:'));

      const smsCopy = await aiEngine.generateTask({
        task: 'generate_copy',
        prompt: 'Appointment reminder',
        channel: 'sms',
      });
      assert.ok(smsCopy.result.length > 20);
    });
  });

  // 5. Internal Automation Engine
  describe('Native Internal Automation Engine (n8n Alternative)', () => {
    test('executes multi-step workflow without external tools', async () => {
      // Setup test agency, location, contact, and workflow in memoryDb
      const agency = db().createAgency({ name: 'Internal Auto Agency' });
      const location = db().createLocation({ agencyId: agency.id, name: 'Auto Location' });
      const contact = db().createContact({
        agencyId: agency.id,
        locationId: location.id,
        firstName: 'Alex',
        lastName: 'Morgan',
        email: 'alex.morgan@test.local',
        phone: '+15551234567',
        tags: ['prospect'],
      });

      const workflow = db().createWorkflow({
        agencyId: agency.id,
        locationId: location.id,
        name: 'Internal Lead Nurture Pipeline',
        trigger: { type: 'CONTACT_CREATED' },
        status: 'PUBLISHED',
        steps: [
          {
            name: 'Send Welcome Email',
            actionType: 'SEND_EMAIL',
            order: 0,
            config: {
              subject: 'Welcome {{contact.firstName}}!',
              body: 'Hi {{contact.firstName}}, welcome aboard.',
            },
          },
          {
            name: 'Add VIP Tag',
            actionType: 'ADD_TAG',
            order: 1,
            config: { tag: 'vip_prospect' },
          },
          {
            name: 'Wait 30 Mins',
            actionType: 'WAIT',
            order: 2,
            config: { delayMinutes: 30 },
          },
        ],
      });

      const execution = await internalAutomationEngine.executeWorkflow(workflow.id, {
        contactId: contact.id,
        triggerEvent: 'CONTACT_CREATED',
      });

      assert.equal(execution.status, 'completed');
      assert.equal(execution.stepsExecuted.length, 3);
      assert.equal(execution.stepsExecuted[0]!.actionType, 'SEND_EMAIL');
      assert.equal(execution.stepsExecuted[0]!.status, 'completed');
      assert.equal(execution.stepsExecuted[1]!.actionType, 'ADD_TAG');
      assert.equal(execution.stepsExecuted[1]!.status, 'completed');
      assert.ok(contact.tags.includes('vip_prospect'));
    });
  });

  // 6. Internal Cache, PubSub & Queue
  describe('Native Internal Cache, Pub/Sub & Job Queue', () => {
    test('cache supports TTL, incr, and key listing', async () => {
      await cache.set('internal:key1', 'val1', 60);
      assert.equal(await cache.get('internal:key1'), 'val1');

      const count = await cache.incr('internal:counter');
      assert.equal(count, 1);

      const keys = await cache.keys('internal:*');
      assert.ok(keys.length >= 2);
    });

    test('event bus dispatches events to subscribers', () => {
      let receivedData: any = null;
      const unsubscribe = eventBus.subscribe('test.event', (data) => {
        receivedData = data;
      });

      eventBus.publish('test.event', { message: 'hello internal' });
      assert.deepEqual(receivedData, { message: 'hello internal' });
      unsubscribe();
    });

    test('job queue enqueues and tracks jobs', async () => {
      const job = await jobQueue.enqueue('email-queue', { to: 'job@test.local' });
      assert.equal(job.status, 'pending');
      assert.equal(job.queue, 'email-queue');

      const stats = jobQueue.getQueueStats('email-queue');
      assert.ok(stats.total >= 1);
    });
  });

  // 7. Diagnostics Health Endpoints
  describe('Internal Architecture Diagnostics API', () => {
    test('GET /health confirms 100% internal native mode with zero external dependencies', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'GET',
        url: '/health',
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.mode, '100% Internal Native Architecture');
      assert.equal(body.data.externalDependencies, 'none');
    });

    test('GET /api/v1/internal/services reports native engine details', async () => {
      const app = buildApp();
      const adminUser = db().createUser({
        email: 'internal-admin@prosumate.local',
        passwordHash: 'dummyhash',
        firstName: 'Internal',
        lastName: 'Admin',
        isPlatformAdmin: true,
      });
      const adminToken = jwt.sign(
        {
          sub: adminUser.id,
          email: adminUser.email,
          isPlatformAdmin: true,
        },
        config.jwtSecret,
        { expiresIn: '1h' }
      );
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/internal/services',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.ok(body.data.architecture.includes('100% Native Internal'));
      assert.ok(body.data.services.ai.capabilities.length >= 4);
    });
  });
});
