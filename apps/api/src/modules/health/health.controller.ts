import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, sendError } from '../../common/response';
import {
  emailProvider,
  smsProvider,
  paymentProvider,
  aiProvider,
  InternalEmailProvider,
  InternalSmsProvider,
  InternalPaymentProvider,
  InternalAiProvider,
} from '../../providers';
import { cache, jobQueue } from '../../common/redis';
import { internalAutomationEngine } from '../workflows/internal-automation.service';
import { config } from '../../config';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import { ForbiddenError } from '../../common/errors';

function secureHtml(reply: FastifyReply): void {
  reply
    .header('Content-Security-Policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:")
    .header('X-Content-Type-Options', 'nosniff')
    .header('Referrer-Policy', 'no-referrer')
    .type('text/html; charset=utf-8');
}

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, {
      status: 'ok',
      mode: '100% Internal Native Architecture',
      externalDependencies: 'none',
      deliveryModel: 'local mailbox, telephony, and billing sandbox',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  fastify.get('/ready', async (_request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, {
      status: 'ready',
      repository: 'in-process repository',
      services: {
        email: emailProvider.name,
        sms: smsProvider.name,
        billing: paymentProvider.name,
        ai: aiProvider.name,
        automation: config.automationEngine,
        cache: 'internal-in-process',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Platform-wide diagnostics expose counts only and require a platform admin.
  fastify.get(
    '/api/v1/internal/services',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user?.isPlatformAdmin) throw new ForbiddenError('Platform administrator access is required');
      const internalEmail = emailProvider instanceof InternalEmailProvider ? emailProvider : null;
      const internalSms = smsProvider instanceof InternalSmsProvider ? smsProvider : null;
      const internalPayment = paymentProvider instanceof InternalPaymentProvider ? paymentProvider : null;
      const internalAi = aiProvider instanceof InternalAiProvider ? aiProvider : null;
      return sendSuccess(reply, {
        architecture: '100% Native Internal (local sandbox transports)',
        services: {
          email: {
            provider: emailProvider.name,
            isInternal: Boolean(internalEmail),
            totalRecords: internalEmail ? internalEmail.getOutbox().length + internalEmail.getInbox().length : 0,
            deliveryScope: internalEmail ? 'internal_mailbox' : 'external',
          },
          sms: {
            provider: smsProvider.name,
            isInternal: Boolean(internalSms),
            totalRecords: internalSms ? internalSms.listMessages().length : 0,
            deliveryScope: internalSms ? 'internal_sandbox' : 'carrier',
          },
          billing: {
            provider: paymentProvider.name,
            isInternal: Boolean(internalPayment),
            settlementMode: internalPayment ? 'internal_sandbox' : 'external',
          },
          ai: {
            provider: aiProvider.name,
            isInternal: Boolean(internalAi),
            engine: internalAi ? 'deterministic-local-rules' : 'external',
            capabilities: ['BANT scoring', 'sentiment and intent', 'smart replies', '15-niche copy', 'branch evaluation'],
          },
          automation: {
            engine: 'repository-backed internal workflow engine',
            executionCount: internalAutomationEngine.listExecutions().length,
          },
          cacheAndQueue: {
            engine: 'in-process cache, event bus, hashes, and retry queue',
            queueStats: jobQueue.getQueueStats('default'),
          },
        },
        timestamp: new Date().toISOString(),
      });
    }
  );

  fastify.get<{ Params: { locationId: string } }>(
    '/api/v1/locations/:locationId/internal/emails',
    { preHandler: [authGuard, tenantGuard, requirePermissions('conversations:read')] },
    async (request, reply) => {
      if (!(emailProvider instanceof InternalEmailProvider)) {
        return sendSuccess(reply, [], 200, { total: 0 });
      }
      const records = emailProvider.getOutbox({ locationId: request.params.locationId });
      return sendSuccess(reply, records, 200, { total: records.length });
    }
  );

  fastify.get<{ Params: { locationId: string; id: string } }>(
    '/api/v1/locations/:locationId/internal/emails/:id/preview',
    { preHandler: [authGuard, tenantGuard, requirePermissions('conversations:read')] },
    async (request, reply) => {
      if (!(emailProvider instanceof InternalEmailProvider)) {
        return sendError(reply, 'NOT_FOUND', 'Internal email provider is not active', 404);
      }
      const email = emailProvider.getEmailById(request.params.id);
      if (!email || email.locationId !== request.params.locationId) {
        return sendError(reply, 'NOT_FOUND', 'Email not found in this location', 404);
      }
      secureHtml(reply);
      return reply.send(email.html);
    }
  );

  fastify.get<{ Params: { locationId: string; id: string } }>(
    '/api/v1/locations/:locationId/internal/invoices/:id/download',
    { preHandler: [authGuard, tenantGuard, requirePermissions('billing:read')] },
    async (request, reply) => {
      if (!(paymentProvider instanceof InternalPaymentProvider)) {
        return sendError(reply, 'NOT_FOUND', 'Internal payment provider is not active', 404);
      }
      const invoice = paymentProvider.getInvoiceById(request.params.id, request.params.locationId);
      if (!invoice) return sendError(reply, 'NOT_FOUND', 'Invoice not found in this location', 404);
      secureHtml(reply);
      return reply.send(invoice.pdfHtml);
    }
  );

  fastify.get<{ Params: { locationId: string } }>(
    '/api/v1/locations/:locationId/internal/virtual-numbers',
    { preHandler: [authGuard, tenantGuard, requirePermissions('conversations:read')] },
    async (request, reply) => {
      const numbers = smsProvider instanceof InternalSmsProvider
        ? smsProvider.getVirtualNumbers(request.params.locationId)
        : [];
      return sendSuccess(reply, numbers, 200, { total: numbers.length });
    }
  );

  // Keep the imported cache live and visible to static analysis without
  // exposing its contents over unauthenticated diagnostics.
  void cache;
}
