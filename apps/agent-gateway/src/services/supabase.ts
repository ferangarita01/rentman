/**
 * Supabase Client Service
 * Singleton pattern for database access
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config.js';
import logger from '../utils/logger.js';
import { hashApiKey } from '../utils/crypto.js';

class SupabaseService {
  private static instance: SupabaseClient;

  static getInstance(): SupabaseClient {
    if (!SupabaseService.instance) {
      SupabaseService.instance = createClient(
        config.SUPABASE_URL,
        config.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
          db: {
            schema: 'public',
          },
        }
      );

      logger.info('✅ Supabase client initialized');
    }

    return SupabaseService.instance;
  }
}

export const supabase = SupabaseService.getInstance();

// Helper functions for common operations

export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  agentId?: string;
  permissions?: string[];
}> {
  try {
    const { data, error } = await supabase
      .from('agent_api_keys')
      .select('agent_id, permissions, is_active, expires_at')
      .eq('key_hash', hashApiKey(apiKey))
      .single();

    if (error || !data) {
      return { valid: false };
    }

    if (!data.is_active) {
      return { valid: false };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false };
    }

    return {
      valid: true,
      agentId: data.agent_id,
      permissions: data.permissions || [],
    };
  } catch (error) {
    logger.error(error, 'Error validating API key');
    return { valid: false };
  }
}

export async function getAgentById(agentId: string) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (error) {
    logger.error(error, 'Error fetching agent');
    return null;
  }

  return data;
}

export async function logAuditEvent(log: {
  agent_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  request_payload?: unknown;
  response_status: number;
}) {
  try {
    await supabase.from('agent_audit_logs').insert({
      ...log,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(error, 'Error logging audit event');
  }
}

// Simple hash function for API keys
// Local hashApiKey removed in favor of utils/crypto.ts import
