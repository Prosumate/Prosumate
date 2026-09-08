import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb, hashPasswordSimple } from '@prosumate/database';
import { AuditAction } from '@prosumate/types';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

describe('Strict Cross-Tenant Isolation Security Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let tokenPlatformAdmin: string;
  let agencyAId: string;
  let locationAId: string;
  let agencyBId: string;
  let locationBId: string;

  beforeEach(async () => {
    memoryDb.clear();

    // 1. Setup Agency A
    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'owner@agency-a.com',
        password: 'Password123!',
        firstName: 'Alice',
        lastName: 'Anderson',
        agencyName: 'Agency Alpha',
        initialLocationName: 'Alpha Austin',
      },
    });
    const bodyA = regA.json();
    tokenUserA = bodyA.data.tokens.accessToken;
    agencyAId = bodyA.data.agency.id;
    locationAId = bodyA.data.location.id;

    // 2. Setup Agency B
    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'owner@agency-b.com',
        password: 'Password123!',
        firstName: 'Bob',
        lastName: 'Baker',
        agencyName: 'Agency Beta',
        initialLocationName: 'Beta Boston',
      },
    });
    const bodyB = regB.json();
    tokenUserB = bodyB.data.tokens.accessToken;
    agencyBId = bodyB.data.agency.id;
    locationBId = bodyB.data.location.id;

    // 3. Setup Platform Superadmin
    const superAdmin = memoryDb.createUser({
      email: 'root@prosumate.local',
      passwordHash: hashPasswordSimple('PlatformRoot2026!'),
      firstName: 'Platform',
      lastName: 'Superadmin',
      isPlatformAdmin: true,
    });
    tokenPlatformAdmin = jwt.sign(
      {
        sub: superAdmin.id,
        email: superAdmin.email,
        isPlatformAdmin: true,
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  test('User B CANNOT read Agency A details (Returns 403 Forbidden and records audit violation)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/agencies/${agencyAId}`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'FORBIDDEN');
    assert.match(body.error.message, /Cross-tenant access prohibited/i);

    // Verify security audit log was recorded
    const violations = memoryDb.auditLogs.filter(
      (log) => log.action === AuditAction.CROSS_TENANT_ACCESS_DENIED
    );
    assert.ok(violations.length > 0);
    assert.equal(violations[0]?.agencyId, agencyAId);
  });

  test('User B CANNOT read Location A details', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'FORBIDDEN');
  });

  test('User B CANNOT provision a Location under Agency A', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/agency/${agencyAId}`,
      headers: { authorization: `Bearer ${tokenUserB}` },
      payload: {
        name: 'Malicious Injected Location',
        timezone: 'UTC',
      },
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'FORBIDDEN');
  });

  test('User B CANNOT list users belonging to Location A', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/users`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });

    assert.equal(response.statusCode, 403);
    assert.equal(response.json().error.code, 'FORBIDDEN');
  });

  test('User A CAN successfully access their own Agency A and Location A', async () => {
    const agencyRes = await app.inject({
      method: 'GET',
      url: `/api/v1/agencies/${agencyAId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(agencyRes.statusCode, 200);
    assert.equal(agencyRes.json().data.name, 'Agency Alpha');

    const locationRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(locationRes.statusCode, 200);
    assert.equal(locationRes.json().data.name, 'Alpha Austin');
  });

  test('Platform Admin can inspect any agency for platform support', async () => {
    const agencyRes = await app.inject({
      method: 'GET',
      url: `/api/v1/agencies/${agencyAId}`,
      headers: { authorization: `Bearer ${tokenPlatformAdmin}` },
    });
    assert.equal(agencyRes.statusCode, 200);
    assert.equal(agencyRes.json().data.name, 'Agency Alpha');
  });
});
