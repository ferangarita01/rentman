import { FastifyInstance } from 'fastify';
import { matchingService } from '../services/matching.js';

export async function matchingRoutes(fastify: FastifyInstance) {

    // POST /v1/market/tasks/:id/match - Encuentra candidatos para una tarea
    fastify.post<{ Params: { id: string } }>('/tasks/:id/match', {
        schema: {
            description: 'Find qualified humans for a task using growth-focused matching',
            tags: ['Matching'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;

        try {
            const candidates = await matchingService.findCandidatesWithGrowth(id);

            return reply.send({
                success: true,
                data: {
                    task_id: id,
                    candidates: candidates.slice(0, 5), // Top 5
                    total_found: candidates.length
                },
                meta: {
                    matching_algorithm: 'growth-focused',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (err: any) {
            return reply.code(500).send({
                success: false,
                error: { code: 'MATCHING_FAILED', message: err.message }
            });
        }
    });

    // POST /v1/market/tasks/:id/auto-assign - Auto-asigna con rotación
    fastify.post<{ 
        Params: { id: string },
        Body: { agent_id: string }
    }>('/tasks/:id/auto-assign', {
        schema: {
            description: 'Auto-assign task to best candidate with rotation system',
            tags: ['Matching'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            },
            body: {
                type: 'object',
                required: ['agent_id'],
                properties: {
                    agent_id: { type: 'string', format: 'uuid' }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const { agent_id } = request.body;

        try {
            const result = await matchingService.assignWithRotation(id, agent_id);

            if (!result.success) {
                return reply.code(400).send({
                    success: false,
                    error: { code: 'ASSIGNMENT_FAILED', message: result.reason }
                });
            }

            return reply.send({
                success: true,
                data: result,
                meta: {
                    matching_algorithm: 'growth-focused-rotation',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (err: any) {
            return reply.code(500).send({
                success: false,
                error: { code: 'ASSIGNMENT_FAILED', message: err.message }
            });
        }
    });
}
