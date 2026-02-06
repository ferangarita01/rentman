-- Rentman v1 - Core Schema
-- Deploy this via Supabase Dashboard > SQL Editor

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID,
    human_id UUID,
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    task_type TEXT NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    
    location_address TEXT,
    
    budget_amount DECIMAL(10,2) NOT NULL,
    budget_currency TEXT DEFAULT 'USD',
    
    status TEXT DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (v1 simplified)
CREATE POLICY IF NOT EXISTS "allow_all_tasks" ON tasks FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
