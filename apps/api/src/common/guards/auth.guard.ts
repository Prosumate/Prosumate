import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { UnauthorizedError } from '../errors';
import { memoryDb } from '@prosumate/database';
import { TenantContext, ROLE_PERMISSIONS, AgencyRole, LocationRole } from '@prosumate/types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TenantContext;
  }
}

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new UnauthorizedError('Malformed authorization header');
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      sub: string;
      email: string;
      isPlatformAdmin: boolean;
      agencyId?: string;
      locationId?: string;
    };

    const user = memoryDb.findUserById(payload.sub);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User account not found or suspended');
    }

    // Resolve tenant memberships
    const agencyMemberships = memoryDb.getUserAgencyMemberships(user.id);
    const locationMemberships = memoryDb.getUserLocationMemberships(user.id);

    // Determine active agency role
    const activeAgencyId = payload.agencyId || agencyMemberships[0]?.agencyId;
    const agencyMembership = activeAgencyId
      ? agencyMemberships.find((m) => m.agencyId === activeAgencyId)
      : undefined;
    const agencyRole = agencyMembership?.role;

    // Determine active location role
    const activeLocationId = payload.locationId || locationMemberships[0]?.locationId;
    const locationMembership = activeLocationId
      ? locationMemberships.find((m) => m.locationId === activeLocationId)
      : undefined;
    const locationRole = locationMembership?.role;

    // Aggregate permissions
    const permissions = new Set<string>();
    if (user.isPlatformAdmin) {
      permissions.add('platform:manage');
      permissions.add('platform:audit:read');
    }

    if (agencyRole && ROLE_PERMISSIONS[agencyRole as AgencyRole]) {
      ROLE_PERMISSIONS[agencyRole as AgencyRole].forEach((p) => permissions.add(p));
    }

    if (locationRole && ROLE_PERMISSIONS[locationRole as LocationRole]) {
      ROLE_PERMISSIONS[locationRole as LocationRole].forEach((p) => permissions.add(p));
    }

    if (locationMembership?.permissionsOverride) {
      locationMembership.permissionsOverride.forEach((p) => permissions.add(p));
    }

    request.user = {
      userId: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      activeAgencyId,
      activeLocationId,
      agencyRole: agencyRole as AgencyRole | undefined,
      locationRole: locationRole as LocationRole | undefined,
      permissions: Array.from(permissions) as any,
    };
  } catch (err: any) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}
