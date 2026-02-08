/**
 * Authentication Middleware
 * Validates API keys and NACL signatures
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { validateApiKey, getAgentById } from '../services/supabase.js';
import { verifyNaclSignature } from '../utils/crypto.js';
import { AuthenticationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

declare module 'fastify' {
  interface FastifyRequest {
    agent?: {
      id: string;
      type: string;
      permissions: string[];
      name: string;
    };
  }
}

/**
 * API Key Authentication
 * Validates x-api-key header
 */
export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    throw new AuthenticationError('Missing x-api-key header');
  }

  if (!apiKey.startsWith('sk_')) {
    throw new AuthenticationError('Invalid API key format');
  }

  const { valid, agentId, permissions } = await validateApiKey(apiKey);

  if (!valid || !agentId) {
    throw new AuthenticationError('Invalid or expired API key');
  }

  const agent = await getAgentById(agentId);

  if (!agent || !agent.is_active) {
    throw new AuthenticationError('Agent not found or inactive');
  }

  // Attach agent info to request
  request.agent = {
    id: agent.id,
    type: agent.type,
    permissions: permissions || [],
    name: agent.name,
  };

  logger.debug({
    msg: 'Agent authenticated',
    agent_id: agent.id,
    agent_name: agent.name,
  });
}

/**
 * NACL Signature Authentication
 * For autonomous agents with cryptographic signatures
 */
export async function authenticateNaclSignature(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const signature = request.headers['x-signature'] as string;
  const agentId = request.headers['x-agent-id'] as string;

  if (!signature || !agentId) {
    throw new AuthenticationError('Missing x-signature or x-agent-id header');
  }

  if (!signature.startsWith('nacl:')) {
    throw new AuthenticationError('Invalid signature format');
  }

  const agent = await getAgentById(agentId);

  if (!agent || !agent.is_active) {
    throw new AuthenticationError('Agent not found or inactive');
  }

  if (!agent.public_key) {
    throw new AuthenticationError('Agent does not have a public key registered');
  }

  // Create message to verify (method + url + body)
  const message = `${request.method}:${request.url}:${JSON.stringify(request.body || {})}`;
  const signatureValue = signature.replace('nacl:', '');

  const isValid = verifyNaclSignature({
    message,
    signature: signatureValue,
    publicKey: agent.public_key,
  });

  if (!isValid) {
    throw new AuthenticationError('Invalid signature');
  }

  request.agent = {
    id: agent.id,
    type: agent.type,
    permissions: agent.permissions || [],
    name: agent.name,
  };

  logger.debug({
    msg: 'Agent authenticated via NACL signature',
    agent_id: agent.id,
  });
}

/**
 * Permission Check Middleware
 * Ensures agent has required permissions
 */
export function requirePermission(...permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.agent) {
      throw new AuthenticationError('Not authenticated');
    }

    const hasAllPermissions = permissions.every((permission) =>
      request.agent!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new AuthenticationError(
        `Missing required permissions: ${permissions.join(', ')}`
      );
    }
  };
}
