import { FastifyInstance } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  topUpWalletSchema,
  updateWalletConfigSchema,
  recordUsageSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';
import { paymentProvider } from '../../providers';

export async function billingRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/billing/subscription - Get subscription
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/billing/subscription',
    { preHandler: [tenantGuard, requirePermissions('billing:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const sub = db().getLocationSubscription(locationId);

      return sendSuccess(reply, sub || null, 200);
    }
  );

  // POST /api/v1/locations/:locationId/billing/subscription - Subscribe / Change Plan
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/billing/subscription',
    { preHandler: [tenantGuard, requirePermissions('billing:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const parseResult = createSubscriptionSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const { planId, paymentMethodId } = parseResult.data;
      await paymentProvider.createSubscription({ locationId, planId, paymentMethodId });
      const sub = db().subscribeLocation(locationId, planId, paymentMethodId);

      return sendSuccess(reply, sub, 200);
    }
  );

  // DELETE /api/v1/locations/:locationId/billing/subscription - Cancel Subscription
  fastify.delete<{ Params: { locationId: string } }>(
    '/:locationId/billing/subscription',
    { preHandler: [tenantGuard, requirePermissions('billing:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      await paymentProvider.cancelSubscription(locationId);
      const sub = db().cancelLocationSubscription(locationId);

      return sendSuccess(reply, sub, 200);
    }
  );

  // GET /api/v1/locations/:locationId/billing/wallet - Get credit wallet
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/billing/wallet',
    { preHandler: [tenantGuard, requirePermissions('billing:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const wallet = db().getCreditWallet(locationId);

      return sendSuccess(reply, wallet, 200);
    }
  );

  // POST /api/v1/locations/:locationId/billing/wallet/topup - Top up credit balance
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/billing/wallet/topup',
    { preHandler: [tenantGuard, requirePermissions('billing:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const parseResult = topUpWalletSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const { amountCents } = parseResult.data;
      await paymentProvider.topUpWallet({ locationId, amountCents });
      const wallet = db().topUpCreditWallet(locationId, amountCents);

      return sendSuccess(reply, wallet, 200);
    }
  );

  // PATCH /api/v1/locations/:locationId/billing/wallet/config - Update auto-recharge config
  fastify.patch<{ Params: { locationId: string } }>(
    '/:locationId/billing/wallet/config',
    { preHandler: [tenantGuard, requirePermissions('billing:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const parseResult = updateWalletConfigSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const wallet = db().updateCreditWalletConfig(locationId, parseResult.data);

      return sendSuccess(reply, wallet, 200);
    }
  );

  // POST /api/v1/locations/:locationId/billing/usage - Record usage transaction
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/billing/usage',
    { preHandler: [tenantGuard, requirePermissions('billing:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const parseResult = recordUsageSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const tx = db().recordUsage(locationId, parseResult.data);

      return sendSuccess(reply, tx, 201);
    }
  );

  // GET /api/v1/locations/:locationId/billing/usage - List usage ledger
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/billing/usage',
    { preHandler: [tenantGuard, requirePermissions('billing:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const ledger = db().listUsageTransactions(locationId);

      return sendSuccess(reply, ledger, 200, { total: ledger.length });
    }
  );

  // GET /api/v1/locations/:locationId/billing/invoices - List invoices
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/billing/invoices',
    { preHandler: [tenantGuard, requirePermissions('billing:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const invoices = db().listInvoices(locationId);

      return sendSuccess(reply, invoices, 200, { total: invoices.length });
    }
  );

  // GET /api/v1/locations/:locationId/billing/plans - List public subscription plans
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/billing/plans',
    { preHandler: [tenantGuard, requirePermissions('billing:read')] },
    async (request, reply) => {
      const plans = db().listSubscriptionPlans();

      return sendSuccess(reply, plans, 200, { total: plans.length });
    }
  );
}

// Public billing routes (pricing plans)
export async function publicBillingRoutes(fastify: FastifyInstance) {
  fastify.get('/plans', async (request, reply) => {
    const plans = db().listSubscriptionPlans();
    return sendSuccess(reply, plans, 200, { total: plans.length });
  });
}
