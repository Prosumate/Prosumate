import { FastifyInstance } from 'fastify';
import { memoryDb } from '@prosumate/database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import { updateSsoConfigSchema } from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';

export async function enterpriseRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/sso - Get SSO configuration
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/sso',
    { preHandler: [tenantGuard, requirePermissions('sso:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const sso = memoryDb.getSsoConfig(locationId);

      return sendSuccess(reply, sso, 200);
    }
  );

  // PATCH /api/v1/locations/:locationId/sso - Update SSO configuration
  fastify.patch<{ Params: { locationId: string } }>(
    '/:locationId/sso',
    { preHandler: [tenantGuard, requirePermissions('sso:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = memoryDb.findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = updateSsoConfigSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const updated = memoryDb.updateSsoConfig(locationId, parseResult.data);
      return sendSuccess(reply, updated, 200);
    }
  );

  // GET /api/v1/locations/:locationId/audit-logs/export - Export compliance audit logs
  fastify.get<{ Params: { locationId: string }; Querystring: { format?: 'csv' | 'json' } }>(
    '/:locationId/audit-logs/export',
    { preHandler: [tenantGuard, requirePermissions('audit:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const format = request.query.format === 'json' ? 'json' : 'csv';

      const exported = memoryDb.exportAuditLogs(locationId, format);

      if (format === 'csv') {
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="audit-logs-${locationId}.csv"`);
        return reply.send(exported);
      } else {
        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="audit-logs-${locationId}.json"`);
        return reply.send(exported);
      }
    }
  );
}
