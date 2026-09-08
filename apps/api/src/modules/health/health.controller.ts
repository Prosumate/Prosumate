import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess } from '../../common/response';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  });
}
