-- Check RLS policies for profiles table
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on profiles
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'profiles'
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. List all RLS policies for profiles table
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
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 3. Test if user can read their own profile
-- Replace USER_ID with: 5b3b3f7e-5529-4f6f-b132-2a34dc935160
SELECT * FROM profiles WHERE id = '5b3b3f7e-5529-4f6f-b132-2a34dc935160';

-- 4. Create missing SELECT policy if needed
-- ONLY RUN THIS IF NO SELECT POLICY EXISTS:
CREATE POLICY "users_can_view_own_profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
