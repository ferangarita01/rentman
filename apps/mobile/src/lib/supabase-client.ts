import { supabase as supabaseStart } from './supabase';

export const supabase = supabaseStart;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Task types
export interface Task {
  id: string;
  agent_id?: string;
  requester_id?: string;
  assigned_human_id?: string;
  title: string;
  description: string;
  task_type: string;
  required_skills?: string[];
  location_address?: string;
  geo_location?: { lat: number; lng: number } | { latitude: number; longitude: number } | any;
  budget_amount: number;
  budget_currency: string;
  payment_type: string;
  payment_status: string;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  disputed_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  credits: number;
  is_agent: boolean;
  reputation: number;
  level: number;
  xp: number;
  status: string;
  uptime: number;
  stripe_account_id?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  camera_enabled: boolean;
  gps_enabled: boolean;
  biometrics_enabled: boolean;
  offline_mode: boolean;
  push_notifications: boolean;
  ai_link_enabled: boolean;
  neural_notifications: boolean;
  auto_accept_threshold: number;
}

export interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  message_type: 'text' | 'image' | 'location' | 'system';
  read_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: string;
  task_id: string;
  task_title: string;
  task_type: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  sender_type: string;
  task_status: string;
}

// Task functions
export async function getTasks(status = 'open') {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching tasks:', error);
  return { data: data as Task[] | null, error };
}

export async function getTaskById(id: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) console.error('Error fetching task:', error);
  return { data: data as Task | null, error };
}

// Profile functions
export async function getProfile(userId: string) {
  // Fetch from profiles (Identity)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching profile identity:', profileError);
    return { data: null, error: profileError };
  }

  // Fetch from humans (Gamification & Skills)
  const { data: human, error: humanError } = await supabase
    .from('humans')
    .select('*')
    .eq('id', userId)
    .single();

  if (humanError && humanError.code !== 'PGRST116') { // Ignore "not found" error for humans
    console.error('Error fetching human profile:', humanError);
  }

  // Merge data
  const mergedProfile: Profile = {
    ...profile,
    reputation: human?.reputation_score || profile.reputation || 0,
    level: human?.current_level === 'BEGINNER' ? 1 :
      human?.current_level === 'EASY' ? 2 :
        human?.current_level === 'MEDIUM' ? 3 :
          human?.current_level === 'HARD' ? 4 :
            human?.current_level === 'EXPERT' ? 5 : 1,
    xp: human?.total_tasks_completed || 0, // Using tasks completed as XP proxy for now
    status: human?.verification_status || profile.status || 'Unverified',
    uptime: 100.0, // Hardcoded for now
  };

  return { data: mergedProfile, error: null };
}

export async function getTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) console.error('Error fetching transactions:', error);
  return { data, error };
}

export async function acceptTask(taskId: string, userId: string) {
  const { data, error } = await supabase
    .from('task_assignments')
    .insert({
      task_id: taskId,
      user_id: userId,
      status: 'assigned',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (!error) {
    await supabase
      .from('tasks')
      .update({
        status: 'assigned',
        assigned_human_id: userId,
        assigned_at: new Date().toISOString()
      })
      .eq('id', taskId);
  }

  return { data, error };
}

// ============================================
// INBOX / MESSAGING FUNCTIONS
// ============================================

/**
 * Get all message threads for the current user
 * Returns tasks with their latest message
 */
export async function getThreads(userId: string) {
  try {
    // Get all tasks where user is involved (as agent or assigned human)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        task_type,
        status,
        agent_id,
        assigned_human_id,
        metadata
      `)
      .or(`agent_id.eq.${userId},assigned_human_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tasksError) {
      console.error('Error fetching tasks for threads:', tasksError);
      return { data: null, error: tasksError };
    }

    if (!tasks || tasks.length === 0) {
      return { data: [], error: null };
    }

    // Get latest message for each task
    const taskIds = tasks.map(t => t.id);
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false });

    // If messages table doesn't exist, still return threads with tasks
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);

      // Check if it's a "table doesn't exist" error
      const errorMessage = (messagesError as any).message || String(messagesError);
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        console.warn('Messages table does not exist. Returning threads without messages.');

        // Return threads with placeholder messages
        const threadsWithoutMessages: Thread[] = tasks.map(task => ({
          id: `contract-${task.id}`,
          task_id: task.id,
          task_title: task.title,
          task_type: task.task_type,
          last_message: 'No messages yet',
          last_message_at: new Date().toISOString(),
          unread_count: 0,
          sender_type: 'system',
          task_status: task.status
        }));

        return { data: threadsWithoutMessages, error: null };
      }

      // For other errors, return the error
      return { data: null, error: messagesError };
    }

    // Build threads with latest message and unread count
    const threads: Thread[] = tasks.map(task => {
      const taskMessages = messages?.filter(m => m.task_id === task.id) || [];
      const latestMessage = taskMessages[0];
      const unreadCount = taskMessages.filter(
        m => !m.read_at && m.sender_id !== userId
      ).length;

      return {
        id: `contract-${task.id}`,
        task_id: task.id,
        task_title: task.title,
        task_type: task.task_type,
        last_message: latestMessage?.content || 'No messages yet',
        last_message_at: latestMessage?.created_at || task.status,
        unread_count: unreadCount,
        sender_type: latestMessage?.sender_type || 'system',
        task_status: task.status
      };
    });

    return { data: threads, error: null };
  } catch (err) {
    console.error('Error in getThreads:', err);
    return { data: null, error: err };
  }
}

