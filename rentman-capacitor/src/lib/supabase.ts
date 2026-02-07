import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

// Rentman Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

// Capacitor Preferences storage adapter for session persistence
const CapacitorStorage = {
  async getItem(key: string) {
    const { value } = await Preferences.get({ key });
    console.log('📦 GET session:', key, value ? '✅' : '❌');
    return value;
  },
  async setItem(key: string, value: string) {
    console.log('📦 SET session:', key);
    await Preferences.set({ key, value });
  },
  async removeItem(key: string) {
    console.log('📦 REMOVE session:', key);
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

console.log('✅ Supabase with Capacitor persistent storage');

