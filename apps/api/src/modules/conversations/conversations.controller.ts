import { FastifyInstance } from 'fastify';
import { memoryDb } from '@prosumate/database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  startConversationSchema,
  sendMessageSchema,
  inboundWebhookSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';
import { emailProvider, smsProvider } from '../../providers';

export async function conversationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/conversations - List conversations
  fastify.get<{
    Params: { locationId: string };
    Querystring: { channel?: string; search?: string };
  }>(
    '/:locationId/conversations',
    { preHandler: [tenantGuard, requirePermissions('conversations:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const { channel, search } = request.query;

      const conversations = memoryDb.listConversations(locationId, {
        channel,
        search,
      });

      return sendSuccess(reply, conversations, 200, { total: conversations.length });
    }
  );

  // POST /api/v1/locations/:locationId/conversations - Start conversation
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/conversations',
    { preHandler: [tenantGuard, requirePermissions('conversations:send')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = memoryDb.findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = startConversationSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const { contactId, channel, subject, initialMessage } = parseResult.data;
      const contact = memoryDb.findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      const conversation = memoryDb.getOrCreateConversation({
        agencyId: location.agencyId,
        locationId,
        contactId,
        channel,
        subject,
      });

      // Dispatch through appropriate provider
      if (channel === 'email' && contact.email) {
        await emailProvider.sendEmail({
          to: contact.email,
          subject: subject || 'Message from Prosumate',
          text: initialMessage,
        });
      } else if (channel === 'sms' && contact.phone) {
        await smsProvider.sendSms({
          to: contact.phone,
          body: initialMessage,
        });
      }

      const message = memoryDb.sendMessage({
        conversationId: conversation.id,
        senderId: request.user!.userId,
        senderType: 'user',
        channel,
        direction: 'outbound',
        content: initialMessage,
        subject,
        status: 'delivered',
      });

      return sendSuccess(reply, { conversation, message }, 201);
    }
  );

  // GET /api/v1/locations/:locationId/conversations/:conversationId - Get conversation
  fastify.get<{ Params: { locationId: string; conversationId: string } }>(
    '/:locationId/conversations/:conversationId',
    { preHandler: [tenantGuard, requirePermissions('conversations:read')] },
    async (request, reply) => {
      const { locationId, conversationId } = request.params;
      const conversation = memoryDb.findConversationById(conversationId);
      if (!conversation || conversation.locationId !== locationId) {
        throw new NotFoundError(`Conversation '${conversationId}' not found in this location`);
      }

      return sendSuccess(reply, conversation, 200);
    }
  );

  // GET /api/v1/locations/:locationId/conversations/:conversationId/messages - List messages
  fastify.get<{ Params: { locationId: string; conversationId: string } }>(
    '/:locationId/conversations/:conversationId/messages',
    { preHandler: [tenantGuard, requirePermissions('conversations:read')] },
    async (request, reply) => {
      const { locationId, conversationId } = request.params;
      const conversation = memoryDb.findConversationById(conversationId);
      if (!conversation || conversation.locationId !== locationId) {
        throw new NotFoundError(`Conversation '${conversationId}' not found in this location`);
      }

      const messages = memoryDb.listMessages(conversationId);
      return sendSuccess(reply, messages, 200, { total: messages.length });
    }
  );

  // POST /api/v1/locations/:locationId/conversations/:conversationId/messages - Send message
  fastify.post<{ Params: { locationId: string; conversationId: string } }>(
    '/:locationId/conversations/:conversationId/messages',
    { preHandler: [tenantGuard, requirePermissions('conversations:send')] },
    async (request, reply) => {
      const { locationId, conversationId } = request.params;
      const conversation = memoryDb.findConversationById(conversationId);
      if (!conversation || conversation.locationId !== locationId) {
        throw new NotFoundError(`Conversation '${conversationId}' not found in this location`);
      }

      const parseResult = sendMessageSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const { content, channel, subject } = parseResult.data;
      const targetChannel = channel || conversation.channel;
      const targetSubject = subject || conversation.subject;

      // Dispatch through provider
      const contact = memoryDb.findContactById(conversation.contactId);
      if (targetChannel === 'email' && contact?.email) {
        await emailProvider.sendEmail({
          to: contact.email,
          subject: targetSubject || 'Message from Prosumate',
          text: content,
        });
      } else if (targetChannel === 'sms' && contact?.phone) {
        await smsProvider.sendSms({
          to: contact.phone,
          body: content,
        });
      }

      const message = memoryDb.sendMessage({
        conversationId,
        senderId: request.user!.userId,
        senderType: 'user',
        channel: targetChannel,
        direction: 'outbound',
        content,
        subject: targetSubject,
        status: 'delivered',
      });

      return sendSuccess(reply, message, 201);
    }
  );

  // POST /api/v1/locations/:locationId/conversations/:conversationId/read - Mark read
  fastify.post<{ Params: { locationId: string; conversationId: string } }>(
    '/:locationId/conversations/:conversationId/read',
    { preHandler: [tenantGuard, requirePermissions('conversations:read')] },
    async (request, reply) => {
      const { locationId, conversationId } = request.params;
      const conversation = memoryDb.findConversationById(conversationId);
      if (!conversation || conversation.locationId !== locationId) {
        throw new NotFoundError(`Conversation '${conversationId}' not found in this location`);
      }

      const updated = memoryDb.markConversationRead(conversationId);
      return sendSuccess(reply, updated, 200);
    }
  );
}

// Public conversation routes (inbound webhook receiver)
export async function publicConversationRoutes(fastify: FastifyInstance) {
  fastify.post('/conversations/inbound', async (request, reply) => {
    const parseResult = inboundWebhookSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten());
    }

    const { from, to, channel, content, subject } = parseResult.data;
    const result = memoryDb.receiveInboundMessage({
      from,
      to,
      channel,
      content,
      subject,
    });

    return sendSuccess(reply, { received: true, ...result }, 200);
  });
}
