import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from 'dotenv';

import { taskRoutes } from './routes/tasks.js';
import { bidRoutes } from './routes/bids.js';
import { matchingRoutes } from './routes/matching.js';

config();

// Start server
const start = async () => {
    const fastify = Fastify({
        logger: true
    });

    // CORS
    await fastify.register(cors, {
        origin: true
    });

    // Swagger/OpenAPI
    await fastify.register(swagger, {
        openapi: {
            openapi: '3.1.0',
            info: {
                title: 'Rentman Market API',
                description: 'M2M API for AI Agents to hire humans',
                version: '1.0.0'
            },
            servers: [
                {
                    url: 'https://rentman-api-agent-gen-1.run.app',
                    description: 'Production'
                },
                {
                    url: 'http://localhost:8080',
                    description: 'Development'
                }
            ],
            components: {
                securitySchemes: {
                    apiKey: {
                        type: 'apiKey',
                        name: 'x-api-key',
                        in: 'header'
                    }
                }
            }
        }
    });

    await fastify.register(swaggerUi, {
        routePrefix: '/docs'
    });

    // Routes
    await fastify.register(taskRoutes, { prefix: '/v1/market' });
    await fastify.register(bidRoutes, { prefix: '/v1/market' });
    await fastify.register(matchingRoutes, { prefix: '/v1/market' });

    // Health check
    fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    try {
        const port = parseInt(process.env.PORT || '8080');
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Rentman API running on port ${port}`);
        console.log(`📚 OpenAPI docs: http://localhost:${port}/docs`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
