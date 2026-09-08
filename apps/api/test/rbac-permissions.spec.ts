import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb, hashPasswordSimple } from '@prosumate/database';
import { LocationRole, AuditAction } from '@prosumate/types';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

describe('RBAC & Granular Permission Security Suite', () => {
  const app = buildApp();

  let readonlyUserToken: string;
  let locationId: string;
  let agencyId: string;

  beforeEach(async () => {
    memoryDb.clear();

    // 1. Setup Agency & Location
    const agency = memoryDb.createAgency({
      name: 'Security Test Agency',
    });
    agencyId = agency.id;

    const location = memoryDb.createLocation({
      agencyId: agency.id,
      name: 'Security Test Branch',
    });
    locationId = location.id;

    // 2. Setup Readonly User
    const readonlyUser = memoryDb.createUser({
      email: 'readonly@agency.com',
      passwordHash: hashPasswordSimple('ReadOnlyPass123!'),
      firstName: 'Reader',
      lastName: 'Only',
    });

    memoryDb.createAgencyMembership({
      userId: readonlyUser.id,
      agencyId: agency.id,
      role: 'MEMBER' as any,
    });

    memoryDb.createLocationMembership({
      userId: readonlyUser.id,
      locationId: location.id,
      role: LocationRole.LOCATION_READONLY,
    });

    readonlyUserToken = jwt.sign(
      {
        sub: readonlyUser.id,
        email: readonlyUser.email,
        isPlatformAdmin: false,
        agencyId: agency.id,
        locationId: location.id,
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  test('Read-only user CAN read location details', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationId}`,
      headers: { authorization: `Bearer ${readonlyUserToken}` },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.name, 'Security Test Branch');
  });

  test('Read-only user CANNOT modify location details (Missing location:update permission)', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationId}`,
      headers: { authorization: `Bearer ${readonlyUserToken}` },
      payload: {
        name: 'Unauthorized New Name',
      },
    });

    assert.equal(response.statusCode, 403);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'FORBIDDEN');
    assert.match(body.error.message, /Insufficient privileges/i);

    // Assert that UNAUTHORIZED_ACCESS_ATTEMPT was captured
    const attempts = memoryDb.auditLogs.filter(
      (log) => log.action === AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT
    );
    assert.ok(attempts.length > 0);
  });
});
