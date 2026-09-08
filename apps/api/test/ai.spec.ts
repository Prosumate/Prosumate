import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('AI Tools & Assistants Suite', () => {
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
        email: 'ai-owner-a@agency.com',
        password: 'Password123!',
        firstName: 'AI',
        lastName: 'Admin A',
        agencyName: 'AI Agency A',
        initialLocationName: 'AI Location A',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    // Top up wallet balance for token deduction
    await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/billing/wallet/topup`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { amountCents: 5000 },
    });

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'ai-owner-b@agency.com',
        password: 'Password123!',
        firstName: 'AI',
        lastName: 'Admin B',
        agencyName: 'AI Agency B',
        initialLocationName: 'AI Location B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;
  });

  test('AI Copywriter generates targeted sales emails and SMS pitches', async () => {
    // 1. Generate Email Copy
    const emailRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/ai/generate`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        task: 'generate_copy',
        prompt: 'Enterprise cold outreach for high-intent advisory clients',
        channel: 'email',
        tone: 'persuasive',
      },
    });

    assert.equal(emailRes.statusCode, 201);
    const emailData = emailRes.json().data;
    assert.equal(emailData.task, 'generate_copy');
    assert.equal(emailData.tone, 'persuasive');
    assert.ok(emailData.resultText.includes('Subject:'));
    assert.ok(emailData.tokensUsed > 0);
    assert.ok(emailData.costCents > 0);

    // 2. Generate SMS Copy
    const smsRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/ai/generate`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        task: 'generate_copy',
        prompt: 'Quick follow up for lead that filled out contact form',
        channel: 'sms',
        tone: 'friendly',
      },
    });

    assert.equal(smsRes.statusCode, 201);
    const smsData = smsRes.json().data;
    assert.ok(smsData.resultText.length > 10);
  });

  test('Lead qualification bot scores transcripts and recommends actions', async () => {
    const qualifyRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/ai/generate`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        task: 'qualify_lead',
        prompt: 'Client has $15,000/mo ad spend, VP of Marketing is decision maker, needs deployment in 2 weeks',
      },
    });

    assert.equal(qualifyRes.statusCode, 201);
    const qualifyData = qualifyRes.json().data;
    assert.equal(qualifyData.task, 'qualify_lead');
    assert.equal(qualifyData.qualificationScore, 88);
    assert.ok(qualifyData.recommendedAction);
    assert.ok(qualifyData.resultText.includes('BANT') || qualifyData.resultText.includes('Budget:'));
  });

  test('Token metering records usage transactions with rebilling markup', async () => {
    // 1. Generate text
    const genRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/ai/generate`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        task: 'suggest_reply',
        prompt: 'Client asking how fast migration takes',
      },
    });
    assert.equal(genRes.statusCode, 201);

    // 2. Verify usage transaction recorded in billing ledger
    const usageRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/billing/usage`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(usageRes.statusCode, 200);
    const transactions = usageRes.json().data;
    const aiTx = transactions.find((t: any) => t.type === 'ai_tokens');
    assert.ok(aiTx);
    assert.ok(aiTx.units > 0);
  });

  test('Agent persona configuration updates and history audit log', async () => {
    // 1. Update AI Persona
    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationAId}/ai/config`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Strategic Advisory Bot 2026',
        systemPrompt: 'Focus on high-value enterprise consulting services.',
        defaultTone: 'consultative',
        qualificationThreshold: 85,
      },
    });

    assert.equal(patchRes.statusCode, 200);
    const config = patchRes.json().data;
    assert.equal(config.name, 'Strategic Advisory Bot 2026');
    assert.equal(config.defaultTone, 'consultative');
    assert.equal(config.qualificationThreshold, 85);

    // 2. List history
    const historyRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/ai/history`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(historyRes.statusCode, 200);
  });

  test('Cross-tenant isolation: User B cannot access or generate with Location A AI', async () => {
    // User B attempts to access Location A AI config
    const crossConfig = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/ai/config`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossConfig.statusCode, 403);
    assert.equal(crossConfig.json().error.code, 'FORBIDDEN');

    // User B attempts to generate with Location A AI
    const crossGen = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/ai/generate`,
      headers: { authorization: `Bearer ${tokenUserB}` },
      payload: {
        task: 'generate_copy',
        prompt: 'Hack attempt',
      },
    });
    assert.equal(crossGen.statusCode, 403);
  });
});
