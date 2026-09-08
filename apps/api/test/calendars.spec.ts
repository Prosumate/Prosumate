import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Calendars & Appointment Booking Suite', () => {
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
        email: 'cal-a@agency.com',
        password: 'Password123!',
        firstName: 'Cal',
        lastName: 'Admin A',
        agencyName: 'Calendar Agency A',
        initialLocationName: 'Calendar Loc A',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'cal-b@agency.com',
        password: 'Password123!',
        firstName: 'Cal',
        lastName: 'Admin B',
        agencyName: 'Calendar Agency B',
        initialLocationName: 'Calendar Loc B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;
  });

  test('Creates calendar, gets available slots, and books appointment', async () => {
    // 1. Create calendar
    const calRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/calendars`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Strategy Sessions',
        slug: 'strategy-sessions',
        defaultDurationMinutes: 30,
        timezone: 'America/Chicago',
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }, // Monday
          { dayOfWeek: 3, startTime: '14:00', endTime: '17:00' }, // Wednesday
        ],
      },
    });

    assert.equal(calRes.statusCode, 201);
    const calendar = calRes.json().data;
    assert.equal(calendar.name, 'Strategy Sessions');
    assert.equal(calendar.availability.length, 2);

    // 2. Get slots for a Monday
    // Find next Monday
    const now = new Date();
    const daysUntilMonday = ((1 - now.getDay()) + 7) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    const mondayStr = nextMonday.toISOString().split('T')[0];

    const slotsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/calendars/${calendar.id}/slots?date=${mondayStr}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });

    assert.equal(slotsRes.statusCode, 200);
    const slotsData = slotsRes.json().data;
    assert.equal(slotsData.totalSlots, 6); // 09:00-12:00 with 30-min slots = 6 slots

    // 3. Create contact for booking
    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { firstName: 'Booking', lastName: 'Client', email: 'client@booking.com' },
    });
    const contactId = contactRes.json().data.id;

    // 4. Book first slot
    const bookRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/calendars/${calendar.id}/book`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        contactId,
        title: 'Strategy Deep Dive',
        startTime: slotsData.slots[0].startTime,
      },
    });

    assert.equal(bookRes.statusCode, 201);
    assert.equal(bookRes.json().data.status, 'scheduled');

    // 5. Verify slot is now taken (5 remaining)
    const slotsAfterRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/calendars/${calendar.id}/slots?date=${mondayStr}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(slotsAfterRes.json().data.totalSlots, 5);
  });

  test('Booking the same slot twice returns conflict', async () => {
    const calRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/calendars`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Conflict Test Cal',
        slug: 'conflict-test',
        defaultDurationMinutes: 60,
        availability: [{ dayOfWeek: 2, startTime: '10:00', endTime: '12:00' }], // Tuesday
      },
    });
    const calendar = calRes.json().data;

    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { firstName: 'Conflict', lastName: 'Tester', email: 'conflict@test.com' },
    });
    const contactId = contactRes.json().data.id;

    // Find next Tuesday
    const now = new Date();
    const daysUntilTuesday = ((2 - now.getDay()) + 7) % 7 || 7;
    const nextTuesday = new Date(now);
    nextTuesday.setDate(now.getDate() + daysUntilTuesday);
    const tuesdayStr = nextTuesday.toISOString().split('T')[0];

    // Book first slot
    await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/calendars/${calendar.id}/book`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        contactId,
        title: 'First Booking',
        startTime: `${tuesdayStr}T10:00:00`,
      },
    });

    // Attempt same slot
    const conflictRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/calendars/${calendar.id}/book`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        contactId,
        title: 'Conflicting Booking',
        startTime: `${tuesdayStr}T10:00:00`,
      },
    });

    assert.equal(conflictRes.statusCode, 409);
    assert.equal(conflictRes.json().error.code, 'CONFLICT');
  });

  test('Cross-tenant: User B cannot access Location A calendars', async () => {
    const calRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/calendars`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Secret Calendar',
        slug: 'secret-cal',
        availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
      },
    });

    const crossRead = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/calendars`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossRead.statusCode, 403);
  });
});
