-- VERIFICAR POLÍTICAS RLS DE PROFILES
-- Ejecuta esto en Supabase SQL Editor

-- 1. Ver todas las políticas de profiles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Si NO aparece ninguna política SELECT, ejecuta ESTO:
CREATE POLICY "users_can_view_own_profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 3. Verifica de nuevo después de crear
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Si las políticas existen pero el error persiste, verifica RLS está habilitado:
SELECT 
  relname,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'profiles';

-- 5. Si RLS NO está habilitado, ejecútalo:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
