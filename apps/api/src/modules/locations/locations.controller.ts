import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { memoryDb } from '@prosumate/database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  createLocationSchema,
  updateLocationSchema,
  assignLocationUserSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';
import { AuditAction, LocationRole } from '@prosumate/types';

export async function locationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/agencies/:agencyId/locations - List locations for an agency
  fastify.get<{ Params: { agencyId: string } }>(
    '/agency/:agencyId',
    { preHandler: [tenantGuard, requirePermissions('location:read')] },
    async (request, reply) => {
      const { agencyId } = request.params;
      const user = request.user!;

      const allAgencyLocations = memoryDb.listLocationsByAgency(agencyId);

      // If user is Platform Admin or Agency Owner/Admin, return all locations
      if (user.isPlatformAdmin || user.agencyRole === 'OWNER' || user.agencyRole === 'ADMIN') {
        return sendSuccess(reply, allAgencyLocations, 200, { total: allAgencyLocations.length });
      }

      // Otherwise, filter strictly by user's assigned locations
      const userLocationMemberships = memoryDb.getUserLocationMemberships(user.userId);
      const allowedLocationIds = new Set(userLocationMemberships.map((m) => m.locationId));
      const filtered = allAgencyLocations.filter((l) => allowedLocationIds.has(l.id));

      return sendSuccess(reply, filtered, 200, { total: filtered.length });
    }
  );

  // POST /api/v1/agencies/:agencyId/locations - Provision a new location
  fastify.post<{ Params: { agencyId: string } }>(
    '/agency/:agencyId',
    { preHandler: [tenantGuard, requirePermissions('location:create')] },
    async (request, reply) => {
      const { agencyId } = request.params;
      const parseResult = createLocationSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const location = memoryDb.createLocation({
        agencyId,
        name: parseResult.data.name,
        timezone: parseResult.data.timezone,
        address: parseResult.data.address,
      });

      // Automatically assign creator as LOCATION_ADMIN
      memoryDb.createLocationMembership({
        userId: request.user!.userId,
        locationId: location.id,
        role: LocationRole.LOCATION_ADMIN,
      });

      memoryDb.addAuditLog({
        agencyId,
        locationId: location.id,
        actorId: request.user!.userId,
        actorEmail: request.user!.email,
        action: AuditAction.LOCATION_CREATED,
        entityType: 'location',
        entityId: location.id,
        metadata: parseResult.data,
      });

      return sendSuccess(reply, location, 201);
    }
  );

  // GET /api/v1/locations/:locationId - Get location details
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId',
    { preHandler: [tenantGuard, requirePermissions('location:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = memoryDb.findLocationById(locationId);
      if (!location) {
        throw new NotFoundError(`Location '${locationId}' not found`);
      }
      return sendSuccess(reply, location, 200);
    }
  );

  // PATCH /api/v1/locations/:locationId - Update location details
  fastify.patch<{ Params: { locationId: string } }>(
    '/:locationId',
    { preHandler: [tenantGuard, requirePermissions('location:update')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const parseResult = updateLocationSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const location = memoryDb.findLocationById(locationId);
      if (!location) {
        throw new NotFoundError(`Location '${locationId}' not found`);
      }

      if (parseResult.data.name) location.name = parseResult.data.name;
      if (parseResult.data.timezone) location.timezone = parseResult.data.timezone;
      if (parseResult.data.address) location.address = { ...location.address, ...parseResult.data.address };
      location.updatedAt = new Date().toISOString();

      memoryDb.addAuditLog({
        agencyId: location.agencyId,
        locationId,
        actorId: request.user!.userId,
        actorEmail: request.user!.email,
        action: AuditAction.LOCATION_UPDATED,
        entityType: 'location',
        entityId: locationId,
        metadata: parseResult.data,
      });

      return sendSuccess(reply, location, 200);
    }
  );

  // GET /api/v1/locations/:locationId/users - List users in this location
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/users',
    { preHandler: [tenantGuard, requirePermissions('users:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const members = memoryDb.getLocationMembers(locationId);
      return sendSuccess(reply, members, 200, { total: members.length });
    }
  );

  // POST /api/v1/locations/:locationId/users - Assign user to location
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/users',
    { preHandler: [tenantGuard, requirePermissions('users:invite')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const parseResult = assignLocationUserSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const location = memoryDb.findLocationById(locationId);
      if (!location) {
        throw new NotFoundError(`Location '${locationId}' not found`);
      }

      const userToAssign = memoryDb.findUserById(parseResult.data.userId);
      if (!userToAssign) {
        throw new NotFoundError(`User '${parseResult.data.userId}' not found`);
      }

      const membership = memoryDb.createLocationMembership({
        userId: userToAssign.id,
        locationId,
        role: parseResult.data.role,
      });

      memoryDb.addAuditLog({
        agencyId: location.agencyId,
        locationId,
        actorId: request.user!.userId,
        actorEmail: request.user!.email,
        action: AuditAction.USER_ROLE_CHANGED,
        entityType: 'membership',
        entityId: membership.id,
        metadata: { assignedUserId: userToAssign.id, role: parseResult.data.role },
      });

      return sendSuccess(reply, membership, 201);
    }
  );
}
