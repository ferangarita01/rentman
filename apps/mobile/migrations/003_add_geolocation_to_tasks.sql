-- Migration: Add geo_location to tasks table
-- Created: 2026-02-08
-- Description: Enable precise geolocation for contract navigation

-- Add geo_location column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'geo_location'
    ) THEN
        ALTER TABLE tasks ADD COLUMN geo_location JSONB DEFAULT NULL;
    END IF;
END $$;

-- Add requester_id if not exists (for issuer tracking)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'requester_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN requester_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create index for geo queries (if we add POINT type later)
CREATE INDEX IF NOT EXISTS idx_tasks_geo_location ON tasks USING GIN (geo_location);

-- Create index for requester lookups
CREATE INDEX IF NOT EXISTS idx_tasks_requester_id ON tasks(requester_id);

-- Example of how to insert geo_location:
-- INSERT INTO tasks (title, geo_location, ...) 
-- VALUES ('Delivery Task', '{"lat": 40.7128, "lng": -74.0060}'::jsonb, ...);

-- Example query to find nearby tasks (if using PostGIS in future):
-- SELECT * FROM tasks 
-- WHERE ST_DWithin(
--   ST_MakePoint(geo_location->>'lng', geo_location->>'lat')::geography,
--   ST_MakePoint(-74.0060, 40.7128)::geography,
--   5000  -- 5km radius
-- );
