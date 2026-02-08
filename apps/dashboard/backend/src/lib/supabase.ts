/**
 * Supabase Client - Backend (Secure Configuration)
 * All credentials MUST come from environment variables
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env before accessing process.env
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'SUPABASE_URL is required. Set it in your .env file.\n' +
    'Example: SUPABASE_URL=https://your-project.supabase.co'
  );
}

if (!supabaseKey) {
  throw new Error(
    'SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY is required. Set it in your .env file.\n' +
    'Get your key from: https://app.supabase.com/project/_/settings/api'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
