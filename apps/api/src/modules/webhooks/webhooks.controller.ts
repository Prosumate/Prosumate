import { FastifyInstance } from 'fastify';
import { memoryDb } from '@prosumate/database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import { createWebhookSchema, updateWebhookSchema } from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';
import { sendWebhookHttp } from './webhooks.service';

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/webhooks - List webhooks
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/webhooks',
    { preHandler: [tenantGuard, requirePermissions('webhooks:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const webhooks = memoryDb.listWebhooks(locationId);

      return sendSuccess(reply, webhooks, 200, { total: webhooks.length });
    }
  );

  // POST /api/v1/locations/:locationId/webhooks - Create webhook
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/webhooks',
    { preHandler: [tenantGuard, requirePermissions('webhooks:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = memoryDb.findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = createWebhookSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const webhook = memoryDb.createWebhook(locationId, parseResult.data);
      return sendSuccess(reply, webhook, 201);
    }
  );

  // DELETE /api/v1/locations/:locationId/webhooks/:webhookId - Delete webhook
  fastify.delete<{ Params: { locationId: string; webhookId: string } }>(
    '/:locationId/webhooks/:webhookId',
    { preHandler: [tenantGuard, requirePermissions('webhooks:manage')] },
    async (request, reply) => {
      const { locationId, webhookId } = request.params;
      const deleted = memoryDb.deleteWebhook(locationId, webhookId);
      if (!deleted) throw new NotFoundError(`Webhook '${webhookId}' not found`);

      return sendSuccess(reply, { deleted: true, webhookId }, 200);
    }
  );

  // POST /api/v1/locations/:locationId/webhooks/:webhookId/test - Dispatch test event
  fastify.post<{ Params: { locationId: string; webhookId: string } }>(
    '/:locationId/webhooks/:webhookId/test',
    { preHandler: [tenantGuard, requirePermissions('webhooks:manage')] },
    async (request, reply) => {
      const { locationId, webhookId } = request.params;
      const webhook = memoryDb.findWebhookById(locationId, webhookId);
      if (!webhook) throw new NotFoundError(`Webhook '${webhookId}' not found`);

      const testPayload = {
        event: 'test.ping',
        timestamp: new Date().toISOString(),
        locationId,
        data: {
          test: true,
          message: 'Prosumate outbound webhook delivery test verified successfully.',
        },
      };

      // Dispatch genuine HTTP request if configured
      if (webhook.targetUrl && !webhook.targetUrl.includes('api.hubspot.com')) {
        await sendWebhookHttp(webhook.targetUrl, webhook.secretKey, 'test.ping', testPayload);
      }

      const log = memoryDb.dispatchWebhook(locationId, webhookId, 'test.ping', testPayload);
      return sendSuccess(reply, log, 200);
    }
  );
}
