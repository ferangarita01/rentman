/**
 * Agent Gateway - Main Server
 * Professional AI Agent API Gateway
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import config, { isDevelopment } from './config.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import RedisService from './services/redis.js';

// Routes
import { marketTasksRoutes } from './routes/market/tasks.js';
import { marketHumansRoutes } from './routes/market/humans.js';
import { agentRoutes } from './routes/agents/register.js';

console.log('--- STARTING AGENT GATEWAY SERVER (REVISION TEST) ---');

const fastify = Fastify({
  logger: true,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'request_id',
  disableRequestLogging: !isDevelopment,
  trustProxy: true,
});

// Set Zod compiler
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

async function buildServer() {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: config.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // WebSocket support for MCP
  if (config.MCP_ENABLED) {
    await fastify.register(websocket);
  }

  // OpenAPI/Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Rentman Agent Gateway API',
        description: 'AI Agent API for the Rentman Marketplace. Allows external AI assistants (ChatGPT, Claude, Gemini) and autonomous agents to interact with the marketplace.',
        version: '1.0.0',
        contact: {
          name: 'Rentman API Support',
          email: 'api@rentman.io',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: isDevelopment
            ? `http://localhost:${config.PORT}`
            : 'https://agent-gateway.rentman.app',
          description: isDevelopment ? 'Development server' : 'Production server',
        },
      ],
      tags: [
        {
          name: 'Market',
          description: 'Marketplace operations - create tasks, search humans, hire operators',
        },
        {
          name: 'Agents',
          description: 'Agent management - registration, API keys',
        },
        {
          name: 'Tools',
          description: 'MCP tools for local AI assistants',
        },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description: 'API key for M2M authentication (format: sk_live_xxx or sk_test_xxx)',
          },
          NaclSignature: {
            type: 'apiKey',
            in: 'header',
            name: 'x-signature',
            description: 'NACL signature for autonomous agents (format: nacl:base64_signature)',
          },
        },
      },
      security: [
        {
          ApiKeyAuth: [],
        },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });

  // Health check
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
    };
  });

  // Root endpoint
  fastify.get('/', async (request, reply) => {
    return {
      name: 'Rentman Agent Gateway',
      version: '1.0.0',
      description: 'AI Agent API Gateway for Rentman Marketplace',
      documentation: '/docs',
      openapi_spec: '/docs/json',
      health: '/health',
    };
  });

  // Register routes
  await fastify.register(marketTasksRoutes, { prefix: '/v1/market' });
  await fastify.register(marketHumansRoutes, { prefix: '/v1/market' });
  await fastify.register(agentRoutes, { prefix: '/v1/agents' });

  // Error handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();

    // Start server
    await server.listen({
      port: config.PORT,
      host: config.HOST,
    });

    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🤖 RENTMAN AGENT GATEWAY - RUNNING                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Environment:    ${config.NODE_ENV}
Server:         http://${config.HOST}:${config.PORT}
Documentation:  http://${config.HOST}:${config.PORT}/docs
OpenAPI Spec:   http://${config.HOST}:${config.PORT}/docs/json
Health Check:   http://${config.HOST}:${config.PORT}/health

MCP Enabled:    ${config.MCP_ENABLED}
${config.MCP_ENABLED ? `MCP Port:       ${config.MCP_PORT}` : ''}

🚀 Ready to accept AI agent requests!
    `);
  } catch (error) {
    console.error('CRITICAL STARTUP ERROR:', error);
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');

  try {
    await fastify.close();
    await RedisService.disconnect();
    logger.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error(error, 'Unhandled rejection');
  shutdown();
});

// Start the server
start();

export { buildServer };