/**
 * Get all messages for a specific task
 */
export async function getMessages(taskId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return { data: null, error };
  }

  return { data: data as Message[], error: null };
}

/**
 * Send a new message to a task thread
 */
export async function sendMessage(
  taskId: string,
  senderId: string,
  content: string,
  messageType: 'text' | 'image' | 'location' | 'system' = 'text',
  metadata?: any
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      task_id: taskId,
      sender_id: senderId,
      sender_type: 'user',
      content,
      message_type: messageType,
      metadata: metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return { data: null, error };
  }

  return { data: data as Message, error: null };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(messageIds: string[]) {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .in('id', messageIds);

  if (error) {
    console.error('Error marking messages as read:', error);
  }

  return { error };
}

// ============================================
// SETTINGS FUNCTIONS
// ============================================

/**
 * Get user settings from profile
 */
export async function getSettings(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return { data: null, error };
  }

  const defaultSettings: UserSettings = {
    camera_enabled: true,
    gps_enabled: true,
    biometrics_enabled: false,
    offline_mode: false,
    push_notifications: true,
    ai_link_enabled: true,
    neural_notifications: false,
    auto_accept_threshold: 100
  };

  return {
    data: (data?.settings || defaultSettings) as UserSettings,
    error: null
  };
}

/**
 * Update user settings
 */
export async function updateSettings(userId: string, settings: Partial<UserSettings>) {
  // First get current settings
  const { data: currentData } = await getSettings(userId);
  const mergedSettings = { ...currentData, ...settings };

  const { data, error } = await supabase
    .from('profiles')
    .update({ settings: mergedSettings })
    .eq('id', userId)
    .select('settings')
    .single();

  if (error) {
    console.error('Error updating settings:', error);
    return { data: null, error };
  }

  return { data: data?.settings as UserSettings, error: null };
}

// ============================================
// AGENT/ISSUER PROFILE FUNCTIONS
// ============================================

/**
 * Get agent profile with completed tasks for trust score calculation
 */
export async function getAgentProfile(agentId: string) {
  // Special case: system issuer
  if (agentId === 'system') {
    return {
      data: {
        profile: {
          id: 'system',
          email: 'system@rentman.ai',
          full_name: 'RENTMAN_CORE_v2',
          avatar_url: undefined,
          credits: 0,
          is_agent: true,
          reputation: 100,
          level: 99,
          xp: 999999,
          status: 'active',
          uptime: 100
        },
        completedTasks: [],
        trustScore: 100
      },
      error: null
    };
  }

  // Get profile data
  const { data: profile, error: profileError } = await getProfile(agentId);

  // If profile doesn't exist, create a minimal one
  if (profileError || !profile) {
    console.error('Profile not found, returning minimal data:', profileError);
    return {
      data: {
        profile: {
          id: agentId,
          email: 'Unknown User',
          full_name: undefined,
          avatar_url: undefined,
          credits: 0,
          is_agent: false,
          reputation: 50,
          level: 1,
          xp: 0,
          status: 'active',
          uptime: 0
        },
        completedTasks: [],
        trustScore: 50
      },
      error: null // Return success with minimal data
    };
  }

  // Get completed tasks by this agent/user
  const { data: completedTasks, error: tasksError } = await supabase
    .from('task_assignments')
    .select(`
      id,
      task_id,
      rating,
      completed_at,
      tasks (
        id,
        title,
        task_type,
        location_address,
        payment_status
      )
    `)
    .eq('user_id', agentId)
    .eq('status', 'completed')
    .not('rating', 'is', null)
    .order('completed_at', { ascending: false });

  if (tasksError) {
    console.error('Error fetching agent tasks:', tasksError);
  }

  return {
    data: {
      profile,
      completedTasks: completedTasks || [],
      trustScore: calculateTrustScore(completedTasks || [])
    },
    error: null
  };
}

