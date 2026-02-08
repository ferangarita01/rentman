-- ============================================================
-- INBOX MESSAGES TABLE SETUP
-- ============================================================
-- Execute this script in Supabase SQL Editor to enable inbox
-- functionality with real-time messaging.
-- ============================================================

-- Step 1: Check if update_updated_at_column function exists
-- This function is used by triggers to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create messages table (if not exists)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    sender_type TEXT CHECK (sender_type IN ('user', 'agent', 'system')) NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'system')),
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Step 4: Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Users can read messages for their tasks" ON messages;
DROP POLICY IF EXISTS "Users can insert messages for their tasks" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

-- Step 6: Create RLS Policies

-- Policy 1: Users can read messages for tasks they're involved in
CREATE POLICY "Users can read messages for their tasks"
ON messages FOR SELECT
USING (
    sender_id = auth.uid() OR
    task_id IN (
        SELECT id FROM tasks 
        WHERE agent_id = auth.uid() OR requester_id = auth.uid()
    )
);

-- Policy 2: Users can insert messages for their tasks
CREATE POLICY "Users can insert messages for their tasks"
ON messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    task_id IN (
        SELECT id FROM tasks 
        WHERE agent_id = auth.uid() OR requester_id = auth.uid()
    )
);

-- Policy 3: Users can update their own messages (e.g., mark as read)
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid());

-- Step 7: Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;

CREATE TRIGGER update_messages_updated_at 
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Create initial system messages for existing tasks
-- This adds a welcome message to any task that doesn't have messages yet
INSERT INTO messages (task_id, sender_id, sender_type, content, message_type)
SELECT 
    t.id,
    COALESCE(
        t.agent_id, 
        t.assigned_human_id,
        (t.metadata->>'agent_id')::uuid,
        (SELECT id FROM profiles LIMIT 1)  -- Fallback to first profile
    ) as sender_id,
    'system',
    CASE 
        WHEN t.status = 'pending' THEN 'Contract created and awaiting agent assignment.'
        WHEN t.status = 'assigned' THEN 'Agent assigned. Ready to begin.'
        WHEN t.status = 'in_progress' THEN 'Task in progress.'
        WHEN t.status = 'completed' THEN 'Task completed successfully.'
        WHEN t.status = 'open' THEN 'Contract open. Awaiting agent acceptance.'
        ELSE 'Contract initialized.'
    END,
    'system'
FROM tasks t
WHERE NOT EXISTS (
    SELECT 1 FROM messages WHERE messages.task_id = t.id
)
AND COALESCE(
    t.agent_id, 
    t.assigned_human_id,
    (t.metadata->>'agent_id')::uuid,
    (SELECT id FROM profiles LIMIT 1)
) IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify the setup:

-- 1. Check if messages table exists and has the right structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- 2. Check indexes
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'messages';

-- 3. Check RLS policies
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies
WHERE tablename = 'messages';

-- 4. Count messages
SELECT COUNT(*) as total_messages FROM messages;

-- 5. Sample messages (first 5)
SELECT 
    m.id,
    m.task_id,
    t.title as task_title,
    m.sender_type,
    m.content,
    m.created_at
FROM messages m
LEFT JOIN tasks t ON t.id = m.task_id
ORDER BY m.created_at DESC
LIMIT 5;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
-- If this script completes without errors:
-- ✅ Messages table created
-- ✅ RLS policies configured
-- ✅ Indexes created for performance
-- ✅ Triggers set up for auto-timestamps
-- ✅ Initial system messages created
-- 
-- The inbox page should now load message threads successfully!
-- ============================================================
