-- ============================================================================
-- CHECK AND FIX PROFILE ISSUES
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Check if you have any auth users
SELECT id, email, created_at, raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if profiles exist for those users
SELECT p.id, p.full_name, p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. Check if the trigger exists
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 4. Check if the function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 5. If you're logged in but don't have a profile, create one manually
-- (Replace YOUR_USER_ID with your actual user ID from step 1)
-- UNCOMMENT AND RUN THIS IF NEEDED:
/*
INSERT INTO public.profiles (id, full_name)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
*/

-- 6. Reload schema
NOTIFY pgrst, 'reload schema';
