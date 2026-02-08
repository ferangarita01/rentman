/**
 * Rate Limiting Middleware
 * Per-agent rate limiting using Redis
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { checkRateLimit } from '../services/redis.js';
import { RateLimitError } from '../utils/errors.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
  keyGenerator?: (request: FastifyRequest) => string;
}

/**
 * Rate limit by agent ID
 */
export function rateLimitByAgent(options: RateLimitOptions = {}) {
  const max = options.max || config.RATE_LIMIT_MAX;
  const windowMs = options.windowMs || config.RATE_LIMIT_WINDOW;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const agentId = request.agent?.id;

    if (!agentId) {
      // If no agent, use IP address
      const ip = request.ip;
      const key = `ratelimit:ip:${ip}`;

      const { allowed, remaining, reset } = await checkRateLimit(
        key,
        max,
        windowMs
      );

      setRateLimitHeaders(reply, { max, remaining, reset });

      if (!allowed) {
        logger.warn({
          msg: 'Rate limit exceeded',
          ip,
          key,
        });
        throw new RateLimitError(
          'Rate limit exceeded',
          Math.ceil((reset - Date.now()) / 1000)
        );
      }

      return;
    }

    const key = `ratelimit:agent:${agentId}`;

    const { allowed, remaining, reset } = await checkRateLimit(
      key,
      max,
      windowMs
    );

    setRateLimitHeaders(reply, { max, remaining, reset });

    if (!allowed) {
      logger.warn({
        msg: 'Rate limit exceeded',
        agent_id: agentId,
        agent_name: request.agent.name,
      });

      throw new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        Math.ceil((reset - Date.now()) / 1000),
        {
          limit: max,
          window_ms: windowMs,
          retry_after: Math.ceil((reset - Date.now()) / 1000),
        }
      );
    }
  };
}

/**
 * Rate limit by endpoint
 */
export function rateLimitByEndpoint(options: RateLimitOptions = {}) {
  const max = options.max || config.RATE_LIMIT_MAX;
  const windowMs = options.windowMs || config.RATE_LIMIT_WINDOW;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const endpoint = request.routeOptions.url || request.url;
    const agentId = request.agent?.id || request.ip;
    const key = `ratelimit:endpoint:${agentId}:${endpoint}`;

    const { allowed, remaining, reset } = await checkRateLimit(
      key,
      max,
      windowMs
    );

    setRateLimitHeaders(reply, { max, remaining, reset });

    if (!allowed) {
      throw new RateLimitError(
        'Endpoint rate limit exceeded',
        Math.ceil((reset - Date.now()) / 1000)
      );
    }
  };
}

/**
 * Set rate limit headers
 */
function setRateLimitHeaders(
  reply: FastifyReply,
  info: { max: number; remaining: number; reset: number }
) {
  reply.header('X-RateLimit-Limit', info.max);
  reply.header('X-RateLimit-Remaining', info.remaining);
  reply.header('X-RateLimit-Reset', Math.floor(info.reset / 1000));

  if (info.remaining === 0) {
    reply.header(
      'Retry-After',
      Math.ceil((info.reset - Date.now()) / 1000)
    );
  }
}
