import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('CRM Pipelines & Opportunity Kanban Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let locationAId: string;
  let locationBId: string;

  beforeEach(async () => {
    memoryDb.clear();

    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'pipe-a@agency.com',
        password: 'Password123!',
        firstName: 'Pipe',
        lastName: 'Admin A',
        agencyName: 'Pipeline Agency A',
        initialLocationName: 'Pipeline Loc A',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'pipe-b@agency.com',
        password: 'Password123!',
        firstName: 'Pipe',
        lastName: 'Admin B',
        agencyName: 'Pipeline Agency B',
        initialLocationName: 'Pipeline Loc B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;
    locationBId = regB.json().data.location.id;
  });

  test('Creates pipeline, opportunities, and verifies Kanban board aggregation', async () => {
    // 1. Create custom pipeline with 3 stages
    const pipeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/pipelines`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Enterprise Sales 2026',
        stages: [
          { name: 'Lead Qualified', color: '#6366f1' },
          { name: 'Proposal Review', color: '#f59e0b' },
          { name: 'Closed Won', color: '#10b981' },
        ],
      },
    });

    assert.equal(pipeRes.statusCode, 201);
    const pipeline = pipeRes.json().data;
    assert.equal(pipeline.stages.length, 3);
    const stage1Id = pipeline.stages[0].id;
    const stage2Id = pipeline.stages[1].id;

    // 2. Create contact for opportunity
    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        firstName: 'SaaS',
        lastName: 'Buyer',
        email: 'buyer@bigcorp.com',
      },
    });
    const contactId = contactRes.json().data.id;

    // 3. Create 2 opportunities in different stages
    const opp1Res = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/opportunities`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        pipelineId: pipeline.id,
        stageId: stage1Id,
        contactId,
        name: 'BigCorp Tier 1 Contract',
        monetaryValue: 15000,
      },
    });
    assert.equal(opp1Res.statusCode, 201);
    const opp1Id = opp1Res.json().data.id;

    const opp2Res = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/opportunities`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        pipelineId: pipeline.id,
        stageId: stage2Id,
        contactId,
        name: 'BigCorp Add-on License',
        monetaryValue: 5000,
      },
    });
    assert.equal(opp2Res.statusCode, 201);

    // 4. Fetch Kanban board and verify stage totals
    const boardRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/pipelines/${pipeline.id}/board`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });

    assert.equal(boardRes.statusCode, 200);
    const board = boardRes.json().data;
    assert.equal(board.pipelineTotalValue, 20000);
    assert.equal(board.stages[0].totalValue, 15000);
    assert.equal(board.stages[1].totalValue, 5000);
    assert.equal(board.stages[2].totalValue, 0);

    // 5. Advance Opportunity 1 from Stage 1 -> Stage 2
    const moveRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/locations/${locationAId}/opportunities/${opp1Id}/stage`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: { stageId: stage2Id },
    });
    assert.equal(moveRes.statusCode, 200);

    // 6. Verify updated board values
    const updatedBoardRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/pipelines/${pipeline.id}/board`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    const updatedBoard = updatedBoardRes.json().data;
    assert.equal(updatedBoard.stages[0].totalValue, 0);
    assert.equal(updatedBoard.stages[1].totalValue, 20000);
  });

  test('Cross-tenant isolation: User B cannot access Location A pipeline or board', async () => {
    // User A creates pipeline
    const pipeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/pipelines`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Confidential Strategy Pipeline',
        stages: [{ name: 'Secret Stage 1' }],
      },
    });
    const pipelineId = pipeRes.json().data.id;

    // User B attempts to access board
    const crossBoard = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/pipelines/${pipelineId}/board`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossBoard.statusCode, 403);
    assert.equal(crossBoard.json().error.code, 'FORBIDDEN');
  });
});
