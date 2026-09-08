import { FastifyInstance } from 'fastify';
import { memoryDb } from '@prosumate/database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import { createFormSchema, submitFormSchema } from '@prosumate/validation';
import { ValidationError, NotFoundError, ConflictError } from '../../common/errors';

export async function formRoutes(fastify: FastifyInstance) {
  // ========================================
  // AUTHENTICATED ROUTES (Location-Scoped)
  // ========================================

  // GET /api/v1/locations/:locationId/forms - List forms
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/forms',
    { preHandler: [authGuard, tenantGuard, requirePermissions('forms:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const forms = memoryDb.listFormsByLocation(locationId);

      const enriched = forms.map((form) => ({
        ...form,
        submissionCount: memoryDb.getFormSubmissionCount(form.id),
      }));

      return sendSuccess(reply, enriched, 200, { total: enriched.length });
    }
  );

  // POST /api/v1/locations/:locationId/forms - Create form
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/forms',
    { preHandler: [authGuard, tenantGuard, requirePermissions('forms:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = memoryDb.findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = createFormSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      try {
        const form = memoryDb.createForm({
          agencyId: location.agencyId,
          locationId,
          name: parseResult.data.name,
          slug: parseResult.data.slug,
          fields: parseResult.data.fields,
          submitAction: parseResult.data.submitAction,
          thankYouMessage: parseResult.data.thankYouMessage,
          redirectUrl: parseResult.data.redirectUrl,
        });
        return sendSuccess(reply, form, 201);
      } catch (err: any) {
        if (err.message?.includes('already exists')) throw new ConflictError(err.message);
        throw err;
      }
    }
  );

  // GET /api/v1/locations/:locationId/forms/:formId - Form details
  fastify.get<{ Params: { locationId: string; formId: string } }>(
    '/:locationId/forms/:formId',
    { preHandler: [authGuard, tenantGuard, requirePermissions('forms:read')] },
    async (request, reply) => {
      const { locationId, formId } = request.params;
      const form = memoryDb.findFormById(formId);
      if (!form || form.locationId !== locationId) {
        throw new NotFoundError(`Form '${formId}' not found in this location`);
      }

      return sendSuccess(reply, {
        ...form,
        submissionCount: memoryDb.getFormSubmissionCount(formId),
      }, 200);
    }
  );

  // GET /api/v1/locations/:locationId/forms/:formId/submissions - List submissions
  fastify.get<{ Params: { locationId: string; formId: string } }>(
    '/:locationId/forms/:formId/submissions',
    { preHandler: [authGuard, tenantGuard, requirePermissions('forms:read')] },
    async (request, reply) => {
      const { locationId, formId } = request.params;
      const form = memoryDb.findFormById(formId);
      if (!form || form.locationId !== locationId) {
        throw new NotFoundError(`Form '${formId}' not found in this location`);
      }

      const submissions = memoryDb.getFormSubmissions(formId);

      // Enrich with contact info
      const enriched = submissions.map((sub) => {
        const contact = sub.contactId ? memoryDb.findContactById(sub.contactId) : null;
        return {
          ...sub,
          contactName: contact ? `${contact.firstName} ${contact.lastName}` : null,
          contactEmail: contact?.email || null,
        };
      });

      return sendSuccess(reply, enriched, 200, { total: enriched.length });
    }
  );
}

// ========================================
// PUBLIC FORM SUBMISSION (No Auth Required)
// ========================================
export async function publicFormRoutes(fastify: FastifyInstance) {
  // POST /api/v1/public/forms/:formSlug/submit - Public form submission
  fastify.post<{ Params: { formSlug: string } }>(
    '/forms/:formSlug/submit',
    async (request, reply) => {
      const { formSlug } = request.params;
      const form = memoryDb.findFormBySlug(formSlug);
      if (!form) {
        throw new NotFoundError(`Form '${formSlug}' not found or is inactive`);
      }

      const parseResult = submitFormSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const result = memoryDb.submitForm({
        formId: form.id,
        locationId: form.locationId,
        submissionData: parseResult.data.data,
        ipAddress: request.ip,
      });

      return sendSuccess(reply, {
        message: result.thankYouMessage,
        contactId: result.contactId,
        submissionId: result.submission.id,
      }, 201);
    }
  );
}
