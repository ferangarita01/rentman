-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- URL Placeholder: __CLOUD_RUN_URL__
-- Secret Placeholder: __WEBHOOK_SECRET__

CREATE OR REPLACE FUNCTION public.trigger_task_webhook()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    request_id BIGINT;
BEGIN
    payload = jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
    );

    -- Send POST request to Cloud Run using pg_net
    SELECT net.http_post(
        url := 'https://rentman-backend-346436028870.us-east1.run.app/webhooks/tasks?secret=857850732870ae21ce6e8f0d4079639bb131db15df35120ad9526129716f5acb',
        body := payload,
        headers := '{"Content-Type": "application/json"}'::jsonb
    ) INTO request_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_task_created ON public.tasks;

-- Create Trigger
CREATE TRIGGER on_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.trigger_task_webhook();
