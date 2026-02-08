/**
 * Supabase Client - Secure Configuration
 * All credentials MUST come from environment variables
 */

import { createClient } from '@supabase/supabase-js';

// Strict environment variable requirement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation: Warn instead of crash to allow Landing page to load
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'CRITICAL: Supabase credentials missing! Check .env file.\n' +
    'Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY'
  );
}

// Fallback to prevent crash (app will load but auth will fail)
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder';

// Create singleton client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(safeUrl, safeKey);
