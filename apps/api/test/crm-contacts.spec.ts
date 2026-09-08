import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('CRM Contacts & Timeline Security Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let locationAId: string;
  let locationBId: string;

  beforeEach(async () => {
    memoryDb.clear();

    // Register User A
    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'crm-a@agency.com',
        password: 'Password123!',
        firstName: 'CRM',
        lastName: 'Admin A',
        agencyName: 'Agency CRM A',
        initialLocationName: 'Location A',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    // Register User B
    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'crm-b@agency.com',
        password: 'Password123!',
        firstName: 'CRM',
        lastName: 'Admin B',
        agencyName: 'Agency CRM B',
        initialLocationName: 'Location B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;
    locationBId = regB.json().data.location.id;
  });

  test('POST /api/v1/locations/:locationId/contacts creates contact and logs timeline', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        firstName: 'Jonathan',
        lastName: 'Harker',
        email: 'jharker@carfax.co.uk',
        phone: '+44-20-7946-0991',
        source: 'referral',
        tags: ['High Priority', 'Enterprise'],
        status: 'lead',
      },
    });

    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.email, 'jharker@carfax.co.uk');
    assert.equal(body.data.tags.length, 2);

    // Verify contact detail & activity timeline
    const detailRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts/${body.data.id}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(detailRes.statusCode, 200);
    const detailBody = detailRes.json();
    assert.ok(detailBody.data.timeline.length > 0);
    assert.equal(detailBody.data.timeline[0].type, 'CONTACT_CREATED');
  });

  test('POST /api/v1/locations/:locationId/contacts rejects duplicate emails with 409 Conflict', async () => {
    const payload = {
      firstName: 'Mina',
      lastName: 'Murray',
      email: 'mina@carfax.co.uk',
      phone: '+44-20-7946-0992',
    };

    const first = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload,
    });
    assert.equal(first.statusCode, 201);

    const duplicate = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload,
    });
    assert.equal(duplicate.statusCode, 409);
    assert.equal(duplicate.json().error.code, 'CONFLICT');
  });

  test('POST note and task updates contact history', async () => {
    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        firstName: 'Arthur',
        lastName: 'Holmwood',
        email: 'arthur@godalming.com',
      },
    });
    const contactId = contactRes.json().data.id;

    // Add note
    const noteRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts/${contactId}/notes`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { content: 'Client confirmed budget allocation for annual contract.' },
    });
    assert.equal(noteRes.statusCode, 201);

    // Add task
    const taskRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts/${contactId}/tasks`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { title: 'Follow up on proposal terms', dueDate: '2026-09-10' },
    });
    assert.equal(taskRes.statusCode, 201);

    // Verify detail
    const detail = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts/${contactId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(detail.statusCode, 200);
    assert.equal(detail.json().data.notes.length, 1);
    assert.equal(detail.json().data.tasks.length, 1);
  });

  test('Cross-tenant isolation: User B CANNOT read or manipulate Location A contacts', async () => {
    // User A creates contact
    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        firstName: 'Secret',
        lastName: 'Agent',
        email: 'secret@classified.com',
      },
    });
    const contactId = contactRes.json().data.id;

    // User B attempts to read contact under Location A
    const crossRead = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts/${contactId}`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossRead.statusCode, 403);
    assert.equal(crossRead.json().error.code, 'FORBIDDEN');

    // User B attempts to list Location A contacts
    const crossList = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossList.statusCode, 403);
  });
});
