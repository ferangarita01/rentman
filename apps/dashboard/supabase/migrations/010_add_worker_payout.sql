-- Add worker_payout field to escrow_transactions
-- This stores the actual amount transferred to the worker after platform fee deduction

ALTER TABLE escrow_transactions 
ADD COLUMN IF NOT EXISTS worker_payout INTEGER;

COMMENT ON COLUMN escrow_transactions.worker_payout IS 'Amount actually transferred to worker (net_amount - platform_fee)';
