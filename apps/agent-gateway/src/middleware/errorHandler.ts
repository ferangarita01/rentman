/**
 * Error Handler Middleware
 * Centralized error handling with proper status codes
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';
import logger, { logError } from '../utils/logger.js';
import { APIResponse } from '../types/index.js';
import { isDevelopment } from '../config.js';

export async function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error
  logError(error, {
    agent_id: request.agent?.id,
    url: request.url,
    method: request.method,
  });

  // Handle known error types
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: isDevelopment ? error.details : undefined,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: request.id,
        agent_id: request.agent?.id,
      },
    } as APIResponse);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: isDevelopment ? error.errors : undefined,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: request.id,
        agent_id: request.agent?.id,
      },
    } as APIResponse);
  }

  // Handle Fastify errors
  if ('statusCode' in error) {
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'FASTIFY_ERROR',
        message: error.message,
        details: isDevelopment ? error : undefined,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: request.id,
        agent_id: request.agent?.id,
      },
    } as APIResponse);
  }

  // Handle unknown errors
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment
        ? error.message
        : 'An internal error occurred',
      details: isDevelopment ? error : undefined,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      request_id: request.id,
      agent_id: request.agent?.id,
    },
  } as APIResponse);
}

/**
 * Not Found Handler
 */
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      request_id: request.id,
    },
  } as APIResponse);
}
