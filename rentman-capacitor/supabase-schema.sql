-- RENTMAN - SQL Schema for missing tables
-- Run this in Supabase SQL Editor

-- 1. Task Assignments Table (cuando un usuario acepta un contrato)
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  proof_images TEXT[], -- URLs de fotos de prueba
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para task_assignments
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments(status);

-- 2. Transactions Table (earnings, pagos, bonos)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES task_assignments(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earning', 'withdrawal', 'bonus', 'penalty', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Índices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_task_id ON transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- 3. Withdrawals Table (retiros de fondos)
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  method TEXT CHECK (method IN ('bank', 'paypal', 'crypto', 'stripe')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  bank_details JSONB, -- Información bancaria encriptada
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Índices para withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- 4. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_assignments_updated_at BEFORE UPDATE ON task_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- TASK_ASSIGNMENTS POLICIES
-- Users can view their own assignments
CREATE POLICY "Users can view own assignments" ON task_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create assignments (accept tasks)
CREATE POLICY "Users can create assignments" ON task_assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own assignments
CREATE POLICY "Users can update own assignments" ON task_assignments
  FOR UPDATE USING (auth.uid() = user_id);

-- TRANSACTIONS POLICIES
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert transactions (will need service role for this)
CREATE POLICY "System can create transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- WITHDRAWALS POLICIES
-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create withdrawal requests
CREATE POLICY "Users can create withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own withdrawal requests
CREATE POLICY "Users can update own withdrawals" ON withdrawals
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Function to calculate user balance
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_earnings DECIMAL(10,2);
  total_withdrawals DECIMAL(10,2);
BEGIN
  -- Sum all completed earnings
  SELECT COALESCE(SUM(amount), 0) INTO total_earnings
  FROM transactions
  WHERE user_id = p_user_id 
    AND type IN ('earning', 'bonus') 
    AND status = 'completed';
  
  -- Sum all completed withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO total_withdrawals
  FROM transactions
  WHERE user_id = p_user_id 
    AND type = 'withdrawal' 
    AND status = 'completed';
  
  RETURN total_earnings - total_withdrawals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to create transaction when task is completed
CREATE OR REPLACE FUNCTION create_task_completion_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get task budget
    INSERT INTO transactions (user_id, task_id, assignment_id, type, amount, currency, status, description)
    SELECT 
      NEW.user_id,
      NEW.task_id,
      NEW.id,
      'earning',
      t.budget_amount,
      t.budget_currency,
      'completed',
      'Task completed: ' || t.title
    FROM tasks t
    WHERE t.id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_completion_transaction 
AFTER UPDATE ON task_assignments
FOR EACH ROW 
EXECUTE FUNCTION create_task_completion_transaction();

-- 8. Insert sample data (optional - for testing)
-- Uncomment to add test transactions
/*
INSERT INTO transactions (user_id, type, amount, currency, status, description) 
SELECT id, 'earning', 150.00, 'USD', 'completed', 'Welcome bonus'
FROM profiles LIMIT 1;
*/

-- Verification queries
SELECT 'task_assignments' as table_name, COUNT(*) as count FROM task_assignments
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'withdrawals', COUNT(*) FROM withdrawals;
