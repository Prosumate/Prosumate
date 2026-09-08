import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Marketplace, Webhooks & Enterprise SSO Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let locationAId: string;
  let snapshotId: string;

  beforeEach(async () => {
    memoryDb.clear();

    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'marketplace-owner-a@agency.com',
        password: 'Password123!',
        firstName: 'Marketplace',
        lastName: 'Admin A',
        agencyName: 'Enterprise Agency A',
        initialLocationName: 'Austin Enterprise HQ',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'marketplace-owner-b@agency.com',
        password: 'Password123!',
        firstName: 'Marketplace',
        lastName: 'Admin B',
        agencyName: 'Enterprise Agency B',
        initialLocationName: 'Miami Enterprise Branch',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;

    // Seed sample snapshot
    const snap = memoryDb.createSnapshot({
      name: 'Real Estate Growth Engine',
      slug: 'real-estate-engine',
      category: 'real_estate',
      description: 'Luxury brokerage pipeline and appointment booking.',
      icon: 'Home',
      pipelineTemplate: {
        name: 'VIP Real Estate Pipeline',
        stages: [
          { name: 'Lead Inquired', probability: 20 },
          { name: 'Showing Booked', probability: 50 },
          { name: 'Closed Won', probability: 100 },
        ],
      },
      calendarTemplate: {
        name: 'Showing Booking Calendar',
        durationMinutes: 45,
      },
      formTemplate: {
        name: 'Showing Request Form',
        fields: [{ label: 'Budget', type: 'text', required: true }],
      },
      workflowTemplate: {
        name: 'Speed-to-Lead Follow-up',
        triggerType: 'FORM_SUBMITTED',
        actions: [{ type: 'SEND_SMS', parameters: { message: 'Tour confirmed!' } }],
      },
      aiPersonaTemplate: {
        name: 'VIP Real Estate Agent Bot',
        systemPrompt: 'Luxury real estate advisor.',
        defaultTone: 'consultative',
      },
    });
    snapshotId = snap.id;
  });

  test('Marketplace catalogue retrieval and 1-click snapshot installation into location', async () => {
    // 1. List Snapshots
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/marketplace/snapshots',
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(listRes.statusCode, 200);
    assert.ok(listRes.json().data.length > 0);

    // 2. Install snapshot into Location A
    const installRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/marketplace/install/${snapshotId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });

    assert.equal(installRes.statusCode, 201);
    const installData = installRes.json().data;
    assert.equal(installData.success, true);
    assert.ok(installData.installedAssets.pipelineId);
    assert.ok(installData.installedAssets.calendarId);
    assert.ok(installData.installedAssets.formId);
    assert.ok(installData.installedAssets.workflowId);

    // 3. Verify pipeline was cloned into Location A
    const pipelines = memoryDb.listPipelinesByLocation(locationAId);
    assert.ok(pipelines.some((p) => p.name.includes('VIP Real Estate Pipeline')));
  });

  test('Outbound webhook creation and test event dispatch with HMAC-SHA256 signature', async () => {
    // 1. Create Webhook
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/webhooks`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'HubSpot Inbound Sync',
        targetUrl: 'https://api.hubspot.com/v1/webhooks',
        events: ['contact.created', 'appointment.booked'],
      },
    });

    assert.equal(createRes.statusCode, 201);
    const webhook = createRes.json().data;
    assert.equal(webhook.name, 'HubSpot Inbound Sync');
    assert.ok(webhook.secretKey);
    assert.equal(webhook.status, 'active');

    // 2. Dispatch Test Webhook
    const testRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/webhooks/${webhook.id}/test`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });

    assert.equal(testRes.statusCode, 200);
    const log = testRes.json().data;
    assert.equal(log.event, 'test.ping');
    assert.ok(log.signature.startsWith('sha256='));
    assert.equal(log.responseStatus, 200);
  });

  test('Audit log export endpoints in CSV and JSON formats', async () => {
    // 1. Export CSV
    const csvRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/audit-logs/export?format=csv`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(csvRes.statusCode, 200);
    assert.ok(csvRes.headers['content-type']?.includes('text/csv'));
    assert.ok(csvRes.payload.includes('id,createdAt,action'));

    // 2. Export JSON
    const jsonRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/audit-logs/export?format=json`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(jsonRes.statusCode, 200);
    assert.ok(jsonRes.headers['content-type']?.includes('application/json'));
  });

  test('Enterprise SSO configuration updates', async () => {
    const ssoRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationAId}/sso`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        provider: 'saml',
        idpMetadataUrl: 'https://login.microsoftonline.com/tenant-123/federationmetadata/2007-06/federationmetadata.xml',
        enforceSso: true,
        allowedDomains: ['enterprise-agency.com', 'austinhq.com'],
      },
    });

    assert.equal(ssoRes.statusCode, 200);
    const ssoData = ssoRes.json().data;
    assert.equal(ssoData.provider, 'saml');
    assert.equal(ssoData.enforceSso, true);
    assert.deepEqual(ssoData.allowedDomains, ['enterprise-agency.com', 'austinhq.com']);
  });

  test('Cross-tenant isolation: User B cannot install snapshots, manage webhooks, or alter SSO on Location A', async () => {
    // 1. Install snapshot into Location A
    const crossInstall = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/marketplace/install/${snapshotId}`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossInstall.statusCode, 403);
    assert.equal(crossInstall.json().error.code, 'FORBIDDEN');

    // 2. Webhooks
    const crossWebhooks = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/webhooks`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossWebhooks.statusCode, 403);

    // 3. SSO
    const crossSso = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/sso`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossSso.statusCode, 403);
  });
});
