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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) console.error('Error fetching profile:', error);
  return { data: data as Profile | null, error };
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
