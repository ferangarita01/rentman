import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vuqmwuwsugqcavipttgd.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cW13dXdzdWdxY2F2aXB0dGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNzc5ODMsImV4cCI6MjA4MTc1Mzk4M30.UaenSnnOSzz7mTSCwt6tqXMzad-MtQQFZXYtJA-iAVA';

export const supabase = createClient(supabaseUrl, supabaseKey);

