-- ===================================================================
-- FIX PARA WEEKLY OVERVIEW - RLS POLICIES REPAIR
-- ===================================================================
-- Ejecutar este script en Supabase SQL Editor
-- https://app.supabase.com/project/vuqmwuwsugqcavipttgd/sql
-- ===================================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES (si existen)
DROP POLICY IF EXISTS "Users can view own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can insert own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can update own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can delete own habit logs" ON habit_logs;

-- 2. HABILITAR RLS EN LA TABLA
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICA DE SELECT (LECTURA) - LA MÁS IMPORTANTE
CREATE POLICY "Users can view own habit logs"
ON habit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. CREAR POLÍTICA DE INSERT (ESCRITURA)
CREATE POLICY "Users can insert own habit logs"
ON habit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. CREAR POLÍTICA DE UPDATE (ACTUALIZACIÓN)
CREATE POLICY "Users can update own habit logs"
ON habit_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. CREAR POLÍTICA DE DELETE (BORRADO)
CREATE POLICY "Users can delete own habit logs"
ON habit_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ===================================================================
-- VERIFICACIÓN
-- ===================================================================

-- Ver políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'habit_logs';

-- Contar registros del usuario actual
SELECT COUNT(*) as my_logs
FROM habit_logs
WHERE user_id = auth.uid();

-- Ver últimos 5 registros del usuario actual
SELECT 
  id,
  habit_id,
  user_id,
  completed_at,
  created_at
FROM habit_logs
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- ===================================================================
-- RESULTADO ESPERADO
-- ===================================================================
-- Deberías ver:
-- 1. 4 políticas creadas (SELECT, INSERT, UPDATE, DELETE)
-- 2. Conteo de tus logs (si has completado hábitos)
-- 3. Lista de tus últimos 5 completions
-- ===================================================================
