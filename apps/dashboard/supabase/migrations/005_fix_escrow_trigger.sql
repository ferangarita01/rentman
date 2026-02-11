-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FIX #1: Trigger SQL sobrescribe valores del backend
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- PROBLEMA:
--   El trigger calculate_escrow_fees() SIEMPRE recalcula los valores,
--   incluso cuando el backend los inserta explícitamente.
--   Esto causa que workers pierdan $1 por cada $100 de tarea.
--
-- SOLUCIÓN:
--   Modificar el trigger para que SOLO calcule si los campos son NULL.
--
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TRIGGER IF EXISTS trigger_calculate_escrow_fees ON escrow_transactions;
DROP FUNCTION IF EXISTS calculate_escrow_fees();

CREATE OR REPLACE FUNCTION calculate_escrow_fees()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate if NULL (allows backend to control values)
    IF NEW.platform_fee_amount IS NULL THEN
        NEW.platform_fee_amount := ROUND(NEW.gross_amount * NEW.platform_fee_percent / 100);
    END IF;
    
    IF NEW.status = 'disputed' AND NEW.dispute_fee_amount IS NULL THEN
        NEW.dispute_fee_amount := ROUND(NEW.gross_amount * NEW.dispute_fee_percent / 100);
    END IF;
    
    IF NEW.net_amount IS NULL THEN
        NEW.net_amount := NEW.gross_amount - NEW.platform_fee_amount - COALESCE(NEW.dispute_fee_amount, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_escrow_fees
    BEFORE INSERT OR UPDATE ON escrow_transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_escrow_fees();

COMMENT ON FUNCTION calculate_escrow_fees() IS 
'Calculates fees only if NULL. Backend model: worker receives 100% of budget, client pays budget + 10%.';
