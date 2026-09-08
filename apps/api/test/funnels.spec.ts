import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Landing Pages, Funnels & Page Builder Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let locationAId: string;
  let formAId: string;

  beforeEach(async () => {
    memoryDb.clear();

    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'funnel-owner-a@agency.com',
        password: 'Password123!',
        firstName: 'Funnel',
        lastName: 'Admin A',
        agencyName: 'Funnel Agency A',
        initialLocationName: 'Funnel Location A',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    // Create a form in Location A for embedding
    const formRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/forms`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Funnel VIP Form',
        slug: 'funnel-vip-form',
        fields: [
          { label: 'Full Name', type: 'text', required: true },
          { label: 'Email', type: 'email', required: true },
        ],
      },
    });
    formAId = formRes.json().data.id;

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'funnel-owner-b@agency.com',
        password: 'Password123!',
        firstName: 'Funnel',
        lastName: 'Admin B',
        agencyName: 'Funnel Agency B',
        initialLocationName: 'Funnel Location B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;
  });

  test('Creates multi-step sales funnel with customizable section blocks', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/funnels`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Consulting Client Acquisition',
        slug: 'consulting-funnel',
        description: 'Lead generation and sales page funnel',
        published: true,
        steps: [
          {
            name: 'Opt-in Strategy Session',
            slug: 'opt-in',
            type: 'opt_in',
            order: 0,
            nextStepSlug: 'thank-you',
            blocks: [
              {
                type: 'hero',
                title: 'Transform Your Business with Advisory',
                subtitle: 'Enterprise strategy blueprint for modern firms',
                settings: { badgeText: '2026 Strategy' },
                order: 0,
              },
              {
                type: 'form_embed',
                title: 'Request Your Access',
                settings: { formId: formAId },
                order: 1,
              },
            ],
          },
          {
            name: 'Session Confirmed',
            slug: 'thank-you',
            type: 'thank_you',
            order: 1,
            blocks: [
              {
                type: 'hero',
                title: 'Application Received!',
                subtitle: 'We will be in touch shortly',
                settings: { badgeText: 'Success' },
                order: 0,
              },
            ],
          },
        ],
      },
    });

    assert.equal(createRes.statusCode, 201);
    const funnel = createRes.json().data;
    assert.equal(funnel.name, 'Consulting Client Acquisition');
    assert.equal(funnel.slug, 'consulting-funnel');
    assert.equal(funnel.steps.length, 2);
    assert.equal(funnel.steps[0].blocks.length, 2);
    assert.equal(funnel.steps[1].blocks.length, 1);
  });

  test('Public funnel endpoint delivers enriched step definitions and embedded form schema', async () => {
    // 1. Create published funnel
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/funnels`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Public Strategy Funnel',
        slug: 'public-strategy',
        published: true,
        steps: [
          {
            name: 'Opt-in Step',
            slug: 'opt-in',
            type: 'opt_in',
            order: 0,
            blocks: [
              {
                type: 'hero',
                title: 'Scale Revenue Fast',
                settings: {},
                order: 0,
              },
              {
                type: 'form_embed',
                title: 'Join Network',
                settings: { formId: formAId },
                order: 1,
              },
            ],
          },
        ],
      },
    });
    assert.equal(createRes.statusCode, 201);

    // 2. Fetch publicly without auth
    const publicRes = await app.inject({
      method: 'GET',
      url: '/api/v1/public/funnels/public-strategy',
    });
    assert.equal(publicRes.statusCode, 200);
    const publicData = publicRes.json().data;
    assert.equal(publicData.slug, 'public-strategy');
    assert.equal(publicData.steps.length, 1);

    // Verify form_embed block was enriched with embeddedForm object
    const formBlock = publicData.steps[0].blocks.find((b: any) => b.type === 'form_embed');
    assert.ok(formBlock);
    assert.equal(formBlock.embeddedForm.name, 'Funnel VIP Form');
    assert.equal(formBlock.embeddedForm.fields.length, 2);
  });

  test('Funnel event dispatcher tracks page views and conversions accurately', async () => {
    // 1. Create funnel
    await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/funnels`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Tracking Test Funnel',
        slug: 'tracking-test',
        published: true,
        steps: [
          {
            name: 'Landing Page',
            slug: 'landing',
            type: 'sales',
            order: 0,
            blocks: [],
          },
        ],
      },
    });

    // 2. Record 2 Page Views
    await app.inject({
      method: 'POST',
      url: '/api/v1/public/funnels/tracking-test/events',
      payload: { stepSlug: 'landing', type: 'view' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/public/funnels/tracking-test/events',
      payload: { stepSlug: 'landing', type: 'view' },
    });

    // 3. Record 1 Conversion
    const convRes = await app.inject({
      method: 'POST',
      url: '/api/v1/public/funnels/tracking-test/events',
      payload: { stepSlug: 'landing', type: 'conversion' },
    });
    assert.equal(convRes.statusCode, 200);
    const tracking = convRes.json().data;
    assert.equal(tracking.funnel.totalViews, 2);
    assert.equal(tracking.funnel.totalConversions, 1);
    assert.equal(tracking.step.pageViews, 2);
    assert.equal(tracking.step.conversions, 1);
  });

  test('Cross-tenant isolation: User B cannot access or modify Location A funnels', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/funnels`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Proprietary Location A Funnel',
        slug: 'prop-a',
        published: true,
        steps: [{ name: 'S1', slug: 's1', type: 'opt_in', blocks: [] }],
      },
    });
    const funnelId = createRes.json().data.id;

    // User B attempts to list Location A funnels
    const crossList = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/funnels`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossList.statusCode, 403);
    assert.equal(crossList.json().error.code, 'FORBIDDEN');

    // User B attempts to update Location A funnel
    const crossUpdate = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationAId}/funnels/${funnelId}`,
      headers: { authorization: `Bearer ${tokenUserB}` },
      payload: { name: 'Hacked Funnel' },
    });
    assert.equal(crossUpdate.statusCode, 403);

    // User B attempts to delete Location A funnel
    const crossDelete = await app.inject({
      method: 'DELETE',
      url: `/api/v1/locations/${locationAId}/funnels/${funnelId}`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossDelete.statusCode, 403);
  });
});
