/**
 * Supabase Client - Secure Configuration
 * All credentials MUST come from environment variables
 */

import { createClient } from '@supabase/supabase-js';

// Strict environment variable requirement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation: Fail fast if credentials missing
if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL is required. Please set it in your .env file.\n' +
    'Example: VITE_SUPABASE_URL=https://your-project.supabase.co'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is required. Please set it in your .env file.\n' +
    'Get your anon key from: https://app.supabase.com/project/_/settings/api'
  );
}

// Create singleton client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
