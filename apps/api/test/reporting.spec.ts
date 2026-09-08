import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Reporting, Attribution & Reputation Management Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let locationAId: string;
  let contactAId: string;

  beforeEach(async () => {
    memoryDb.clear();

    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'report-owner-a@agency.com',
        password: 'Password123!',
        firstName: 'Report',
        lastName: 'Admin A',
        agencyName: 'Report Agency A',
        initialLocationName: 'Report Location A',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    // Create a contact in Location A
    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/contacts`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        firstName: 'Arthur',
        lastName: 'Dent',
        email: 'arthur.dent@galaxy.com',
        phone: '+1-512-555-0142',
      },
    });
    contactAId = contactRes.json().data.id;

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'report-owner-b@agency.com',
        password: 'Password123!',
        firstName: 'Report',
        lastName: 'Admin B',
        agencyName: 'Report Agency B',
        initialLocationName: 'Report Location B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;
  });

  test('Multi-channel attribution reporting computes correct ROAS, CAC, and blended metrics', async () => {
    // 1. Record campaign metrics
    await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/reporting/campaigns`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        channel: 'google_ads',
        campaignName: 'Enterprise Search Ads',
        adSpendCents: 10000, // $100.00
        impressions: 1000,
        clicks: 100,
        leadsGenerated: 10,
        dealsClosed: 2,
        revenueGeneratedCents: 50000, // $500.00 -> ROAS 5.0x
      },
    });

    await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/reporting/campaigns`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        channel: 'facebook_ads',
        campaignName: 'Social Retargeting',
        adSpendCents: 20000, // $200.00
        impressions: 2000,
        clicks: 150,
        leadsGenerated: 15,
        dealsClosed: 2,
        revenueGeneratedCents: 40000, // $400.00 -> ROAS 2.0x
      },
    });

    // 2. Query attribution report
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/reporting/attribution`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });

    assert.equal(res.statusCode, 200);
    const report = res.json().data;
    assert.equal(report.totalAdSpendCents, 30000); // $300.00
    assert.equal(report.totalRevenueCents, 90000); // $900.00
    assert.equal(report.blendedRoas, 3.0); // 900 / 300 = 3.0x
    assert.equal(report.blendedCacCents, 7500); // $75.00 CAC (300 / 4 deals)
    assert.equal(report.totalLeads, 25);
    assert.equal(report.totalDeals, 4);

    const google = report.channels.find((c: any) => c.channel === 'google_ads');
    assert.ok(google);
    assert.equal(google.roas, 5.0);

    const meta = report.channels.find((c: any) => c.channel === 'facebook_ads');
    assert.ok(meta);
    assert.equal(meta.roas, 2.0);
  });

  test('Sales leaderboard accurately aggregates won opportunities by sales rep', async () => {
    // 1. Create pipeline
    const pipeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/pipelines`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Sales Leaderboard Pipeline',
        stages: [{ name: 'Qualified' }, { name: 'Closed Won' }],
      },
    });
    const pipeline = pipeRes.json().data;
    const wonStageId = pipeline.stages[1].id;

    // 2. Create won opportunity
    const oppRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/opportunities`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        pipelineId: pipeline.id,
        stageId: wonStageId,
        contactId: contactAId,
        name: 'Enterprise Contract Deal',
        monetaryValue: 25000,
        status: 'won',
      },
    });
    assert.equal(oppRes.statusCode, 201);

    // 3. Query sales leaderboard
    const leaderRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/reporting/sales-leaderboard`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });

    assert.equal(leaderRes.statusCode, 200);
    const leaderboard = leaderRes.json().data;
    assert.ok(leaderboard.length >= 1);
    const topRep = leaderboard[0];
    assert.equal(topRep.dealsWon, 1);
    assert.equal(topRep.revenueWonCents, 2500000); // $25,000.00
  });

  test('Customer review management, inline response and review request dispatch', async () => {
    // 1. Submit review
    const review = memoryDb.submitPublicReview(locationAId, {
      authorName: 'Ford Prefect',
      rating: 5,
      source: 'google',
      reviewText: 'Exceptional service and speed to value.',
    });

    // 2. Reply to review
    const replyRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/reputation/reviews/${review.id}/reply`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        replyText: 'Thank you Ford! We appreciate your partnership.',
      },
    });

    assert.equal(replyRes.statusCode, 200);
    const updatedReview = replyRes.json().data;
    assert.equal(updatedReview.status, 'replied');
    assert.equal(updatedReview.responseReply, 'Thank you Ford! We appreciate your partnership.');
    assert.ok(updatedReview.respondedAt);

    // 3. Dispatch review request via SMS
    const reqRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/reputation/requests`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        contactId: contactAId,
        channel: 'sms',
        customMessage: 'How was your recent experience with us?',
      },
    });

    assert.equal(reqRes.statusCode, 201);
    const reviewReq = reqRes.json().data;
    assert.equal(reviewReq.channel, 'sms');
    assert.equal(reviewReq.status, 'sent');

    // 4. Verify contact timeline logged REVIEW_REQUESTED
    const contactRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts/${contactAId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(contactRes.statusCode, 200);
    const events = contactRes.json().data.timeline;
    const reviewEvent = events.find((e: any) => e.type === 'REVIEW_REQUESTED');
    assert.ok(reviewEvent);
  });

  test('Public review widget delivers rating breakdown and accepts visitor reviews', async () => {
    // 1. Public review submission
    const submitRes = await app.inject({
      method: 'POST',
      url: `/api/v1/public/locations/${locationAId}/reviews`,
      payload: {
        authorName: 'Trillian Astra',
        rating: 5,
        source: 'direct',
        reviewText: 'Superb workflow automation and customer care.',
      },
    });
    assert.equal(submitRes.statusCode, 201);

    // 2. Fetch public widget feed
    const feedRes = await app.inject({
      method: 'GET',
      url: `/api/v1/public/locations/${locationAId}/reviews`,
    });
    assert.equal(feedRes.statusCode, 200);
    const feed = feedRes.json().data;
    assert.ok(feed.totalReviews >= 1);
    assert.equal(feed.averageRating, 5.0);
  });

  test('Cross-tenant isolation: User B cannot access Location A reporting or reputation', async () => {
    // User B attempts to access Location A attribution
    const crossReport = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/reporting/attribution`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossReport.statusCode, 403);
    assert.equal(crossReport.json().error.code, 'FORBIDDEN');

    // User B attempts to view Location A reviews
    const crossReviews = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/reputation/reviews`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossReviews.statusCode, 403);
    assert.equal(crossReviews.json().error.code, 'FORBIDDEN');
  });
});
