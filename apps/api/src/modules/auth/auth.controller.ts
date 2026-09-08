import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '@prosumate/validation';
import { sendSuccess, sendError } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { ValidationError } from '../../common/errors';

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/v1/auth/register
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten());
    }

    const result = await authService.register(parseResult.data, request.ip);
    return sendSuccess(reply, result, 201);
  });

  // POST /api/v1/auth/login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten());
    }

    const result = await authService.login(parseResult.data, request.ip);
    return sendSuccess(reply, result, 200);
  });

  // POST /api/v1/auth/refresh
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = refreshTokenSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten());
    }

    const tokens = await authService.refreshToken(parseResult.data.refreshToken);
    return sendSuccess(reply, { tokens }, 200);
  });

  // POST /api/v1/auth/logout
  fastify.post('/logout', { preHandler: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const body = request.body as { refreshToken?: string } | undefined;
    await authService.logout(userId, body?.refreshToken);
    return sendSuccess(reply, { message: 'Logged out successfully' }, 200);
  });

  // GET /api/v1/auth/me
  fastify.get('/me', { preHandler: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const profile = await authService.getCurrentProfile(request.user!.userId);
    return sendSuccess(reply, profile, 200);
  });
}
