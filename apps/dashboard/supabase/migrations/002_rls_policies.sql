-- Row Level Security Policies for Tasks Table
-- This migration adds secure RLS policies for the Rentman app

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "allow_all_tasks" ON tasks;

-- 1. Public can view open tasks
CREATE POLICY "public_view_open_tasks"
ON tasks
FOR SELECT
USING (status = 'OPEN');

-- 2. Authenticated users can view their assigned tasks
CREATE POLICY "users_view_own_tasks"
ON tasks
FOR SELECT
USING (auth.uid()::text = human_id);

-- 3. Authenticated users can update their assigned tasks
CREATE POLICY "users_update_own_tasks"
ON tasks
FOR UPDATE
USING (auth.uid()::text = human_id)
WITH CHECK (auth.uid()::text = human_id);

-- 4. Service role can do everything (handled automatically by service key)
-- No explicit policy needed - service role bypasses RLS

-- Add human_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='human_id') THEN
        ALTER TABLE tasks ADD COLUMN human_id TEXT;
        CREATE INDEX idx_tasks_human_id ON tasks(human_id);
    END IF;
END $$;

-- Update trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
