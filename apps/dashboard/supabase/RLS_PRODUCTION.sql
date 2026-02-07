-- =====================================================
-- RENTMAN RLS POLICIES - PRODUCTION READY
-- Matches API status values (lowercase 'open')
-- =====================================================

-- STEP 1: Add human_id column if not exists
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS human_id TEXT;
CREATE INDEX IF NOT EXISTS idx_tasks_human_id ON tasks(human_id);

-- STEP 2: Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop old permissive policy
DROP POLICY IF EXISTS "allow_all_tasks" ON tasks;

-- STEP 4: Create new secure policies

-- Policy 1: Anyone can view open tasks (supports both 'open' and 'OPEN')
CREATE POLICY "public_view_open_tasks"
ON tasks
FOR SELECT
USING (status = 'open' OR status = 'OPEN');

-- Policy 2: Authenticated users can view their assigned tasks
CREATE POLICY "users_view_own_tasks"
ON tasks
FOR SELECT
USING (auth.uid()::text = human_id);

-- Policy 3: Authenticated users can update their assigned tasks
CREATE POLICY "users_update_own_tasks"
ON tasks
FOR UPDATE
USING (auth.uid()::text = human_id)
WITH CHECK (auth.uid()::text = human_id);

-- STEP 5: Create updated_at trigger
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

-- =====================================================
-- VERIFY POLICIES
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'tasks';
