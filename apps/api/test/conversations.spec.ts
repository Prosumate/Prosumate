import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Conversations & Unified Inbox Suite', () => {
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
        email: 'inbox-a@agency.com',
        password: 'Password123!',
        firstName: 'Inbox',
        lastName: 'Admin A',
        agencyName: 'Inbox Agency A',
        initialLocationName: 'Inbox Loc A',
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
        firstName: 'Michael',
        lastName: 'Scott',
        email: 'michael.scott@dundermifflin.com',
        phone: '+1-570-555-0123',
      },
    });
    contactAId = contactRes.json().data.id;

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'inbox-b@agency.com',
        password: 'Password123!',
        firstName: 'Inbox',
        lastName: 'Admin B',
        agencyName: 'Inbox Agency B',
        initialLocationName: 'Inbox Loc B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;
  });

  test('Starts email conversation, sends reply, and checks contact timeline', async () => {
    // 1. Start Email Conversation
    const startRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/conversations`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        contactId: contactAId,
        channel: 'email',
        subject: 'Paper Supply Contract Proposal',
        initialMessage: 'Dear Michael, attached is the revised multi-location contract.',
      },
    });

    assert.equal(startRes.statusCode, 201);
    const { conversation, message } = startRes.json().data;
    assert.equal(conversation.channel, 'email');
    assert.equal(conversation.subject, 'Paper Supply Contract Proposal');
    assert.equal(message.direction, 'outbound');
    assert.equal(message.status, 'delivered');

    // 2. Send follow-up outbound email in the thread
    const replyRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/conversations/${conversation.id}/messages`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        content: 'Following up on our earlier email regarding tiered pricing.',
      },
    });

    assert.equal(replyRes.statusCode, 201);
    assert.equal(replyRes.json().data.content, 'Following up on our earlier email regarding tiered pricing.');

    // 3. List messages in thread
    const msgsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/conversations/${conversation.id}/messages`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(msgsRes.statusCode, 200);
    assert.equal(msgsRes.json().data.length, 2);

    // 4. Verify Contact Timeline logged communication events
    const contactDetailRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts/${contactAId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(contactDetailRes.statusCode, 200);
    const timeline = contactDetailRes.json().data.timeline;
    const sentEvents = timeline.filter((e: any) => e.type === 'COMMUNICATION_SENT');
    assert.ok(sentEvents.length >= 2);
  });

  test('Handles SMS conversation, simulated inbound webhook, and read state', async () => {
    // 1. Start SMS thread
    const startRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/conversations`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        contactId: contactAId,
        channel: 'sms',
        initialMessage: 'Your quote is ready. Reply YES to review.',
      },
    });
    assert.equal(startRes.statusCode, 201);
    const convId = startRes.json().data.conversation.id;

    // 2. Simulate Inbound SMS webhook from contact's phone
    const inboundRes = await app.inject({
      method: 'POST',
      url: '/api/v1/public/conversations/inbound',
      payload: {
        from: '+1-570-555-0123',
        to: '+1-800-555-0199',
        channel: 'sms',
        content: 'YES, please send it over right away.',
      },
    });

    assert.equal(inboundRes.statusCode, 200);
    assert.ok(inboundRes.json().data.received);

    // 3. Verify conversation unread count is 1
    const getConvRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/conversations/${convId}`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(getConvRes.statusCode, 200);
    assert.equal(getConvRes.json().data.unreadCount, 1);
    assert.equal(getConvRes.json().data.lastMessageSnippet, 'YES, please send it over right away.');

    // 4. Mark conversation as read
    const readRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/conversations/${convId}/read`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(readRes.statusCode, 200);
    assert.equal(readRes.json().data.unreadCount, 0);
  });

  test('Cross-tenant isolation: User B cannot view or send messages on Location A conversations', async () => {
    const startRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/conversations`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        contactId: contactAId,
        channel: 'email',
        subject: 'Confidential Negotiations',
        initialMessage: 'Confidential agency communication.',
      },
    });
    const convId = startRes.json().data.conversation.id;

    // User B attempts to read Location A's conversations
    const crossList = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/conversations`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossList.statusCode, 403);
    assert.equal(crossList.json().error.code, 'FORBIDDEN');

    // User B attempts to send message to Location A's conversation
    const crossSend = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/conversations/${convId}/messages`,
      headers: { authorization: `Bearer ${tokenUserB}` },
      payload: { content: 'Malicious spoofed message' },
    });
    assert.equal(crossSend.statusCode, 403);
    assert.equal(crossSend.json().error.code, 'FORBIDDEN');
  });
});
