import { FastifyInstance } from 'fastify';
import { memoryDb } from '@prosumate/database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  createFunnelSchema,
  updateFunnelSchema,
  recordFunnelEventSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';

export async function funnelRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/funnels - List funnels
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/funnels',
    { preHandler: [tenantGuard, requirePermissions('funnels:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const funnels = memoryDb.listFunnelsByLocation(locationId);

      return sendSuccess(reply, funnels, 200, { total: funnels.length });
    }
  );

  // POST /api/v1/locations/:locationId/funnels - Create funnel
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/funnels',
    { preHandler: [tenantGuard, requirePermissions('funnels:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = memoryDb.findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = createFunnelSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const funnel = memoryDb.createFunnel({
        agencyId: location.agencyId,
        locationId,
        name: parseResult.data.name,
        slug: parseResult.data.slug,
        description: parseResult.data.description,
        published: parseResult.data.published,
        steps: parseResult.data.steps,
      });

      return sendSuccess(reply, funnel, 201);
    }
  );

  // GET /api/v1/locations/:locationId/funnels/:funnelId - Get funnel details
  fastify.get<{ Params: { locationId: string; funnelId: string } }>(
    '/:locationId/funnels/:funnelId',
    { preHandler: [tenantGuard, requirePermissions('funnels:read')] },
    async (request, reply) => {
      const { locationId, funnelId } = request.params;
      const funnel = memoryDb.findFunnelById(funnelId);
      if (!funnel || funnel.locationId !== locationId) {
        throw new NotFoundError(`Funnel '${funnelId}' not found in this location`);
      }

      return sendSuccess(reply, funnel, 200);
    }
  );

  // PATCH /api/v1/locations/:locationId/funnels/:funnelId - Update funnel
  fastify.patch<{ Params: { locationId: string; funnelId: string } }>(
    '/:locationId/funnels/:funnelId',
    { preHandler: [tenantGuard, requirePermissions('funnels:manage')] },
    async (request, reply) => {
      const { locationId, funnelId } = request.params;
      const funnel = memoryDb.findFunnelById(funnelId);
      if (!funnel || funnel.locationId !== locationId) {
        throw new NotFoundError(`Funnel '${funnelId}' not found in this location`);
      }

      const parseResult = updateFunnelSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const updated = memoryDb.updateFunnel(funnelId, parseResult.data);

      return sendSuccess(reply, updated, 200);
    }
  );

  // DELETE /api/v1/locations/:locationId/funnels/:funnelId - Delete funnel
  fastify.delete<{ Params: { locationId: string; funnelId: string } }>(
    '/:locationId/funnels/:funnelId',
    { preHandler: [tenantGuard, requirePermissions('funnels:manage')] },
    async (request, reply) => {
      const { locationId, funnelId } = request.params;
      const funnel = memoryDb.findFunnelById(funnelId);
      if (!funnel || funnel.locationId !== locationId) {
        throw new NotFoundError(`Funnel '${funnelId}' not found in this location`);
      }

      memoryDb.deleteFunnel(funnelId);

      return sendSuccess(reply, { deleted: true, id: funnelId }, 200);
    }
  );
}

export async function publicFunnelRoutes(fastify: FastifyInstance) {
  // GET /api/v1/public/funnels/:slug - Public Funnel Definition with embedded forms
  fastify.get<{ Params: { slug: string } }>(
    '/funnels/:slug',
    async (request, reply) => {
      const { slug } = request.params;
      const funnel = memoryDb.findPublicFunnelBySlug(slug);
      if (!funnel) {
        throw new NotFoundError(`Published funnel '${slug}' not found`);
      }

      // Enrich form_embed blocks with full form schema if present
      const enrichedSteps = funnel.steps.map((step: any) => {
        const enrichedBlocks = step.blocks.map((block: any) => {
          if (block.type === 'form_embed' && block.settings?.formId) {
            const form = memoryDb.findFormById(block.settings.formId);
            return {
              ...block,
              embeddedForm: form
                ? {
                    id: form.id,
                    name: form.name,
                    slug: form.slug,
                    fields: form.fields,
                    submitButtonText: form.submitButtonText,
                    thankYouMessage: form.thankYouMessage,
                  }
                : null,
            };
          }
          return block;
        });

        return { ...step, blocks: enrichedBlocks };
      });

      return sendSuccess(reply, {
        ...funnel,
        steps: enrichedSteps,
      }, 200);
    }
  );

  // POST /api/v1/public/funnels/:slug/events - Record view or conversion event
  fastify.post<{ Params: { slug: string } }>(
    '/funnels/:slug/events',
    async (request, reply) => {
      const { slug } = request.params;
      const funnel = memoryDb.findPublicFunnelBySlug(slug);
      if (!funnel) {
        throw new NotFoundError(`Published funnel '${slug}' not found`);
      }

      const parseResult = recordFunnelEventSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const { stepSlug, type } = parseResult.data;
      const result = memoryDb.recordFunnelEvent(funnel.id, stepSlug, type);

      return sendSuccess(reply, result, 200);
    }
  );
}
