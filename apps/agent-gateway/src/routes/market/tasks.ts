/**
 * Market Routes - Tasks Management
 * Endpoints for AI agents to create and manage tasks
 */

import { FastifyInstance } from 'fastify';
import { CreateTaskSchema, HireHumanSchema, CreateTaskInput, HireHumanInput } from '../../types/index.js';
import { supabase } from '../../services/supabase.js';
import { EscrowService } from '../../services/stripe.js';
import { authenticateApiKey, requirePermission } from '../../middleware/auth.js';
import { rateLimitByAgent } from '../../middleware/rateLimit.js';
import { auditLog } from '../../middleware/audit.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import { NotificationService } from '../../services/notification.js';

export async function marketTasksRoutes(fastify: FastifyInstance) {
  // Prehandlers for all market routes
  fastify.addHook('preHandler', authenticateApiKey);
  fastify.addHook('preHandler', rateLimitByAgent({ max: 50, windowMs: 60000 }));
  fastify.addHook('preHandler', auditLog);

  /**
   * POST /v1/market/tasks
   * Create a new task
   */
  fastify.post<{ Body: CreateTaskInput }>(
    '/tasks',
    {
      schema: {
        description: 'Create a new task for human operators',
        tags: ['Market'],
        body: CreateTaskSchema,
        response: {
          201: {
            description: 'Task created successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  task_id: { type: 'string' },
                  status: { type: 'string' },
                  created_at: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: requirePermission('create_task'),
    },
    async (request, reply) => {
      const taskData = request.body;
      const agentId = request.agent!.id;

      logger.info({
        msg: 'Creating task',
        agent_id: agentId,
        task_type: taskData.task_type,
      });

      // Validate budget
      if (taskData.budget_amount > 10000) {
        throw new ValidationError('Budget exceeds maximum allowed ($10,000)');
      }

      // Create task in database
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          agent_id: agentId,
          title: taskData.title,
          description: taskData.description,
          task_type: taskData.task_type,
          required_skills: taskData.required_skills,
          location_address: taskData.location_address,
          geo_location: taskData.geo_location
            ? `POINT(${taskData.geo_location.lng} ${taskData.geo_location.lat})`
            : null,
          budget_amount: taskData.budget_amount,
          budget_currency: taskData.budget_currency,
          payment_type: taskData.payment_type,
          priority: taskData.priority,
          proof_requirements: taskData.proof_requirements,
          deadline: taskData.deadline,
          metadata: taskData.metadata,
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        logger.error(error, 'Error creating task');
        throw new Error('Failed to create task');
      }

      // Create escrow if payment required
      if (taskData.budget_amount > 0) {
        try {
          const escrow = await EscrowService.createEscrow({
            agentId,
            taskId: task.id,
            amount: taskData.budget_amount,
            currency: taskData.budget_currency,
            description: `Escrow for task: ${taskData.title}`,
          });

          // Update task with escrow info
          await supabase
            .from('tasks')
            .update({ escrow_payment_intent_id: escrow.paymentIntentId })
            .eq('id', task.id);

          logger.info({
            msg: 'Escrow created',
            task_id: task.id,
            escrow_id: escrow.paymentIntentId,
          });
        } catch (error) {
          logger.error(error, 'Error creating escrow');
          // Rollback task creation
          await supabase.from('tasks').delete().eq('id', task.id);
          throw error;
        }
      }

      return reply.status(201).send({
        success: true,
        data: {
          task_id: task.id,
          status: task.status,
          created_at: task.created_at,
          escrow_required: taskData.budget_amount > 0,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: request.id,
          agent_id: agentId,
        },
      });
    }
  );

  /**
   * GET /v1/market/tasks
   * List available tasks
   */
  fastify.get(
    '/tasks',
    {
      schema: {
        description: 'List available tasks in the marketplace',
        tags: ['Market'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['open', 'in_progress', 'completed', 'cancelled'] },
            task_type: { type: 'string' },
            min_budget: { type: 'number' },
            max_budget: { type: 'number' },
            page: { type: 'number', default: 1 },
            per_page: { type: 'number', default: 20, maximum: 100 },
          },
        },
      },
      preHandler: requirePermission('read_tasks'),
    },
    async (request, reply) => {
      const { status, task_type, min_budget, max_budget, page = 1, per_page = 20 } = request.query as {
        status?: string;
        task_type?: string;
        min_budget?: number;
        max_budget?: number;
        page?: number;
        per_page?: number;
      };

      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * per_page, page * per_page - 1);

      if (status) query = query.eq('status', status);
      if (task_type) query = query.eq('task_type', task_type);
      if (min_budget) query = query.gte('budget_amount', min_budget);
      if (max_budget) query = query.lte('budget_amount', max_budget);

      const { data: tasks, error, count } = await query;

      if (error) {
        logger.error(error, 'Error fetching tasks');
        throw new Error('Failed to fetch tasks');
      }

      return reply.send({
        success: true,
        data: tasks,
        pagination: {
          page,
          per_page,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / per_page),
        },
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: request.id,
          agent_id: request.agent!.id,
        },
      });
    }
  );

  /**
   * GET /v1/market/tasks/:id
   * Get task details
   */
  fastify.get<{ Params: { id: string } }>(
    '/tasks/:id',
    {
      schema: {
        description: 'Get task details by ID',
        tags: ['Market'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
      },
      preHandler: requirePermission('read_tasks'),
    },
    async (request, reply) => {
      const { id } = request.params;

      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !task) {
        throw new NotFoundError(`Task ${id} not found`);
      }

      return reply.send({
        success: true,
        data: task,
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: request.id,
          agent_id: request.agent!.id,
        },
      });
    }
  );

  /**
   * POST /v1/market/hire
   * Hire a human for a task
   */
  fastify.post<{ Body: HireHumanInput }>(
    '/hire',
    {
      schema: {
        description: 'Hire a human operator for a task',
        tags: ['Market'],
        body: HireHumanSchema,
      },
      preHandler: requirePermission('hire_human'),
    },
    async (request, reply) => {
      const { task_id, human_id, offered_amount, terms } = request.body;
      const agentId = request.agent!.id;

      // Verify task belongs to this agent
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', task_id)
        .eq('agent_id', agentId)
        .single();

      if (taskError || !task) {
        throw new NotFoundError('Task not found or does not belong to this agent');
      }

      if (task.status !== 'open') {
        throw new ValidationError('Task is not open for hire');
      }

      // Create contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          task_id,
          human_id,
          agent_id: agentId,
          offered_amount,
          terms,
          status: 'pending',
        })
        .select()
        .single();

      if (contractError) {
        logger.error(contractError, 'Error creating contract');
        throw new Error('Failed to create contract');
      }

      // Update task status
      await supabase
        .from('tasks')
        .update({ status: 'pending_acceptance' })
        .eq('id', task_id);

      // Update task status
      await supabase
        .from('tasks')
        .update({ status: 'pending_acceptance' })
        .eq('id', task_id);

      // Notify human about contract offer
      const { data: humanProfile } = await supabase
        .from('humans')
        .select('auth_user_id')
        .eq('id', human_id)
        .single();

      if (humanProfile?.auth_user_id) {
        await NotificationService.send({
          userId: humanProfile.auth_user_id,
          type: 'hire_offer',
          title: 'New Contract Offer',
          message: `You have received an offer of ${offered_amount} for a new task.`,
          data: {
            contractId: contract.id,
            taskId: task_id,
            offerAmount: offered_amount
          }
        });
      }

      return reply.status(201).send({
        success: true,
        data: {
          contract_id: contract.id,
          status: contract.status,
          created_at: contract.created_at,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: request.id,
          agent_id: agentId,
        },
      });
    }
  );
}
