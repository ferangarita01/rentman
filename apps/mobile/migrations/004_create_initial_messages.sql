-- ============================================================
-- QUICK FIX: Create Initial Messages for Existing Tasks
-- ============================================================
-- Run this in Supabase SQL Editor to populate inbox
-- ============================================================

-- Create initial system messages for all tasks
INSERT INTO messages (task_id, sender_id, sender_type, content, message_type)
SELECT 
    t.id,
    COALESCE(
        t.agent_id, 
        t.assigned_human_id,
        (t.metadata->>'agent_id')::uuid,
        '5b3b3f7e-5529-4f6f-b132-2a34dc935160'::uuid  -- Fallback to first profile ID
    ) as sender_id,
    'system',
    CASE 
        WHEN t.status = 'pending' THEN 'Contract created and awaiting agent assignment.'
        WHEN t.status = 'assigned' THEN 'Agent assigned. Ready to begin.'
        WHEN t.status = 'in_progress' THEN 'Task in progress.'
        WHEN t.status = 'completed' THEN 'Task completed successfully.'
        WHEN t.status = 'open' THEN 'Contract open. Awaiting agent acceptance.'
        ELSE 'Contract initialized.'
    END as content,
    'system'
FROM tasks t
WHERE NOT EXISTS (
    SELECT 1 FROM messages WHERE messages.task_id = t.id
);

-- Verify messages were created
SELECT COUNT(*) as total_messages FROM messages;

-- Show created messages
SELECT 
    m.id,
    t.title as task_title,
    m.content,
    m.sender_type,
    m.created_at
FROM messages m
JOIN tasks t ON t.id = m.task_id
ORDER BY m.created_at DESC;
