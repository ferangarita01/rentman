-- Migration: Add messages table for inbox functionality
-- Created: 2026-02-08
-- Description: Enables real-time messaging between users and tasks

-- Create messages table
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

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read messages for tasks they're involved in
CREATE POLICY "Users can read messages for their tasks"
ON messages FOR SELECT
USING (
    sender_id = auth.uid() OR
    task_id IN (
        SELECT id FROM tasks 
        WHERE agent_id = auth.uid() OR requester_id = auth.uid()
    )
);

-- RLS Policy: Users can insert messages for their tasks
CREATE POLICY "Users can insert messages for their tasks"
ON messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    task_id IN (
        SELECT id FROM tasks 
        WHERE agent_id = auth.uid() OR requester_id = auth.uid()
    )
);

-- RLS Policy: Users can update their own messages (mark as read)
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid());

-- Create trigger to update updated_at
CREATE TRIGGER update_messages_updated_at 
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create system messages for existing tasks
INSERT INTO messages (task_id, sender_id, sender_type, content, message_type)
SELECT 
    id,
    requester_id,
    'system',
    'Contract created and awaiting agent assignment.',
    'system'
FROM tasks
WHERE NOT EXISTS (
    SELECT 1 FROM messages WHERE messages.task_id = tasks.id
);
