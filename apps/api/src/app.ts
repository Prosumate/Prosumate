import Fastify, { FastifyInstance, FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config';
import { sendError, getRequestId } from './common/response';
import { AppError } from './common/errors';
import { authRoutes } from './modules/auth/auth.controller';
import { agencyRoutes } from './modules/agencies/agencies.controller';
import { locationRoutes } from './modules/locations/locations.controller';
import { auditRoutes } from './modules/audit/audit.controller';
import { healthRoutes } from './modules/health/health.controller';
import { contactRoutes } from './modules/crm/contacts.controller';
import { companyRoutes } from './modules/crm/companies.controller';
import { pipelineRoutes } from './modules/crm/pipelines.controller';
import { calendarRoutes } from './modules/calendars/calendars.controller';
import { formRoutes, publicFormRoutes } from './modules/forms/forms.controller';
import { conversationRoutes, publicConversationRoutes } from './modules/conversations/conversations.controller';
import { workflowRoutes } from './modules/workflows/workflows.controller';
import { billingRoutes, publicBillingRoutes } from './modules/billing/billing.controller';
import { funnelRoutes, publicFunnelRoutes } from './modules/funnels/funnels.controller';
import { reportingRoutes } from './modules/reporting/reporting.controller';
import { reputationRoutes, publicReputationRoutes } from './modules/reputation/reputation.controller';
import { aiRoutes } from './modules/ai/ai.controller';
import { marketplaceRoutes } from './modules/marketplace/marketplace.controller';
import { webhookRoutes } from './modules/webhooks/webhooks.controller';
import { enterpriseRoutes } from './modules/enterprise/enterprise.controller';
import { logger } from '@prosumate/logger';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: false, // We use structured JSON logger with request tracing
    requestIdHeader: 'x-request-id',
  });

  // Security headers & CORS
  app.register(helmet, {
    contentSecurityPolicy: false, // Allows flexible API usage
  });

  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('railway.app') ||
        origin === config.allowCrossOrigin
      ) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global Error Handler
  app.setErrorHandler((error: FastifyError | AppError | Error, request, reply) => {
    const requestId = getRequestId(request);

    if (error instanceof AppError || ('statusCode' in error && 'code' in error)) {
      const appErr = error as any;
      logger.warn(`API Error [${appErr.code}]: ${appErr.message}`, {
        requestId,
        statusCode: appErr.statusCode,
        code: appErr.code,
      });
      return sendError(reply, appErr.code, appErr.message, appErr.statusCode, appErr.details);
    }

    // Fastify schema/validation error
    if ('validation' in error && error.validation) {
      return sendError(reply, 'VALIDATION_ERROR', error.message, 400, error.validation);
    }

    logger.error(`Unhandled Server Error: ${error.message}`, error as Error, {
      requestId,
      url: request.url,
      method: request.method,
    });

    // Never leak raw stack traces to production callers
    const message = config.env === 'production' ? 'Internal server error' : error.message;
    return sendError(reply, 'INTERNAL_SERVER_ERROR', message, 500);
  });

  // 404 Handler
  app.setNotFoundHandler((request, reply) => {
    return sendError(reply, 'ROUTE_NOT_FOUND', `Route ${request.method} ${request.url} not found`, 404);
  });

  // Register Routes
  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(agencyRoutes, { prefix: '/api/v1/agencies' });
  app.register(locationRoutes, { prefix: '/api/v1/locations' });
  app.register(contactRoutes, { prefix: '/api/v1/locations' });
  app.register(companyRoutes, { prefix: '/api/v1/locations' });
  app.register(pipelineRoutes, { prefix: '/api/v1/locations' });
  app.register(calendarRoutes, { prefix: '/api/v1/locations' });
  app.register(formRoutes, { prefix: '/api/v1/locations' });
  app.register(publicFormRoutes, { prefix: '/api/v1/public' });
  app.register(conversationRoutes, { prefix: '/api/v1/locations' });
  app.register(publicConversationRoutes, { prefix: '/api/v1/public' });
  app.register(workflowRoutes, { prefix: '/api/v1/locations' });
  app.register(billingRoutes, { prefix: '/api/v1/locations' });
  app.register(publicBillingRoutes, { prefix: '/api/v1/billing' });
  app.register(funnelRoutes, { prefix: '/api/v1/locations' });
  app.register(publicFunnelRoutes, { prefix: '/api/v1/public' });
  app.register(reportingRoutes, { prefix: '/api/v1/locations' });
  app.register(reputationRoutes, { prefix: '/api/v1/locations' });
  app.register(publicReputationRoutes, { prefix: '/api/v1/public' });
  app.register(aiRoutes, { prefix: '/api/v1/locations' });
  app.register(marketplaceRoutes, { prefix: '/api/v1' });
  app.register(webhookRoutes, { prefix: '/api/v1/locations' });
  app.register(enterpriseRoutes, { prefix: '/api/v1/locations' });
  app.register(auditRoutes, { prefix: '/api/v1/audit-logs' });

  return app;
}
