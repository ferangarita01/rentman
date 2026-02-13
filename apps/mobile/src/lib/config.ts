/**
 * Central Configuration for Rentman Mobile App
 * 
 * Sources of Truth:
 * 1. Environment Variables (Build Time)
 * 2. Hardcoded Fallbacks (Runtime Safety)
 */

export const config = {
  // Backend API URL
  // Falls back to the active US-East1 Cloud Run instance if env var is missing
  apiUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://rentman-backend-346436028870.us-east1.run.app',
  
  // App Info
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Rentman',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Supabase (Public)
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uoekolfgbbmvhzsfkjef.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  }
};
