import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env before accessing process.env
config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseKey) {
    console.warn('⚠️ No Supabase key found. Set SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
