import { FastifyInstance } from 'fastify';
import { supabase } from '../lib/supabase.js';

interface AcceptBidBody {
    task_id: string;
    human_id: string;
    proposed_rate?: number;
}

export async function bidRoutes(fastify: FastifyInstance) {

    // POST /v1/market/bid - Accept or counter a task
    fastify.post<{ Body: AcceptBidBody }>('/bid', {
        schema: {
            description: 'Accept a task or submit a counter-offer',
            tags: ['Bids'],
            body: {
                type: 'object',
                required: ['task_id', 'human_id'],
                properties: {
                    task_id: { type: 'string', format: 'uuid' },
                    human_id: { type: 'string' },
                    proposed_rate: { type: 'number', description: 'Counter-offer amount (optional)' }
                }
            },
            response: {
                200: {
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
        const { task_id, human_id, proposed_rate } = request.body;

        try {
            // Check if task is still available
            const { data: existingTask, error: fetchError } = await supabase
                .from('tasks')
                .select('status, budget_amount')
                .eq('id', task_id)
                .single();

            if (fetchError || !existingTask) {
                return reply.code(404).send({
                    success: false,
                    error: { code: 'TASK_NOT_FOUND', message: 'Task does not exist' },
                    meta: { request_id: requestId, timestamp: new Date().toISOString(), version: 'v1' }
                });
            }

            if (existingTask.status !== 'OPEN') {
                return reply.code(409).send({
                    success: false,
                    error: { code: 'TASK_UNAVAILABLE', message: 'Task is no longer available' },
                    meta: { request_id: requestId, timestamp: new Date().toISOString(), version: 'v1' }
                });
            }

            // If counter-offer, just notify (for now, direct accept)
            if (proposed_rate && proposed_rate !== existingTask.budget_amount) {
                // In v2, we'd create a bid record and notify the agent
                // For now, treat as negotiation request
                return reply.send({
                    success: true,
                    data: {
                        action: 'COUNTER_SUBMITTED',
                        original_amount: existingTask.budget_amount,
                        proposed_amount: proposed_rate,
                        task_id,
                        human_id
                    },
                    meta: { request_id: requestId, timestamp: new Date().toISOString(), version: 'v1' }
                });
            }

            // Direct accept - update task
            const { data: updatedTask, error: updateError } = await supabase
                .from('tasks')
                .update({
                    status: 'ASSIGNED',
                    human_id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', task_id)
                .select()
                .single();

            if (updateError) throw updateError;

            return reply.send({
                success: true,
                data: {
                    action: 'ACCEPTED',
                    task: updatedTask
                },
                meta: { request_id: requestId, timestamp: new Date().toISOString(), version: 'v1' }
            });
        } catch (err: any) {
            return reply.code(500).send({
                success: false,
                error: { code: 'BID_FAILED', message: err.message },
                meta: { request_id: requestId, timestamp: new Date().toISOString(), version: 'v1' }
            });
        }
    });
}
