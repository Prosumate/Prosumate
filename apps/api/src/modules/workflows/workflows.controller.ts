import { FastifyInstance } from 'fastify';
import { memoryDb } from '@prosumate/database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  testRunWorkflowSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';

export async function workflowRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/workflows - List workflows
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/workflows',
    { preHandler: [tenantGuard, requirePermissions('workflows:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const workflows = memoryDb.listWorkflowsByLocation(locationId);

      return sendSuccess(reply, workflows, 200, { total: workflows.length });
    }
  );

  // POST /api/v1/locations/:locationId/workflows - Create workflow
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/workflows',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = memoryDb.findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = createWorkflowSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const workflow = memoryDb.createWorkflow({
        agencyId: location.agencyId,
        locationId,
        name: parseResult.data.name,
        description: parseResult.data.description,
        status: parseResult.data.status,
        trigger: parseResult.data.trigger,
        steps: parseResult.data.steps,
      });

      return sendSuccess(reply, workflow, 201);
    }
  );

  // GET /api/v1/locations/:locationId/workflows/:workflowId - Get workflow
  fastify.get<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId',
    { preHandler: [tenantGuard, requirePermissions('workflows:read')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      const workflow = memoryDb.findWorkflowById(workflowId);
      if (!workflow || workflow.locationId !== locationId) {
        throw new NotFoundError(`Workflow '${workflowId}' not found in this location`);
      }

      return sendSuccess(reply, workflow, 200);
    }
  );

  // PATCH /api/v1/locations/:locationId/workflows/:workflowId - Update workflow
  fastify.patch<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      const workflow = memoryDb.findWorkflowById(workflowId);
      if (!workflow || workflow.locationId !== locationId) {
        throw new NotFoundError(`Workflow '${workflowId}' not found in this location`);
      }

      const parseResult = updateWorkflowSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const updated = memoryDb.updateWorkflow(workflowId, parseResult.data);
      return sendSuccess(reply, updated, 200);
    }
  );

  // DELETE /api/v1/locations/:locationId/workflows/:workflowId - Delete workflow
  fastify.delete<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      const workflow = memoryDb.findWorkflowById(workflowId);
      if (!workflow || workflow.locationId !== locationId) {
        throw new NotFoundError(`Workflow '${workflowId}' not found in this location`);
      }

      memoryDb.deleteWorkflow(workflowId);
      return sendSuccess(reply, { deleted: true, id: workflowId }, 200);
    }
  );

  // POST /api/v1/locations/:locationId/workflows/:workflowId/test - Manual test run
  fastify.post<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId/test',
    { preHandler: [tenantGuard, requirePermissions('workflows:execute')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      const workflow = memoryDb.findWorkflowById(workflowId);
      if (!workflow || workflow.locationId !== locationId) {
        throw new NotFoundError(`Workflow '${workflowId}' not found in this location`);
      }

      const parseResult = testRunWorkflowSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const { contactId, triggerData } = parseResult.data;
      const contact = memoryDb.findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      const execution = memoryDb.executeWorkflow(workflowId, {
        contactId,
        triggerData,
      });

      return sendSuccess(reply, execution, 200);
    }
  );

  // GET /api/v1/locations/:locationId/workflows/:workflowId/executions - List execution logs
  fastify.get<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId/executions',
    { preHandler: [tenantGuard, requirePermissions('workflows:read')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      const workflow = memoryDb.findWorkflowById(workflowId);
      if (!workflow || workflow.locationId !== locationId) {
        throw new NotFoundError(`Workflow '${workflowId}' not found in this location`);
      }

      const executions = memoryDb.listWorkflowExecutions(workflowId);
      return sendSuccess(reply, executions, 200, { total: executions.length });
    }
  );
}
