/**
 * Market Routes - Humans Search
 * Find and evaluate human operators
 */

import { FastifyInstance } from 'fastify';
import { supabase } from '../../services/supabase.js';
import { authenticateApiKey, requirePermission } from '../../middleware/auth.js';
import { rateLimitByAgent } from '../../middleware/rateLimit.js';
import { auditLog } from '../../middleware/audit.js';

export async function marketHumansRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateApiKey);
  fastify.addHook('preHandler', rateLimitByAgent());
  fastify.addHook('preHandler', auditLog);

  /**
   * GET /v1/market/humans
   * Search for human operators
   */
  fastify.get(
    '/humans',
    {
      schema: {
        description: 'Search for qualified human operators',
        tags: ['Market'],
        querystring: {
          type: 'object',
          properties: {
            skills: { type: 'array', items: { type: 'string' } },
            min_reputation: { type: 'number', minimum: 0, maximum: 100 },
            min_level: { type: 'number', minimum: 1 },
            location: { type: 'string' },
            radius_km: { type: 'number', default: 50 },
            available: { type: 'boolean', default: true },
            page: { type: 'number', default: 1 },
            per_page: { type: 'number', default: 20 },
          },
        },
      },
      preHandler: requirePermission('read_tasks'),
    },
    async (request, reply) => {
      const {
        skills,
        min_reputation = 0,
        min_level = 1,
        _location,
        _radius_km = 50,
        available = true,
        page = 1,
        per_page = 20,
      } = request.query as any;

      let query = supabase
        .from('human_profiles')
        .select('*', { count: 'exact' })
        .gte('reputation_score', min_reputation)
        .gte('level', min_level);

      if (available) {
        query = query.eq('is_available', true);
      }

      if (skills && skills.length > 0) {
        query = query.contains('skills', skills);
      }

      const { data: humans, error, count } = await query
        .order('reputation_score', { ascending: false })
        .range((page - 1) * per_page, page * per_page - 1);

      if (error) {
        throw new Error('Failed to search humans');
      }

      return reply.send({
        success: true,
        data: humans,
        pagination: {
          page,
          per_page,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / per_page),
        },
      });
    }
  );

  /**
   * GET /v1/market/humans/:id/reputation
   * Check human reputation
   */
  fastify.get<{ Params: { id: string } }>(
    '/humans/:id/reputation',
    {
      schema: {
        description: 'Get detailed reputation info for a human operator',
        tags: ['Market'],
      },
      preHandler: requirePermission('read_tasks'),
    },
    async (request, reply) => {
      const { id } = request.params;

      const { data: profile, error } = await supabase
        .from('human_profiles')
        .select('reputation_score, level, tasks_completed, success_rate, badges')
        .eq('id', id)
        .single();

      if (error || !profile) {
        throw new Error('Human profile not found');
      }

      return reply.send({
        success: true,
        data: {
          reputation_score: profile.reputation_score,
          level: profile.level,
          tasks_completed: profile.tasks_completed,
          success_rate: profile.success_rate,
          badges: profile.badges,
        },
      });
    }
  );
}
