-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Supabase Webhook Configuration for Rentman Backend
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- This SQL creates a database webhook that triggers whenever a new
-- task is inserted into the 'tasks' table.
--
-- Security: Uses custom header 'x-webhook-secret' for authentication
-- 
-- IMPORTANT: Replace placeholders before running:
--   __CLOUD_RUN_URL__     = Your Cloud Run service URL
--   __WEBHOOK_SECRET__    = Your webhook secret (from Secret Manager)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_task_created ON public.tasks;
DROP FUNCTION IF EXISTS public.trigger_task_webhook();

-- Create function to send HTTP request to backend
CREATE OR REPLACE FUNCTION public.trigger_task_webhook()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    request_id BIGINT;
    webhook_url TEXT := '__CLOUD_RUN_URL__/webhooks/tasks';
    webhook_secret TEXT := '__WEBHOOK_SECRET__';
BEGIN
    -- Construct payload
    payload = jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
    );

    -- Send POST request with custom header authentication
    SELECT net.http_post(
        url := webhook_url,
        body := payload,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', webhook_secret
        )
    ) INTO request_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
CREATE TRIGGER on_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.trigger_task_webhook();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Verification Query
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Check trigger status
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_task_created';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Example Usage (Replace Placeholders)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- Before running this SQL, replace:
--
-- 1. __CLOUD_RUN_URL__
--    Example: https://rentman-backend-346436028870.us-east1.run.app
--
-- 2. __WEBHOOK_SECRET__
--    Get from: gcloud secrets versions access latest --secret=webhook-secret
--    Example: 857850732870ae21ce6e8f0d4079639bb131db15df35120ad9526129716f5acb
--
-- After deployment, your URL will look like:
--    https://[SERVICE]-[PROJECT_NUMBER].[REGION].run.app/webhooks/tasks
--
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

