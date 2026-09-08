import { FastifyReply, FastifyRequest } from 'fastify';
import { ApiSuccessResponse, ApiErrorResponse } from '@prosumate/types';
import { randomUUID } from 'crypto';

export function getRequestId(request: FastifyRequest): string {
  const reqId = request.headers['x-request-id'] as string;
  return reqId || (request.id as string) || randomUUID();
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta?: ApiSuccessResponse<T>['meta']
) {
  const requestId = getRequestId(reply.request);
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta,
    requestId,
  };
  return reply.status(statusCode).send(response);
}

export function sendError(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 500,
  details?: unknown
) {
  const requestId = getRequestId(reply.request);
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    requestId,
  };
  return reply.status(statusCode).send(response);
}
