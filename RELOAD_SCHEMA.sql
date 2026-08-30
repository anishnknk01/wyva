-- Run this in Supabase SQL Editor to force schema reload
-- https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/sql/new

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Alternative: Check if tables exist
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'tasks', 'wysa_profiles', 'ratings', 'wysa_applications')
ORDER BY tablename;
