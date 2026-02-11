-- FIX: Add INSERT policy for tasks table
-- This allows authenticated users to create tasks (contracts)

-- Policy: Authenticated users can create tasks
CREATE POLICY "authenticated_users_can_create_tasks"
ON tasks FOR INSERT
WITH CHECK (
  auth.uid() = requester_id
);

-- Explanation:
-- - Only authenticated users can insert tasks
-- - They can only create tasks where THEY are the requester
-- - This prevents users from creating tasks on behalf of others
-- - The requester_id MUST match their auth.uid()
