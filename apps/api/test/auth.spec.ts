import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Authentication & Session API Tests', () => {
  const app = buildApp();

  beforeEach(() => {
    memoryDb.clear();
  });

  test('POST /api/v1/auth/register creates user, agency, location and returns valid auth tokens', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'founder@testagency.com',
        password: 'Password123!',
        firstName: 'Alex',
        lastName: 'Rivera',
        agencyName: 'Test Agency Alpha',
        initialLocationName: 'Alpha HQ',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, 'founder@testagency.com');
    assert.equal(body.data.agency.name, 'Test Agency Alpha');
    assert.equal(body.data.location.name, 'Alpha HQ');
    assert.ok(body.data.tokens.accessToken);
    assert.ok(body.data.tokens.refreshToken);
    assert.ok(body.requestId);
  });

  test('POST /api/v1/auth/register rejects duplicate email address with 409 Conflict', async () => {
    const payload = {
      email: 'duplicate@testagency.com',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Doe',
      agencyName: 'Agency One',
    };

    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload,
    });
    assert.equal(first.statusCode, 201);

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...payload, agencyName: 'Agency Two' },
    });
    assert.equal(duplicate.statusCode, 409);
    const errorBody = duplicate.json();
    assert.equal(errorBody.success, false);
    assert.equal(errorBody.error.code, 'CONFLICT');
  });

  test('POST /api/v1/auth/register rejects invalid weak passwords with 400 Validation Error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'weakpass@test.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        agencyName: 'Test Agency',
      },
    });

    assert.equal(response.statusCode, 400);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  test('POST /api/v1/auth/login succeeds with correct password and rejects invalid password', async () => {
    // Register account first
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'login-test@agency.com',
        password: 'ValidPassword123!',
        firstName: 'Login',
        lastName: 'User',
        agencyName: 'Login Agency',
      },
    });

    // Attempt login with wrong password
    const failedLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'login-test@agency.com',
        password: 'WrongPassword999!',
      },
    });
    assert.equal(failedLogin.statusCode, 401);
    assert.equal(failedLogin.json().error.code, 'UNAUTHORIZED');

    // Attempt login with correct password
    const successLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'login-test@agency.com',
        password: 'ValidPassword123!',
      },
    });
    assert.equal(successLogin.statusCode, 200);
    const body = successLogin.json();
    assert.equal(body.success, true);
    assert.ok(body.data.tokens.accessToken);
    assert.ok(body.data.agencies.length > 0);
  });

  test('GET /api/v1/auth/me returns authenticated profile and memberships', async () => {
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'me-test@agency.com',
        password: 'ValidPassword123!',
        firstName: 'Me',
        lastName: 'Tester',
        agencyName: 'Me Agency',
      },
    });
    const token = regRes.json().data.tokens.accessToken;

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(meRes.statusCode, 200);
    const body = meRes.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, 'me-test@agency.com');
    assert.equal(body.data.agencies[0].role, 'OWNER');
  });
});
