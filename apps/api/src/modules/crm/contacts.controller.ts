import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../database';
import { sendSuccess, sendError } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  createContactSchema,
  updateContactSchema,
  addNoteSchema,
  createTaskSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError, ConflictError } from '../../common/errors';
import { AuditAction } from '@prosumate/types';

export async function contactRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/contacts - List & filter contacts
  fastify.get<{
    Params: { locationId: string };
    Querystring: { search?: string; status?: string; tag?: string; page?: string; limit?: string };
  }>(
    '/:locationId/contacts',
    { preHandler: [tenantGuard, requirePermissions('crm:contacts:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const { search, status, tag, page = '1', limit = '20' } = request.query;

      const allContacts = db().listContactsByLocation(locationId, { search, status, tag });
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = allContacts.slice(startIndex, startIndex + limitNum);

      // Populate company names
      const enriched = paginated.map((contact) => {
        const company = contact.companyId ? db().findCompanyById(contact.companyId) : undefined;
        return {
          ...contact,
          companyName: company?.name || null,
        };
      });

      return sendSuccess(reply, enriched, 200, {
        total: allContacts.length,
        page: pageNum,
        limit: limitNum,
      });
    }
  );

  // POST /api/v1/locations/:locationId/contacts - Create contact
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/contacts',
    { preHandler: [tenantGuard, requirePermissions('crm:contacts:create')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) {
        throw new NotFoundError(`Location '${locationId}' not found`);
      }

      const parseResult = createContactSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      try {
        const contact = db().createContact({
          agencyId: location.agencyId,
          locationId,
          firstName: parseResult.data.firstName,
          lastName: parseResult.data.lastName,
          email: parseResult.data.email,
          phone: parseResult.data.phone,
          companyId: parseResult.data.companyId,
          source: parseResult.data.source,
          ownerId: parseResult.data.ownerId || request.user!.userId,
          tags: parseResult.data.tags,
          customFields: parseResult.data.customFields,
          status: parseResult.data.status,
        });

        db().addAuditLog({
          agencyId: location.agencyId,
          locationId,
          actorId: request.user!.userId,
          actorEmail: request.user!.email,
          action: 'CONTACT_CREATED',
          entityType: 'contact',
          entityId: contact.id,
          metadata: { email: contact.email, name: `${contact.firstName} ${contact.lastName}` },
        });

        return sendSuccess(reply, contact, 201);
      } catch (err: any) {
        if (err.message && err.message.includes('Duplicate contact')) {
          throw new ConflictError(err.message);
        }
        throw err;
      }
    }
  );

  // GET /api/v1/locations/:locationId/contacts/:contactId - Contact details & timeline
  fastify.get<{ Params: { locationId: string; contactId: string } }>(
    '/:locationId/contacts/:contactId',
    { preHandler: [tenantGuard, requirePermissions('crm:contacts:read')] },
    async (request, reply) => {
      const { locationId, contactId } = request.params;
      const contact = db().findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      const notes = db().getContactNotes(contactId);
      const tasks = db().getContactTasks(contactId);
      const timeline = db().getContactActivityTimeline(contactId);
      const company = contact.companyId ? db().findCompanyById(contact.companyId) : null;

      return sendSuccess(reply, {
        ...contact,
        company,
        notes,
        tasks,
        timeline,
      }, 200);
    }
  );

  // PATCH /api/v1/locations/:locationId/contacts/:contactId - Update contact
  fastify.patch<{ Params: { locationId: string; contactId: string } }>(
    '/:locationId/contacts/:contactId',
    { preHandler: [tenantGuard, requirePermissions('crm:contacts:update')] },
    async (request, reply) => {
      const { locationId, contactId } = request.params;
      const contact = db().findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      const parseResult = updateContactSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const updated = db().updateContact(contactId, parseResult.data);
      return sendSuccess(reply, updated, 200);
    }
  );

  // DELETE /api/v1/locations/:locationId/contacts/:contactId - Delete contact
  fastify.delete<{ Params: { locationId: string; contactId: string } }>(
    '/:locationId/contacts/:contactId',
    { preHandler: [tenantGuard, requirePermissions('crm:contacts:delete')] },
    async (request, reply) => {
      const { locationId, contactId } = request.params;
      const contact = db().findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      db().deleteContact(contactId);
      db().addAuditLog({
        agencyId: contact.agencyId,
        locationId,
        actorId: request.user!.userId,
        actorEmail: request.user!.email,
        action: 'CONTACT_DELETED',
        entityType: 'contact',
        entityId: contactId,
      });

      return sendSuccess(reply, { message: 'Contact archived successfully' }, 200);
    }
  );

  // POST /api/v1/locations/:locationId/contacts/:contactId/notes - Add note
  fastify.post<{ Params: { locationId: string; contactId: string } }>(
    '/:locationId/contacts/:contactId/notes',
    { preHandler: [tenantGuard, requirePermissions('crm:contacts:update')] },
    async (request, reply) => {
      const { locationId, contactId } = request.params;
      const contact = db().findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      const parseResult = addNoteSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const note = db().addContactNote({
        contactId,
        authorId: request.user!.userId,
        authorEmail: request.user!.email,
        content: parseResult.data.content,
      });

      return sendSuccess(reply, note, 201);
    }
  );

  // POST /api/v1/locations/:locationId/contacts/:contactId/tasks - Add task
  fastify.post<{ Params: { locationId: string; contactId: string } }>(
    '/:locationId/contacts/:contactId/tasks',
    { preHandler: [tenantGuard, requirePermissions('crm:contacts:update')] },
    async (request, reply) => {
      const { locationId, contactId } = request.params;
      const contact = db().findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      const parseResult = createTaskSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const task = db().addContactTask({
        contactId,
        title: parseResult.data.title,
        description: parseResult.data.description,
        assignedUserId: parseResult.data.assignedUserId,
        dueDate: parseResult.data.dueDate,
      });

      return sendSuccess(reply, task, 201);
    }
  );
}
