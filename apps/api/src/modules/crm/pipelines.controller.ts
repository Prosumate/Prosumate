import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  createPipelineSchema,
  createOpportunitySchema,
  moveOpportunityStageSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';

export async function pipelineRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/pipelines - List pipelines with stages
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/pipelines',
    { preHandler: [tenantGuard, requirePermissions('crm:pipelines:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const pipelines = db().listPipelinesByLocation(locationId);
      return sendSuccess(reply, pipelines, 200, { total: pipelines.length });
    }
  );

  // POST /api/v1/locations/:locationId/pipelines - Create pipeline with stages
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/pipelines',
    { preHandler: [tenantGuard, requirePermissions('crm:pipelines:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) {
        throw new NotFoundError(`Location '${locationId}' not found`);
      }

      const parseResult = createPipelineSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const pipeline = db().createPipeline({
        agencyId: location.agencyId,
        locationId,
        name: parseResult.data.name,
        stages: parseResult.data.stages,
      });

      return sendSuccess(reply, pipeline, 201);
    }
  );

  // GET /api/v1/locations/:locationId/pipelines/:pipelineId/board - Kanban Board Aggregation
  fastify.get<{ Params: { locationId: string; pipelineId: string } }>(
    '/:locationId/pipelines/:pipelineId/board',
    { preHandler: [tenantGuard, requirePermissions('crm:pipelines:read')] },
    async (request, reply) => {
      const { locationId, pipelineId } = request.params;
      const pipeline = db().findPipelineById(pipelineId);
      if (!pipeline || pipeline.locationId !== locationId) {
        throw new NotFoundError(`Pipeline '${pipelineId}' not found in this location`);
      }

      const allOpportunities = db().listOpportunitiesByPipeline(pipelineId);

      let pipelineTotalValue = 0;

      // Group opportunities into their respective stages
      const boardStages = pipeline.stages.map((stage: any) => {
        const stageOpps = allOpportunities
          .filter((o) => o.stageId === stage.id)
          .map((opp) => {
            const contact = db().findContactById(opp.contactId);
            const company = opp.companyId ? db().findCompanyById(opp.companyId) : undefined;
            return {
              ...opp,
              contactName: contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact',
              contactEmail: contact?.email || null,
              companyName: company?.name || null,
            };
          });

        const stageTotal = stageOpps.reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
        pipelineTotalValue += stageTotal;

        return {
          ...stage,
          opportunities: stageOpps,
          totalValue: stageTotal,
          opportunityCount: stageOpps.length,
        };
      });

      return sendSuccess(
        reply,
        {
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          stages: boardStages,
          pipelineTotalValue,
        },
        200
      );
    }
  );

  // POST /api/v1/locations/:locationId/opportunities - Create opportunity
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/opportunities',
    { preHandler: [tenantGuard, requirePermissions('crm:pipelines:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) {
        throw new NotFoundError(`Location '${locationId}' not found`);
      }

      const parseResult = createOpportunitySchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const contact = db().findContactById(parseResult.data.contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${parseResult.data.contactId}' not found in this location`);
      }

      const opportunity = db().createOpportunity({
        agencyId: location.agencyId,
        locationId,
        pipelineId: parseResult.data.pipelineId,
        stageId: parseResult.data.stageId,
        contactId: parseResult.data.contactId,
        companyId: parseResult.data.companyId,
        name: parseResult.data.name,
        monetaryValue: parseResult.data.monetaryValue,
        currency: parseResult.data.currency,
        status: parseResult.data.status,
        ownerId: parseResult.data.ownerId || request.user!.userId,
        expectedCloseDate: parseResult.data.expectedCloseDate,
      });

      return sendSuccess(reply, opportunity, 201);
    }
  );

  // PATCH /api/v1/locations/:locationId/opportunities/:opportunityId/stage - Move stage
  fastify.patch<{ Params: { locationId: string; opportunityId: string } }>(
    '/:locationId/opportunities/:opportunityId/stage',
    { preHandler: [tenantGuard, requirePermissions('crm:pipelines:manage')] },
    async (request, reply) => {
      const { locationId, opportunityId } = request.params;
      const opp = db().findOpportunityById(opportunityId);
      if (!opp || opp.locationId !== locationId) {
        throw new NotFoundError(`Opportunity '${opportunityId}' not found in this location`);
      }

      const parseResult = moveOpportunityStageSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const updated = db().moveOpportunityStage(
        opportunityId,
        parseResult.data.stageId,
        request.user!.userId,
        parseResult.data.status
      );

      return sendSuccess(reply, updated, 200);
    }
  );
}
