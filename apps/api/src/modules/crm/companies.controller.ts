import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import { createCompanySchema } from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';

export async function companyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/companies - List companies
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/companies',
    { preHandler: [tenantGuard, requirePermissions('crm:companies:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const companies = db().listCompaniesByLocation(locationId);
      return sendSuccess(reply, companies, 200, { total: companies.length });
    }
  );

  // POST /api/v1/locations/:locationId/companies - Create company
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/companies',
    { preHandler: [tenantGuard, requirePermissions('crm:companies:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) {
        throw new NotFoundError(`Location '${locationId}' not found`);
      }

      const parseResult = createCompanySchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const company = db().createCompany({
        agencyId: location.agencyId,
        locationId,
        name: parseResult.data.name,
        domain: parseResult.data.domain,
        phone: parseResult.data.phone,
        industry: parseResult.data.industry,
        address: parseResult.data.address,
      });

      return sendSuccess(reply, company, 201);
    }
  );

  // GET /api/v1/locations/:locationId/companies/:companyId - Company details with associated contacts
  fastify.get<{ Params: { locationId: string; companyId: string } }>(
    '/:locationId/companies/:companyId',
    { preHandler: [tenantGuard, requirePermissions('crm:companies:read')] },
    async (request, reply) => {
      const { locationId, companyId } = request.params;
      const company = db().findCompanyById(companyId);
      if (!company || company.locationId !== locationId) {
        throw new NotFoundError(`Company '${companyId}' not found in this location`);
      }

      // Associated contacts
      const allContacts = db().listContactsByLocation(locationId);
      const associatedContacts = allContacts.filter((c) => c.companyId === companyId);

      return sendSuccess(reply, {
        ...company,
        contacts: associatedContacts,
      }, 200);
    }
  );
}
