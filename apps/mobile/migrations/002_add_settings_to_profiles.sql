-- Migration: Add settings column to profiles table
-- Created: 2026-02-08
-- Description: Store user preferences and app settings

-- Add settings column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'settings'
    ) THEN
        ALTER TABLE profiles ADD COLUMN settings JSONB DEFAULT '{
            "camera_enabled": true,
            "gps_enabled": true,
            "biometrics_enabled": false,
            "offline_mode": false,
            "push_notifications": true,
            "ai_link_enabled": true,
            "neural_notifications": false,
            "auto_accept_threshold": 100
        }'::jsonb;
    END IF;
END $$;

-- Create index for faster settings queries
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON profiles USING GIN (settings);

-- Update existing profiles with default settings if they have null
UPDATE profiles 
SET settings = '{
    "camera_enabled": true,
    "gps_enabled": true,
    "biometrics_enabled": false,
    "offline_mode": false,
    "push_notifications": true,
    "ai_link_enabled": true,
    "neural_notifications": false,
    "auto_accept_threshold": 100
}'::jsonb
WHERE settings IS NULL;
