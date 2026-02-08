/**
 * Type Definitions for Agent Gateway
 */

import { z } from 'zod';

// ============================================
// AUTHENTICATION TYPES
// ============================================

export type AuthMethod = 'api_key' | 'nacl_signature' | 'mcp';

export interface AgentIdentity {
  id: string;
  type: 'custom_gpt' | 'claude_project' | 'autonomous_bot' | 'mcp_client';
  name: string;
  verified: boolean;
  permissions: AgentPermission[];
}

export type AgentPermission = 
  | 'create_task'
  | 'read_tasks'
  | 'hire_human'
  | 'verify_proof'
  | 'manage_escrow';

// ============================================
// MARKET TYPES
// ============================================

export const CreateTaskSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20).max(2000),
  task_type: z.string(),
  required_skills: z.array(z.string()).optional(),
  location_address: z.string().optional(),
  geo_location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  budget_amount: z.number().positive().max(10000),
  budget_currency: z.string().length(3).default('USD'),
  payment_type: z.enum(['fixed', 'hourly']).default('fixed'),
  priority: z.number().int().min(1).max(5).default(3),
  proof_requirements: z.array(z.enum(['photo', 'gps', 'video', 'signature'])).default(['photo', 'gps']),
  deadline: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const HireHumanSchema = z.object({
  task_id: z.string().uuid(),
  human_id: z.string().uuid(),
  offered_amount: z.number().positive(),
  terms: z.string().optional(),
  auto_accept_threshold: z.number().min(0).max(100).optional(),
});

export type HireHumanInput = z.infer<typeof HireHumanSchema>;

// ============================================
// VERIFICATION TYPES
// ============================================

export interface VerificationProof {
  id: string;
  task_id: string;
  proof_type: 'photo' | 'gps' | 'video' | 'signature';
  proof_data: string; // URL or encrypted data
  verified_at: string;
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  metadata?: Record<string, unknown>;
}

// ============================================
// AGENT TYPES
// ============================================

export const RegisterAgentSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['custom_gpt', 'claude_project', 'autonomous_bot', 'mcp_client']),
  public_key: z.string().optional(), // For NACL signature
  callback_url: z.string().url().optional(),
  description: z.string().max(500).optional(),
  permissions_requested: z.array(z.string()),
});

export type RegisterAgentInput = z.infer<typeof RegisterAgentSchema>;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    request_id: string;
    agent_id?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// ============================================
// MCP TYPES
// ============================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolExecutionRequest {
  tool: string;
  arguments: Record<string, unknown>;
}

// ============================================
// RATE LIMIT TYPES
// ============================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // Seconds
}

// ============================================
// AUDIT TYPES
// ============================================

export interface AuditLog {
  id: string;
  agent_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  request_payload?: unknown;
  response_status: number;
  timestamp: string;
}
