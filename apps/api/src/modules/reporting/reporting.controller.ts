import { FastifyInstance } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import { createCampaignMetricSchema } from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';

export async function reportingRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/reporting/attribution - Multi-channel Attribution & ROAS
  fastify.get<{
    Params: { locationId: string };
    Querystring: { model?: string };
  }>(
    '/:locationId/reporting/attribution',
    { preHandler: [tenantGuard, requirePermissions('reports:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const { model = 'last_touch' } = request.query;

      const report = db().getAttributionReport(locationId, model);

      return sendSuccess(reply, report, 200);
    }
  );

  // GET /api/v1/locations/:locationId/reporting/sales-leaderboard - Sales Rep Performance
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/reporting/sales-leaderboard',
    { preHandler: [tenantGuard, requirePermissions('reports:read')] },
    async (request, reply) => {
      const { locationId } = request.params;

      const leaderboard = db().getSalesLeaderboard(locationId);

      return sendSuccess(reply, leaderboard, 200, { total: leaderboard.length });
    }
  );

  // POST /api/v1/locations/:locationId/reporting/campaigns - Record campaign performance metric
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/reporting/campaigns',
    { preHandler: [tenantGuard, requirePermissions('reports:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = createCampaignMetricSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const metric = db().addCampaignMetric(locationId, {
        agencyId: location.agencyId,
        ...parseResult.data,
      });

      return sendSuccess(reply, metric, 201);
    }
  );
}
