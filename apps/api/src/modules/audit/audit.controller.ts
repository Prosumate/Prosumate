import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermissions } from '../../common/guards/permission.guard';

export async function auditRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/audit-logs - Query immutable audit logs
  fastify.get<{ Querystring: { agencyId?: string; locationId?: string } }>(
    '/',
    { preHandler: [requirePermissions('audit:read')] },
    async (request, reply) => {
      const user = request.user!;
      const query = request.query;

      // Platform admins can query any agency/location logs
      if (user.isPlatformAdmin) {
        const logs = db().getAuditLogs({
          agencyId: query.agencyId,
          locationId: query.locationId,
        });
        return sendSuccess(reply, logs, 200, { total: logs.length });
      }

      // Non-platform users are strictly scoped to their active agency
      const agencyId = user.activeAgencyId;
      const logs = db().getAuditLogs({
        agencyId,
        locationId: query.locationId,
      });

      return sendSuccess(reply, logs, 200, { total: logs.length });
    }
  );
}
