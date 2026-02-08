/**
 * Agent Management Routes
 * Registration and KYA (Know Your Agent)
 */

import { FastifyInstance } from 'fastify';
import { RegisterAgentSchema, RegisterAgentInput } from '../../types/index.js';
import { supabase } from '../../services/supabase.js';
import { generateApiKey, hashApiKey } from '../../utils/crypto.js';
import logger from '../../utils/logger.js';

export async function agentRoutes(fastify: FastifyInstance) {
  /**
   * POST /v1/agents/register
   * Register a new AI agent (KYA - Know Your Agent)
   */
  fastify.post<{ Body: RegisterAgentInput }>(
    '/register',
    {
      schema: {
        description: 'Register a new AI agent in the marketplace',
        tags: ['Agents'],
        body: RegisterAgentSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  agent_id: { type: 'string' },
                  api_key: { type: 'string' },
                  created_at: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const agentData = request.body;

      logger.info({
        msg: 'Registering new agent',
        agent_name: agentData.name,
        agent_type: agentData.type,
      });

      // Create agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          name: agentData.name,
          type: agentData.type,
          public_key: agentData.public_key,
          callback_url: agentData.callback_url,
          description: agentData.description,
          is_active: true,
          permissions: agentData.permissions_requested,
        })
        .select()
        .single();

      if (agentError) {
        logger.error(agentError, 'Error creating agent');
        throw new Error('Failed to register agent');
      }

      // Generate API key
      const apiKey = generateApiKey('live');
      const keyHash = await hashApiKey(apiKey);

      // Store API key
      const { error: keyError } = await supabase
        .from('agent_api_keys')
        .insert({
          agent_id: agent.id,
          key_hash: keyHash,
          permissions: agentData.permissions_requested,
          is_active: true,
        });

      if (keyError) {
        // Rollback agent creation
        await supabase.from('agents').delete().eq('id', agent.id);
        throw new Error('Failed to generate API key');
      }

      logger.info({
        msg: 'Agent registered successfully',
        agent_id: agent.id,
      });

      return reply.status(201).send({
        success: true,
        data: {
          agent_id: agent.id,
          api_key: apiKey, // Only shown once!
          created_at: agent.created_at,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          request_id: request.id,
        },
      });
    }
  );
}
