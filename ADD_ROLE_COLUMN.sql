-- Run this in your Supabase SQL Editor
-- Adds a role column to profiles: 'customer' | 'worker' | null (not yet chosen)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text
    CHECK (role IN ('customer', 'worker'));

-- Update the handle_new_user trigger to preserve role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN new.raw_user_meta_data->>'role' IN ('customer','worker')
      THEN new.raw_user_meta_data->>'role'
      ELSE NULL
    END
  );
  RETURN new;
END;
$$;
