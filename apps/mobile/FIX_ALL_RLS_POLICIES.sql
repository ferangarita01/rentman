-- ===================================================================
-- POLÍTICAS RLS COMPLETAS - TODAS LAS TABLAS
-- ===================================================================
-- Ejecutar este script en Supabase SQL Editor para CORREGIR permisos
-- ===================================================================

-- ===================================================================
-- TABLA: goals
-- ===================================================================
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===================================================================
-- TABLA: objectives
-- ===================================================================
DROP POLICY IF EXISTS "Users can view own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can insert own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can update own objectives" ON objectives;
DROP POLICY IF EXISTS "Users can delete own objectives" ON objectives;

ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own objectives" ON objectives FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own objectives" ON objectives FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own objectives" ON objectives FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own objectives" ON objectives FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===================================================================
-- TABLA: habits
-- ===================================================================
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits" ON habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===================================================================
-- TABLA: habit_logs (Faltaba en tu script original)
-- ===================================================================
DROP POLICY IF EXISTS "Users can view own logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON habit_logs;

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON habit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON habit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON habit_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON habit_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===================================================================
-- TABLA: gamification_state (CRÍTICO para "funciones de gamificación")
-- ===================================================================
DROP POLICY IF EXISTS "Users can view own gamification" ON gamification_state;
DROP POLICY IF EXISTS "Users can insert own gamification" ON gamification_state;
DROP POLICY IF EXISTS "Users can update own gamification" ON gamification_state;
DROP POLICY IF EXISTS "Users can delete own gamification" ON gamification_state;

ALTER TABLE gamification_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON gamification_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification" ON gamification_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON gamification_state FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================================================================
-- VERIFICACIÓN GENERAL
-- ===================================================================
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('goals', 'objectives', 'habits', 'habit_logs', 'gamification_state') 
ORDER BY tablename, cmd;
