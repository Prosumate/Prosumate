import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError, NotFoundError } from '../errors';
import { memoryDb } from '@prosumate/database';
import { AuditAction, AgencyRole } from '@prosumate/types';

export async function tenantGuard(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    throw new ForbiddenError('Tenant validation requires authenticated session');
  }

  // Platform Admins can bypass tenant restrictions for support & management
  if (user.isPlatformAdmin) {
    return;
  }

  const params = request.params as Record<string, string>;
  const requestedAgencyId = params.agencyId;
  const requestedLocationId = params.locationId;

  // 1. Validate Agency Access if agencyId is in route parameters
  if (requestedAgencyId) {
    const agencyMembership = memoryDb.getAgencyMembership(user.userId, requestedAgencyId);
    if (!agencyMembership) {
      // Record cross-tenant access violation in audit log
      memoryDb.addAuditLog({
        agencyId: requestedAgencyId,
        actorId: user.userId,
        actorEmail: user.email,
        action: AuditAction.CROSS_TENANT_ACCESS_DENIED,
        entityType: 'agency',
        entityId: requestedAgencyId,
        metadata: {
          url: request.url,
          method: request.method,
          reason: 'User does not hold membership in the requested agency',
        },
        ipAddress: request.ip,
      });

      throw new ForbiddenError('Cross-tenant access prohibited: You do not belong to this agency');
    }
  }

  // 2. Validate Location Access if locationId is in route parameters
  if (requestedLocationId) {
    const location = memoryDb.findLocationById(requestedLocationId);
    if (!location || location.status === 'archived') {
      throw new NotFoundError('Location not found or archived');
    }

    // Check if user is an Agency Owner or Admin for this location's parent agency
    const agencyMembership = memoryDb.getAgencyMembership(user.userId, location.agencyId);
    const isAgencyAuthority =
      agencyMembership &&
      (agencyMembership.role === AgencyRole.OWNER || agencyMembership.role === AgencyRole.ADMIN);

    // Check direct location membership
    const locationMembership = memoryDb.getLocationMembership(user.userId, requestedLocationId);

    if (!isAgencyAuthority && !locationMembership) {
      // Record cross-tenant access violation in audit log
      memoryDb.addAuditLog({
        agencyId: location.agencyId,
        locationId: requestedLocationId,
        actorId: user.userId,
        actorEmail: user.email,
        action: AuditAction.CROSS_TENANT_ACCESS_DENIED,
        entityType: 'location',
        entityId: requestedLocationId,
        metadata: {
          url: request.url,
          method: request.method,
          reason: 'User lacks authority over target location',
        },
        ipAddress: request.ip,
      });

      throw new ForbiddenError('Cross-tenant access prohibited: You do not have access to this location');
    }
  }
}
