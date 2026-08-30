-- ============================================================================
-- FIX ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase SQL Editor if you see permission errors
-- ============================================================================

-- This grants service role access to bypass RLS for testing
-- Your app should work with RLS enabled, but this helps diagnose issues

-- Check current RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'tasks', 'wysa_profiles', 'ratings', 'wysa_applications');

-- Reload the API schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Grant necessary permissions (if missing)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Refresh schema again
NOTIFY pgrst, 'reload schema';