/**
 * Calculate trust score based on completed missions
 */
export function calculateTrustScore(missions: any[]): number {
  if (!missions || missions.length === 0) return 50; // Default for new agents

  // Average rating (1-5 scale) converted to 0-80 range
  const totalRating = missions.reduce((sum, m) => sum + (m.rating || 3), 0);
  const avgRating = totalRating / missions.length;
  const ratingScore = (avgRating / 5) * 80;

  // Completion bonus: up to 20 points for experience
  const completionBonus = Math.min(missions.length * 2, 20);

  // Final score capped at 100
  return Math.min(100, Math.round(ratingScore + completionBonus));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ESCROW & PROOFS SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TaskProof {
  id: string;
  task_id: string;
  human_id: string;
  proof_type: 'photo' | 'video' | 'document' | 'location' | 'text';
  title: string;
  description?: string;
  file_url?: string;
  location_data?: any;
  status: 'pending' | 'approved' | 'rejected' | 'disputed';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  ai_validation?: any;
  created_at: string;
  updated_at: string;
}

export interface EscrowTransaction {
  id: string;
  task_id: string;
  requester_id: string;
  human_id?: string;
  gross_amount: number;
  platform_fee_percent: number;
  platform_fee_amount: number;
  dispute_fee_percent: number;
  dispute_fee_amount: number;
  net_amount: number;
  status: 'held' | 'processing' | 'released' | 'refunded' | 'disputed' | 'dispute_resolved';
  stripe_payment_intent_id?: string;
  stripe_transfer_id?: string;
  held_at: string;
  released_at?: string;
  disputed_at?: string;
  resolved_at?: string;
  dispute_reason?: string;
  dispute_resolution?: string;
  dispute_winner?: 'human' | 'requester' | null;
}

/**
 * Upload proof of work for a task
 */
export async function uploadProof(
  taskId: string,
  humanId: string,
  proofType: 'photo' | 'video' | 'document' | 'location' | 'text',
  title: string,
  description?: string,
  fileUrl?: string,
  locationData?: any
) {
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rentman-backend-248563654890.us-central1.run.app';

    const response = await fetch(`${BACKEND_URL}/api/proofs/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId,
        humanId,
        proofType,
        title,
        description,
        fileUrl,
        locationData
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload proof');
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error uploading proof:', error);
    return { data: null, error };
  }
}

/**
 * Get proofs for a task
 */
export async function getTaskProofs(taskId: string) {
  const { data, error } = await supabase
    .from('task_proofs')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching proofs:', error);
    return { data: null, error };
  }

  return { data: data as TaskProof[], error: null };
}

/**
 * Review a proof (approve/reject)
 */
export async function reviewProof(
  proofId: string,
  reviewerId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
) {
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rentman-backend-248563654890.us-central1.run.app';

    const response = await fetch(`${BACKEND_URL}/api/proofs/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofId,
        reviewerId,
        action,
        rejectionReason
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to review proof');
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error reviewing proof:', error);
    return { data: null, error };
  }
}

/**
 * Get escrow status for a task
 */
export async function getEscrowStatus(taskId: string) {
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rentman-backend-248563654890.us-central1.run.app';

    const response = await fetch(`${BACKEND_URL}/api/escrow/status/${taskId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get escrow status');
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting escrow status:', error);
    return { data: null, error };
  }
}

/**
 * Release payment after approval
 */
export async function releasePayment(taskId: string, approverId: string) {
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rentman-backend-248563654890.us-central1.run.app';

    const response = await fetch(`${BACKEND_URL}/api/escrow/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, approverId })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to release payment');
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error releasing payment:', error);
    return { data: null, error };
  }
}

/**
 * Initiate dispute
 */
export async function initiateDispute(taskId: string, initiatorId: string, reason: string) {
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rentman-backend-248563654890.us-central1.run.app';

    const response = await fetch(`${BACKEND_URL}/api/escrow/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, initiatorId, reason })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to initiate dispute');
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error initiating dispute:', error);
    return { data: null, error };
  }
}

