import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '../errors';
import { Permission, AuditAction } from '@prosumate/types';
import { db } from '../../database';

export function requirePermissions(...requiredPermissions: Permission[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      throw new ForbiddenError('Permission check requires authenticated session');
    }

    if (user.isPlatformAdmin) {
      return; // Platform admins hold superuser privileges
    }

    const hasAll = requiredPermissions.every((perm) => user.permissions.includes(perm));
    if (!hasAll) {
      db().addAuditLog({
        agencyId: user.activeAgencyId,
        locationId: user.activeLocationId,
        actorId: user.userId,
        actorEmail: user.email,
        action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        entityType: 'permission',
        entityId: requiredPermissions.join(','),
        metadata: {
          url: request.url,
          missingPermissions: requiredPermissions.filter((p) => !user.permissions.includes(p)),
        },
        ipAddress: request.ip,
      });

      throw new ForbiddenError(
        `Insufficient privileges: Missing required permission(s) [${requiredPermissions.join(', ')}]`
      );
    }
  };
}
