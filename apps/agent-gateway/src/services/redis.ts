/**
 * Redis Service for Rate Limiting and Caching
 */

import { createClient, RedisClientType } from 'redis';
import config from '../config.js';
import logger from '../utils/logger.js';

class RedisService {
  private static instance: RedisClientType;
  private static connecting: Promise<void> | null = null;

  static async getInstance(): Promise<RedisClientType> {
    if (!RedisService.instance) {
      if (!RedisService.connecting) {
        RedisService.connecting = RedisService.connect();
      }
      await RedisService.connecting;
    }

    return RedisService.instance;
  }

  private static async connect(): Promise<void> {
    try {
      RedisService.instance = createClient({
        url: config.REDIS_URL,
      });

      RedisService.instance.on('error', (err) => {
        logger.error(err, 'Redis error');
      });

      RedisService.instance.on('connect', () => {
        logger.info('✅ Redis connected');
      });

      await RedisService.instance.connect();
    } catch (error) {
      logger.error(error, 'Failed to connect to Redis');
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (RedisService.instance) {
      await RedisService.instance.quit();
    }
  }
}

// Rate limiting functions
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
}> {
  const redis = await RedisService.getInstance();
  const now = Date.now();
  const windowStart = now - windowMs;

  const multi = redis.multi();

  // Remove old entries
  multi.zRemRangeByScore(key, 0, windowStart);

  // Count current requests
  multi.zCard(key);

  // Add current request
  multi.zAdd(key, { score: now, value: `${now}` });

  // Set expiry
  multi.expire(key, Math.ceil(windowMs / 1000));

  const results = await multi.exec();
  const count = (results?.[1] as number) || 0;

  const allowed = count < max;
  const remaining = Math.max(0, max - count - 1);
  const reset = now + windowMs;

  return {
    allowed,
    remaining,
    reset,
  };
}

// Caching functions
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = await RedisService.getInstance();
  const cached = await redis.get(key);

  if (!cached) return null;

  try {
    return JSON.parse(cached) as T;
  } catch {
    return cached as T;
  }
}

export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  const redis = await RedisService.getInstance();
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await redis.setEx(key, ttlSeconds, serialized);
}

export async function deleteCached(key: string): Promise<void> {
  const redis = await RedisService.getInstance();
  await redis.del(key);
}

export default RedisService;
