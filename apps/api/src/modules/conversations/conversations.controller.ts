import { FastifyInstance } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  startConversationSchema,
  sendMessageSchema,
  inboundWebhookSchema,
} from '@prosumate/validation';
import { AppError, ValidationError, NotFoundError, UnauthorizedError } from '../../common/errors';
import { emailProvider, smsProvider, InternalEmailProvider, InternalSmsProvider } from '../../providers';
import { config } from '../../config';

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

      const conversations = db().listConversations(locationId, {
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
      const location = db().findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = startConversationSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const { contactId, channel, subject, initialMessage } = parseResult.data;
      const contact = db().findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      const conversation = db().getOrCreateConversation({
        agencyId: location.agencyId,
        locationId,
        contactId,
        channel,
        subject,
      });

      // Dispatch through the configured provider and persist the provider's
      // actual outcome instead of claiming delivery unconditionally.
      let providerResult;
      if (channel === 'email' && contact.email) {
        providerResult = await emailProvider.sendEmail({
          to: contact.email,
          subject: subject || 'Message from Prosumate',
          text: initialMessage,
          locationId,
          mergeData: { contact, location },
          metadata: { conversationId: conversation.id, contactId: contact.id },
        });
      } else if (channel === 'sms' && contact.phone) {
        providerResult = await smsProvider.sendSms({
          to: contact.phone,
          body: initialMessage,
          locationId,
          metadata: { conversationId: conversation.id, contactId: contact.id },
        });
      } else {
        throw new ValidationError(`Contact has no ${channel} destination`);
      }
      if (!providerResult.success) {
        throw new AppError(providerResult.error || 'Message could not be accepted by the internal provider', 422, 'MESSAGE_REJECTED');
      }

      const message = db().sendMessage({
        conversationId: conversation.id,
        senderId: request.user!.userId,
        senderType: 'user',
        channel,
        direction: 'outbound',
        content: initialMessage,
        subject,
        status: providerResult.status,
        metadata: {
          provider: providerResult.provider,
          providerMessageId: providerResult.messageId,
          deliveryScope: providerResult.deliveryScope,
        },
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
      const conversation = db().findConversationById(conversationId);
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
      const conversation = db().findConversationById(conversationId);
      if (!conversation || conversation.locationId !== locationId) {
        throw new NotFoundError(`Conversation '${conversationId}' not found in this location`);
      }

      const messages = db().listMessages(conversationId);
      return sendSuccess(reply, messages, 200, { total: messages.length });
    }
  );

  // POST /api/v1/locations/:locationId/conversations/:conversationId/messages - Send message
  fastify.post<{ Params: { locationId: string; conversationId: string } }>(
    '/:locationId/conversations/:conversationId/messages',
    { preHandler: [tenantGuard, requirePermissions('conversations:send')] },
    async (request, reply) => {
      const { locationId, conversationId } = request.params;
      const conversation = db().findConversationById(conversationId);
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

      // Dispatch through provider and retain its real local/external status.
      const contact = db().findContactById(conversation.contactId);
      let providerResult;
      if (targetChannel === 'email' && contact?.email) {
        providerResult = await emailProvider.sendEmail({
          to: contact.email,
          subject: targetSubject || 'Message from Prosumate',
          text: content,
          locationId,
          mergeData: { contact, location: db().findLocationById(locationId) || {} },
          metadata: { conversationId, contactId: contact.id },
        });
      } else if (targetChannel === 'sms' && contact?.phone) {
        providerResult = await smsProvider.sendSms({
          to: contact.phone,
          body: content,
          locationId,
          metadata: { conversationId, contactId: contact.id },
        });
      } else {
        throw new ValidationError(`Contact has no ${targetChannel} destination`);
      }
      if (!providerResult.success) {
        throw new AppError(providerResult.error || 'Message could not be accepted by the internal provider', 422, 'MESSAGE_REJECTED');
      }

      const message = db().sendMessage({
        conversationId,
        senderId: request.user!.userId,
        senderType: 'user',
        channel: targetChannel,
        direction: 'outbound',
        content,
        subject: targetSubject,
        status: providerResult.status,
        metadata: {
          provider: providerResult.provider,
          providerMessageId: providerResult.messageId,
          deliveryScope: providerResult.deliveryScope,
        },
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
      const conversation = db().findConversationById(conversationId);
      if (!conversation || conversation.locationId !== locationId) {
        throw new NotFoundError(`Conversation '${conversationId}' not found in this location`);
      }

      const updated = db().markConversationRead(conversationId);
      return sendSuccess(reply, updated, 200);
    }
  );
}

// Public conversation routes (inbound webhook receiver)
export async function publicConversationRoutes(fastify: FastifyInstance) {
  fastify.post('/conversations/inbound', async (request, reply) => {
    if (!config.isTestEnvironment) {
      const suppliedSecret = request.headers['x-internal-inbound-secret'];
      if (!config.internalInboundSecret || suppliedSecret !== config.internalInboundSecret) {
        throw new UnauthorizedError('A valid internal inbound secret is required');
      }
    }
    const parseResult = inboundWebhookSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten());
    }

    const { from, to, channel, content, subject } = parseResult.data;
    if (channel === 'sms' && smsProvider instanceof InternalSmsProvider) {
      smsProvider.receiveInboundSms(from, content, to);
    } else if (channel === 'email' && emailProvider instanceof InternalEmailProvider) {
      emailProvider.receiveInboundEmail({ from, to, subject, text: content });
    }
    const result = db().receiveInboundMessage({
      from,
      to,
      channel,
      content,
      subject,
    });

    return sendSuccess(reply, { received: true, ...result }, 200);
  });
}
