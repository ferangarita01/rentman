-- DIAGNÓSTICO COMPLETO DE PROFILES RLS
-- Ejecuta TODO esto de una vez en Supabase SQL Editor

-- 1. ¿Está RLS habilitado?
SELECT 
  'RLS Status' as check_type,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'profiles';

-- 2. ¿Qué políticas existen?
SELECT 
  'Existing Policies' as check_type,
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. ¿El perfil existe?
SELECT 
  'Profile Exists' as check_type,
  id,
  email,
  credits,
  status
FROM profiles 
WHERE id = '5b3b3f7e-5529-4f6f-b132-2a34dc935160';

-- 4. Test RLS como usuario autenticado (simula lo que hace la app)
-- Usa service_role para bypass RLS temporalmente
SET LOCAL role TO service_role;
SELECT 
  'Profile via Service Role' as check_type,
  *
FROM profiles 
WHERE id = '5b3b3f7e-5529-4f6f-b132-2a34dc935160';
RESET role;
