import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase.js';

interface CreateTaskBody {
    title: string;
    description: string;
    task_type: string;
    budget_amount: number;
    location_address?: string;
    required_skills?: string[];
}

export async function taskRoutes(fastify: FastifyInstance) {

    // POST /v1/market/tasks - Create a new task
    fastify.post<{ Body: CreateTaskBody }>('/tasks', {
        schema: {
            description: 'Create a new task for humans to complete',
            tags: ['Tasks'],
            body: {
                type: 'object',
                required: ['title', 'description', 'task_type', 'budget_amount'],
                properties: {
                    title: { type: 'string', maxLength: 200 },
                    description: { type: 'string' },
                    task_type: {
                        type: 'string',
                        enum: ['delivery', 'verification', 'repair', 'representation', 'creative', 'communication']
                    },
                    budget_amount: { type: 'number', minimum: 1 },
                    location_address: { type: 'string' },
                    required_skills: { type: 'array', items: { type: 'string' } }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                        meta: { type: 'object' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const requestId = crypto.randomUUID();

        try {
            const { title, description, task_type, budget_amount, location_address, required_skills } = request.body;

            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    title,
                    description,
                    task_type,
                    budget_amount,
                    location_address,
                    required_skills: required_skills || [],
                    status: 'open'
                })
                .select()
                .single();

            if (error) throw error;

            return reply.code(201).send({
                success: true,
                data,
                meta: {
                    request_id: requestId,
                    timestamp: new Date().toISOString(),
                    version: 'v1'
                }
            });
        } catch (err: any) {
            return reply.code(500).send({
                success: false,
                error: { code: 'CREATE_FAILED', message: err.message },
                meta: { request_id: requestId, timestamp: new Date().toISOString(), version: 'v1' }
            });
        }
    });

    // GET /v1/market/tasks - List available tasks
    fastify.get('/tasks', {
        schema: {
            description: 'List all available tasks',
            tags: ['Tasks'],
            querystring: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['open', 'assigned', 'in_progress', 'completed'] },
                    limit: { type: 'integer', default: 20 }
                }
            }
        }
    }, async (request: FastifyRequest<{ Querystring: { status?: string; limit?: number } }>, reply) => {
        const requestId = crypto.randomUUID();
        const { status = 'open', limit = 20 } = request.query;

        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return reply.send({
                success: true,
                data,
                meta: {
                    request_id: requestId,
                    timestamp: new Date().toISOString(),
                    version: 'v1',
                    count: data.length
                }
            });
        } catch (err: any) {
            return reply.code(500).send({
                success: false,
                error: { code: 'FETCH_FAILED', message: err.message },
                meta: { request_id: requestId, timestamp: new Date().toISOString(), version: 'v1' }
            });
        }
    });

    // GET /v1/market/tasks/:id - Get task by ID
    fastify.get<{ Params: { id: string } }>('/tasks/:id', {
        schema: {
            description: 'Get task details by ID',
            tags: ['Tasks'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            }
        }
    }, async (request, reply) => {
        const requestId = crypto.randomUUID();
        const { id } = request.params;

        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return reply.send({
                success: true,
                data,
                meta: { request_id: requestId, timestamp: new Date().toISOString(), version: 'v1' }
            });
        } catch (err: any) {
            return reply.code(404).send({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Task not found' },
                meta: { request_id: requestId, timestamp: new Date().toISOString(), version: 'v1' }
            });
        }
    });
}
