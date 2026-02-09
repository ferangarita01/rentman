-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ESCROW & PAYMENTS SYSTEM
-- Phase 1: Database Schema
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. ESCROW TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) NOT NULL,
    requester_id UUID REFERENCES profiles(id) NOT NULL,
    human_id UUID REFERENCES profiles(id),
    
    -- Montos (en centavos)
    gross_amount INTEGER NOT NULL,
    platform_fee_percent DECIMAL(5,2) DEFAULT 10.00,
    platform_fee_amount INTEGER,
    dispute_fee_percent DECIMAL(5,2) DEFAULT 5.00,
    dispute_fee_amount INTEGER DEFAULT 0,
    net_amount INTEGER,
    
    -- Status
    status TEXT DEFAULT 'held' CHECK (status IN (
        'held', 'processing', 'released', 'refunded', 'disputed', 'dispute_resolved'
    )),
    
    -- Stripe
    stripe_payment_intent_id TEXT,
    stripe_transfer_id TEXT,
    
    -- Timestamps
    held_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    disputed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Disputa
    dispute_reason TEXT,
    dispute_resolution TEXT,
    dispute_winner TEXT CHECK (dispute_winner IN ('human', 'requester', NULL))
);

CREATE INDEX idx_escrow_task ON escrow_transactions(task_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_human ON escrow_transactions(human_id);
CREATE INDEX idx_escrow_requester ON escrow_transactions(requester_id);

-- RLS Policies for escrow_transactions
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own escrow transactions" ON escrow_transactions
    FOR SELECT USING (
        auth.uid() = requester_id OR auth.uid() = human_id
    );

-- 2. TASK PROOFS TABLE
CREATE TABLE IF NOT EXISTS task_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) NOT NULL,
    human_id UUID REFERENCES profiles(id) NOT NULL,
    
    proof_type TEXT CHECK (proof_type IN ('photo', 'video', 'document', 'location', 'text')),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    location_data JSONB,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disputed')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- AI Analysis
    ai_validation JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proofs_task ON task_proofs(task_id);
CREATE INDEX idx_proofs_status ON task_proofs(status);
CREATE INDEX idx_proofs_created ON task_proofs(created_at);

-- RLS Policies for task_proofs
ALTER TABLE task_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Human can insert own proofs" ON task_proofs
    FOR INSERT WITH CHECK (auth.uid() = human_id);

CREATE POLICY "Users can view task proofs" ON task_proofs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_proofs.task_id 
            AND (tasks.requester_id = auth.uid() OR tasks.assigned_human_id = auth.uid())
        )
    );

CREATE POLICY "Requester can update proof status" ON task_proofs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_proofs.task_id 
            AND tasks.requester_id = auth.uid()
        )
    );

-- 3. MODIFY PROFILES TABLE (Stripe Connect)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_status TEXT DEFAULT 'not_connected' 
    CHECK (stripe_connect_status IN ('not_connected', 'pending', 'connected', 'restricted'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_details JSONB;

-- 4. MODIFY TASKS TABLE (Payment Status)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES profiles(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_human_id UUID REFERENCES profiles(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'escrowed', 'released', 'refunded', 'disputed'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_payment_status ON tasks(payment_status);
CREATE INDEX IF NOT EXISTS idx_tasks_requester ON tasks(requester_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_human ON tasks(assigned_human_id);

-- 5. CREATE STORAGE BUCKET FOR PROOFS (via Supabase Dashboard manually)
-- Bucket name: task-proofs
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/*, video/*, application/pdf

-- 6. TRANSACTION TRIGGERS (Auto-calculate fees)
CREATE OR REPLACE FUNCTION calculate_escrow_fees()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate platform fee
    NEW.platform_fee_amount := ROUND(NEW.gross_amount * NEW.platform_fee_percent / 100);
    
    -- Calculate dispute fee if applicable
    IF NEW.status = 'disputed' AND NEW.dispute_fee_amount = 0 THEN
        NEW.dispute_fee_amount := ROUND(NEW.gross_amount * NEW.dispute_fee_percent / 100);
    END IF;
    
    -- Calculate net amount
    NEW.net_amount := NEW.gross_amount - NEW.platform_fee_amount - NEW.dispute_fee_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_escrow_fees
    BEFORE INSERT OR UPDATE ON escrow_transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_escrow_fees();

-- 7. AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_task_proofs_updated_at
    BEFORE UPDATE ON task_proofs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. VIEWS FOR ANALYTICS
CREATE OR REPLACE VIEW escrow_summary AS
SELECT 
    requester_id,
    human_id,
    status,
    COUNT(*) as transaction_count,
    SUM(gross_amount) as total_gross,
    SUM(platform_fee_amount) as total_fees,
    SUM(net_amount) as total_net
FROM escrow_transactions
GROUP BY requester_id, human_id, status;

-- Grant access to authenticated users
GRANT SELECT ON escrow_summary TO authenticated;

COMMENT ON TABLE escrow_transactions IS 'Manages payment escrow for task contracts';
COMMENT ON TABLE task_proofs IS 'Stores proof of work submitted by humans';
COMMENT ON COLUMN escrow_transactions.gross_amount IS 'Amount in cents before fees';
COMMENT ON COLUMN escrow_transactions.net_amount IS 'Amount human receives after fees';
