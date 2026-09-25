-- Run this in Supabase SQL Editor to fix missing profile rows
-- and ensure all migrations are applied

-- 1. Create profile rows for any auth users that are missing one
-- (the signup trigger may not have fired for existing accounts)
INSERT INTO profiles (id, full_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 2. Run this AFTER the above if you haven't run WORKER_PROFILE_MIGRATION.sql yet:
-- (paste contents of WORKER_PROFILE_MIGRATION.sql here)
-- (paste contents of ADD_ROLE_COLUMN.sql here)

-- 3. Set your account as a worker
UPDATE profiles 
SET role = 'worker'
WHERE id = '180394d8-fc4c-46f9-ab82-fe8bc2ece5c1';
