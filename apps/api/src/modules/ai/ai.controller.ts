import { FastifyInstance } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  generateAiTextSchema,
  updateAiConfigSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';
import { aiProvider } from '../../providers';

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/ai/config - Get AI persona & rules
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/ai/config',
    { preHandler: [tenantGuard, requirePermissions('ai:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const config = db().getAiConfig(locationId);

      return sendSuccess(reply, config, 200);
    }
  );

  // PATCH /api/v1/locations/:locationId/ai/config - Update AI persona
  fastify.patch<{ Params: { locationId: string } }>(
    '/:locationId/ai/config',
    { preHandler: [tenantGuard, requirePermissions('ai:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;

      const parseResult = updateAiConfigSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const updated = db().updateAiConfig(locationId, parseResult.data);

      return sendSuccess(reply, updated, 200);
    }
  );

  // POST /api/v1/locations/:locationId/ai/generate - Generate text, reply, or qualify lead
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/ai/generate',
    { preHandler: [tenantGuard, requirePermissions('ai:generate')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = generateAiTextSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const requestData = {
        task: parseResult.data.task,
        prompt: parseResult.data.prompt,
        tone: parseResult.data.tone,
        contactId: parseResult.data.contactId,
        channel: parseResult.data.channel,
        context: parseResult.data.context,
      };

      // Generate once through the selected provider, then persist that exact
      // result. This prevents a second, conflicting mock generation.
      const providerResult = await aiProvider.generateTask(requestData);
      const result = db().recordAiProviderGeneration(locationId, requestData, providerResult);

      return sendSuccess(reply, result, 201);
    }
  );

  // GET /api/v1/locations/:locationId/ai/history - List recent AI generations
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/ai/history',
    { preHandler: [tenantGuard, requirePermissions('ai:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const history = db().listAiGenerations(locationId);

      return sendSuccess(reply, history, 200, { total: history.length });
    }
  );
}
