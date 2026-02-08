import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

// Rentman Supabase Configuration - STRICT mode (no fallbacks)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Check .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Capacitor Preferences storage adapter for session persistence
const CapacitorStorage = {
  async getItem(key: string) {
    const { value } = await Preferences.get({ key });
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 GET session:', key, value ? '✅' : '❌');
    }
    return value;
  },
  async setItem(key: string, value: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 SET session:', key);
    }
    await Preferences.set({ key, value });
  },
  async removeItem(key: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 REMOVE session:', key);
    }
    await Preferences.remove({ key });
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: CapacitorStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase with Capacitor persistent storage');
}

