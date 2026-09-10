import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import { updateAgencySchema } from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';
import { AuditAction, Agency } from '@prosumate/types';

export async function agencyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/agencies - List agencies for caller
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    if (user.isPlatformAdmin) {
      const allAgencies = db().listAgencies();
      return sendSuccess(reply, allAgencies, 200, { total: allAgencies.length });
    }

    const memberships = db().getUserAgencyMemberships(user.userId);
    const userAgencies = memberships
      .map((m) => db().findAgencyById(m.agencyId))
      .filter((a): a is Agency => a !== undefined);

    return sendSuccess(reply, userAgencies, 200, { total: userAgencies.length });
  });

  // GET /api/v1/agencies/:agencyId - Get specific agency details with tenant isolation
  fastify.get<{ Params: { agencyId: string } }>(
    '/:agencyId',
    { preHandler: [tenantGuard, requirePermissions('agency:read')] },
    async (request, reply) => {
      const { agencyId } = request.params;
      const agency = db().findAgencyById(agencyId);
      if (!agency) {
        throw new NotFoundError(`Agency with id '${agencyId}' not found`);
      }

      const locations = db().listLocationsByAgency(agencyId);
      return sendSuccess(reply, { ...agency, locations }, 200);
    }
  );

  // PATCH /api/v1/agencies/:agencyId - Update agency settings
  fastify.patch<{ Params: { agencyId: string } }>(
    '/:agencyId',
    { preHandler: [tenantGuard, requirePermissions('agency:update')] },
    async (request, reply) => {
      const { agencyId } = request.params;
      const parseResult = updateAgencySchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const agency = db().findAgencyById(agencyId);
      if (!agency) {
        throw new NotFoundError(`Agency with id '${agencyId}' not found`);
      }

      if (parseResult.data.name) agency.name = parseResult.data.name;
      if (parseResult.data.settings) agency.settings = { ...agency.settings, ...parseResult.data.settings };
      agency.updatedAt = new Date().toISOString();

      db().addAuditLog({
        agencyId,
        actorId: request.user!.userId,
        actorEmail: request.user!.email,
        action: AuditAction.AGENCY_UPDATED,
        entityType: 'agency',
        entityId: agencyId,
        metadata: parseResult.data,
      });

      return sendSuccess(reply, agency, 200);
    }
  );
}
