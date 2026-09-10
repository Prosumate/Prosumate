import { FastifyInstance } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  sendReviewRequestSchema,
  replyReviewSchema,
  publicSubmitReviewSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError } from '../../common/errors';

export async function reputationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/reputation/reviews - List reviews
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/reputation/reviews',
    { preHandler: [tenantGuard, requirePermissions('reputation:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const reviews = db().listCustomerReviews(locationId);

      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
          : 0;

      return sendSuccess(reply, reviews, 200, {
        total: totalReviews,
        averageRating,
      });
    }
  );

  // POST /api/v1/locations/:locationId/reputation/reviews/:reviewId/reply - Reply to review
  fastify.post<{ Params: { locationId: string; reviewId: string } }>(
    '/:locationId/reputation/reviews/:reviewId/reply',
    { preHandler: [tenantGuard, requirePermissions('reputation:manage')] },
    async (request, reply) => {
      const { locationId, reviewId } = request.params;

      const parseResult = replyReviewSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const updated = db().replyToReview(locationId, reviewId, parseResult.data.replyText);

      return sendSuccess(reply, updated, 200);
    }
  );

  // POST /api/v1/locations/:locationId/reputation/requests - Send review request (SMS or Email)
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/reputation/requests',
    { preHandler: [tenantGuard, requirePermissions('reputation:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = sendReviewRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const reviewReq = db().sendReviewRequest(locationId, {
        agencyId: location.agencyId,
        contactId: parseResult.data.contactId,
        channel: parseResult.data.channel,
        customMessage: parseResult.data.customMessage,
      });

      return sendSuccess(reply, reviewReq, 201);
    }
  );

  // GET /api/v1/locations/:locationId/reputation/requests - List review requests
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/reputation/requests',
    { preHandler: [tenantGuard, requirePermissions('reputation:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const requests = db().listReviewRequests(locationId);

      return sendSuccess(reply, requests, 200, { total: requests.length });
    }
  );
}

export async function publicReputationRoutes(fastify: FastifyInstance) {
  // GET /api/v1/public/locations/:locationId/reviews - Public reviews widget feed
  fastify.get<{ Params: { locationId: string } }>(
    '/locations/:locationId/reviews',
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const reviews = db().listCustomerReviews(locationId);
      const averageRating =
        reviews.length > 0
          ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
          : 0;

      return sendSuccess(reply, {
        locationName: location.name,
        averageRating,
        totalReviews: reviews.length,
        reviews,
      }, 200);
    }
  );

  // POST /api/v1/public/locations/:locationId/reviews - Public review submission
  fastify.post<{ Params: { locationId: string } }>(
    '/locations/:locationId/reviews',
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = publicSubmitReviewSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const review = db().submitPublicReview(locationId, {
        agencyId: location.agencyId,
        authorName: parseResult.data.authorName,
        rating: parseResult.data.rating,
        source: parseResult.data.source,
        reviewText: parseResult.data.reviewText,
      });

      return sendSuccess(reply, review, 201);
    }
  );
}
