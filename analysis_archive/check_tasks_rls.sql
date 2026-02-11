-- RLS Policies Check for tasks table
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'tasks'
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. List all RLS policies for tasks table
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
WHERE tablename = 'tasks' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 3. Check foreign key constraints
SELECT
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='tasks';

-- 4. Check if there's an INSERT policy
SELECT EXISTS (
  SELECT 1 
  FROM pg_policies 
  WHERE tablename = 'tasks' 
  AND cmd = 'INSERT'
) as has_insert_policy;
