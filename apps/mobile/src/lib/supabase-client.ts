import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Task types
export interface Task {
  id: string;
  agent_id?: string;
  title: string;
  description: string;
  task_type: string;
  required_skills?: string[];
  location_address?: string;
  budget_amount: number;
  budget_currency: string;
  payment_type: string;
  payment_status: string;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
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
      .update({ status: 'assigned' })
      .eq('id', taskId);
  }

  return { data, error };
}
