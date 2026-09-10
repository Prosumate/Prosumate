import { FastifyInstance } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import { NotFoundError } from '../../common/errors';

export async function marketplaceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/marketplace/snapshots - Browse Snapshot catalogue
  fastify.get('/marketplace/snapshots', async (_request, reply) => {
    const snapshots = db().listSnapshots();
    return sendSuccess(reply, snapshots, 200, { total: snapshots.length });
  });

  // POST /api/v1/locations/:locationId/marketplace/install/:snapshotId - 1-Click Install
  fastify.post<{ Params: { locationId: string; snapshotId: string } }>(
    '/locations/:locationId/marketplace/install/:snapshotId',
    { preHandler: [tenantGuard, requirePermissions('marketplace:install')] },
    async (request, reply) => {
      const { locationId, snapshotId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const result = db().installSnapshot(locationId, snapshotId);
      return sendSuccess(reply, result, 201);
    }
  );
}
