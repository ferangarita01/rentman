/**
 * Logger Configuration
 * Using Pino for high-performance logging
 */

import pino from 'pino';
import config, { isDevelopment } from '../config.js';

const logger = pino({
  level: config.LOG_LEVEL,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;

// Utility functions for structured logging
export const logRequest = (req: {
  method: string;
  url: string;
  agentId?: string;
}) => {
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    agent_id: req.agentId,
  });
};

export const logResponse = (res: {
  statusCode: number;
  responseTime: number;
  agentId?: string;
}) => {
  logger.info({
    type: 'response',
    status: res.statusCode,
    response_time_ms: res.responseTime,
    agent_id: res.agentId,
  });
};

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error({
    type: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};
