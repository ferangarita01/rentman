/**
 * Audit Logging Middleware
 * Logs all API requests for compliance and debugging
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logAuditEvent } from '../services/supabase.js';
import logger from '../utils/logger.js';

export async function auditLog(request: FastifyRequest, reply: FastifyReply) {
  const startTime = Date.now();

  // Hook into onResponse to log after request completes
  reply.raw.on('finish', () => {
    const responseTime = Date.now() - startTime;

    const auditData = {
      agent_id: (request as any).agent?.id || 'anonymous',
      action: `${request.method} ${request.routeOptions.url || request.url}`,
      resource_type: extractResourceType(request.url),
      resource_id: extractResourceId(request.url),
      ip_address: request.ip,
      user_agent: request.headers['user-agent'] || 'unknown',
      request_payload: sanitizePayload(request.body),
      response_status: reply.statusCode,
    };

    // Log to database (async, don't block response)
    logAuditEvent(auditData).catch((error) => {
      logger.error(error, 'Failed to log audit event');
    });

    // Log to application logger
    logger.info({
      type: 'audit',
      ...auditData,
      response_time_ms: responseTime,
    });
  });
}

/**
 * Extract resource type from URL
 * /v1/market/tasks/123 -> "task"
 */
function extractResourceType(url: string): string {
  const match = url.match(/\/v1\/(\w+)\/([\w-]+)/);
  if (match) {
    return match[2].replace(/s$/, ''); // Remove plural 's'
  }
  return 'unknown';
}

/**
 * Extract resource ID from URL
 * /v1/market/tasks/123 -> "123"
 */
function extractResourceId(url: string): string | undefined {
  const match = url.match(/\/([0-9a-f-]{36}|\d+)$/);
  return match ? match[1] : undefined;
}

/**
 * Sanitize payload for logging
 * Remove sensitive fields
 */
function sanitizePayload(payload: any): unknown {
  if (!payload) return null;

  const sensitiveFields = [
    'password',
    'secret',
    'token',
    'api_key',
    'private_key',
    'credit_card',
  ];

  const sanitized = { ...payload };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
