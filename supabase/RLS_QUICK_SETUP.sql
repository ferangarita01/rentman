-- =====================================================
-- RENTMAN RLS POLICIES - QUICK REFERENCE
-- Copy and paste into Supabase SQL Editor
-- =====================================================

-- STEP 1: Add human_id column if not exists
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS human_id TEXT;
CREATE INDEX IF NOT EXISTS idx_tasks_human_id ON tasks(human_id);

-- STEP 2: Enable RLS (should already be enabled)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop old permissive policy
DROP POLICY IF EXISTS "allow_all_tasks" ON tasks;

-- STEP 4: Create new secure policies

-- Policy 1: Anyone can view open tasks
CREATE POLICY "public_view_open_tasks"
ON tasks
FOR SELECT
USING (status = 'open');

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
-- TESTING QUERIES
-- =====================================================

-- Test 1: View all open tasks (should work without auth)
SELECT * FROM tasks WHERE status = 'OPEN';

-- Test 2: Try to view assigned task without auth (should return nothing)
SELECT * FROM tasks WHERE status = 'ASSIGNED';

-- Test 3: Update task as authenticated user (replace with real user ID)
-- UPDATE tasks SET status = 'IN_PROGRESS' WHERE id = '<task-id>' AND human_id = auth.uid()::text;

-- =====================================================
-- VERIFY POLICIES
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tasks';
