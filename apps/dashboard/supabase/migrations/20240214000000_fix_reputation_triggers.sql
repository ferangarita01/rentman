
-- Migration: 011_fix_reputation_triggers.sql
-- Purpose: Add triggers to automatically update human stats (completed tasks & reputation)

-- 1. Trigger Function: Update Tasks Completed Count
CREATE OR REPLACE FUNCTION update_human_task_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- When a task is marked as COMPLETED
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        UPDATE humans 
        SET total_tasks_completed = total_tasks_completed + 1,
            updated_at = NOW()
        WHERE id = NEW.assigned_human_id;
    END IF;

    -- Optional: Decrement if status is reverted from COMPLETED (e.g. to DISPUTED)
    IF OLD.status = 'COMPLETED' AND NEW.status != 'COMPLETED' THEN
        UPDATE humans 
        SET total_tasks_completed = total_tasks_completed - 1,
            updated_at = NOW()
        WHERE id = NEW.assigned_human_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger on TASKS table
DROP TRIGGER IF EXISTS trigger_update_human_task_stats ON tasks;
CREATE TRIGGER trigger_update_human_task_stats
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_human_task_stats();


-- 3. Trigger Function: Update Reputation Score from Ratings
CREATE OR REPLACE FUNCTION sync_human_reputation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run for updates/inserts on 'human' entity types
    IF NEW.entity_type = 'human' THEN
        UPDATE humans 
        SET reputation_score = NEW.average_rating,
            updated_at = NOW()
        WHERE id = NEW.entity_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Trigger on RATING_SUMMARIES table
DROP TRIGGER IF EXISTS trigger_sync_human_reputation ON rating_summaries;
CREATE TRIGGER trigger_sync_human_reputation
AFTER INSERT OR UPDATE ON rating_summaries
FOR EACH ROW
EXECUTE FUNCTION sync_human_reputation();
