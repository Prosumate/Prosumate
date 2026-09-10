import { FastifyInstance } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  testRunWorkflowSchema,
  createWorkflowFolderSchema,
  updateWorkflowFolderSchema,
  moveWorkflowSchema,
  duplicateWorkflowSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';

function requireLocation(locationId: string) {
  const location = db().findLocationById(locationId);
  if (!location) {
    throw new NotFoundError(`Location '${locationId}' not found`);
  }
  return location;
}

function requireWorkflow(locationId: string, workflowId: string) {
  const workflow = db().findWorkflowById(workflowId);
  if (!workflow || workflow.locationId !== locationId || workflow.deletedAt) {
    throw new NotFoundError(`Workflow '${workflowId}' not found in this location`);
  }
  return workflow;
}

function requireDeletedWorkflow(locationId: string, workflowId: string) {
  const workflow = db().findWorkflowById(workflowId);
  if (!workflow || workflow.locationId !== locationId || !workflow.deletedAt) {
    throw new NotFoundError(`Workflow '${workflowId}' not found in this location's trash`);
  }
  return workflow;
}

function requireWorkflowFolder(locationId: string, folderId: string) {
  const folder = db().findWorkflowFolderById(folderId);
  if (!folder || folder.locationId !== locationId) {
    throw new NotFoundError(`Workflow folder '${folderId}' not found in this location`);
  }
  return folder;
}

export async function workflowRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/workflow-folders - List workflow folders
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/workflow-folders',
    { preHandler: [tenantGuard, requirePermissions('workflows:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      requireLocation(locationId);
      const folders = db().listWorkflowFolders(locationId);

      return sendSuccess(reply, folders, 200, { total: folders.length });
    }
  );

  // POST /api/v1/locations/:locationId/workflow-folders - Create workflow folder
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/workflow-folders',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      requireLocation(locationId);

      const parseResult = createWorkflowFolderSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const folder = db().createWorkflowFolder({
        locationId,
        ...parseResult.data,
      });
      return sendSuccess(reply, folder, 201);
    }
  );

  // PATCH /api/v1/locations/:locationId/workflow-folders/:folderId - Update workflow folder
  fastify.patch<{ Params: { locationId: string; folderId: string } }>(
    '/:locationId/workflow-folders/:folderId',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId, folderId } = request.params;
      requireWorkflowFolder(locationId, folderId);

      const parseResult = updateWorkflowFolderSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const folder = db().updateWorkflowFolder(folderId, parseResult.data);
      return sendSuccess(reply, folder, 200);
    }
  );

  // DELETE /api/v1/locations/:locationId/workflow-folders/:folderId - Delete workflow folder
  fastify.delete<{ Params: { locationId: string; folderId: string } }>(
    '/:locationId/workflow-folders/:folderId',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId, folderId } = request.params;
      requireWorkflowFolder(locationId, folderId);

      db().deleteWorkflowFolder(folderId);
      return sendSuccess(reply, { deleted: true, id: folderId }, 200);
    }
  );

  // GET /api/v1/locations/:locationId/workflows - List workflows
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/workflows',
    { preHandler: [tenantGuard, requirePermissions('workflows:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      requireLocation(locationId);
      const workflows = db().listWorkflowsByLocation(locationId);

      return sendSuccess(reply, workflows, 200, { total: workflows.length });
    }
  );

  // POST /api/v1/locations/:locationId/workflows - Create workflow
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/workflows',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = requireLocation(locationId);

      const parseResult = createWorkflowSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      if (parseResult.data.folderId) {
        requireWorkflowFolder(locationId, parseResult.data.folderId);
      }

      const workflow = db().createWorkflow({
        agencyId: location.agencyId,
        locationId,
        name: parseResult.data.name,
        description: parseResult.data.description,
        status: parseResult.data.status,
        trigger: parseResult.data.trigger,
        steps: parseResult.data.steps,
        folderId: parseResult.data.folderId,
        tags: parseResult.data.tags,
        createdBy: request.user!.userId,
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
      const workflow = requireWorkflow(locationId, workflowId);

      return sendSuccess(reply, workflow, 200);
    }
  );

  // PATCH /api/v1/locations/:locationId/workflows/:workflowId - Update workflow
  fastify.patch<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      requireWorkflow(locationId, workflowId);

      const parseResult = updateWorkflowSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      if (parseResult.data.folderId) {
        requireWorkflowFolder(locationId, parseResult.data.folderId);
      }

      const updated = db().updateWorkflow(workflowId, parseResult.data);
      return sendSuccess(reply, updated, 200);
    }
  );

  // GET /api/v1/locations/:locationId/workflows/trash - List soft-deleted workflows
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/workflows/trash',
    { preHandler: [tenantGuard, requirePermissions('workflows:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      requireLocation(locationId);
      const workflows = db().listDeletedWorkflows(locationId);

      return sendSuccess(reply, workflows, 200, { total: workflows.length });
    }
  );

  // DELETE /api/v1/locations/:locationId/workflows/:workflowId - Soft-delete workflow
  fastify.delete<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      requireWorkflow(locationId, workflowId);

      const workflow = db().softDeleteWorkflow(workflowId);
      return sendSuccess(
        reply,
        { deleted: true, id: workflowId, deletedAt: workflow.deletedAt },
        200
      );
    }
  );

  // POST /api/v1/locations/:locationId/workflows/:workflowId/restore - Restore workflow
  fastify.post<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId/restore',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      requireDeletedWorkflow(locationId, workflowId);

      const workflow = db().restoreWorkflow(workflowId);
      return sendSuccess(reply, workflow, 200);
    }
  );

  // POST /api/v1/locations/:locationId/workflows/:workflowId/duplicate - Duplicate workflow
  fastify.post<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId/duplicate',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      requireWorkflow(locationId, workflowId);

      const parseResult = duplicateWorkflowSchema.safeParse(request.body ?? {});
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const workflow = db().duplicateWorkflow(
        workflowId,
        parseResult.data.name,
        request.user!.userId
      );
      return sendSuccess(reply, workflow, 201);
    }
  );

  // PATCH /api/v1/locations/:locationId/workflows/:workflowId/move - Move workflow to folder
  fastify.patch<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId/move',
    { preHandler: [tenantGuard, requirePermissions('workflows:manage')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      requireWorkflow(locationId, workflowId);

      const parseResult = moveWorkflowSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      if (parseResult.data.folderId) {
        requireWorkflowFolder(locationId, parseResult.data.folderId);
      }

      const workflow = db().moveWorkflowToFolder(workflowId, parseResult.data.folderId);
      return sendSuccess(reply, workflow, 200);
    }
  );

  // POST /api/v1/locations/:locationId/workflows/:workflowId/test - Manual test run
  fastify.post<{ Params: { locationId: string; workflowId: string } }>(
    '/:locationId/workflows/:workflowId/test',
    { preHandler: [tenantGuard, requirePermissions('workflows:execute')] },
    async (request, reply) => {
      const { locationId, workflowId } = request.params;
      requireWorkflow(locationId, workflowId);

      const parseResult = testRunWorkflowSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const { contactId, triggerData } = parseResult.data;
      const contact = db().findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      const execution = db().executeWorkflow(workflowId, {
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
      requireWorkflow(locationId, workflowId);

      const executions = db().listWorkflowExecutions(workflowId);
      return sendSuccess(reply, executions, 200, { total: executions.length });
    }
  );
}
