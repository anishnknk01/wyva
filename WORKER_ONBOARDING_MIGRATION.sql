-- Run in Supabase SQL Editor
-- Adds onboarding tracking to the worker profile system

-- 1. Flag on profiles to track whether onboarding has been completed
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step        integer NOT NULL DEFAULT 0;

-- 2. Persist onboarding progress so returning users resume where they left off
CREATE TABLE IF NOT EXISTS worker_onboarding_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step         integer NOT NULL DEFAULT 0,
  answers      jsonb  NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE worker_onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_onboarding" ON worker_onboarding_progress
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Computed eligibility function (server-side gate — never trust frontend)
--    Returns a JSON object with canApply (bool) + missing items array.
CREATE OR REPLACE FUNCTION check_worker_eligibility(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  prof       profiles%ROWTYPE;
  missing    text[] := '{}';
  can_apply  boolean;
BEGIN
  SELECT * INTO prof FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('canApply', false, 'missing', ARRAY['Profile not found']);
  END IF;

  IF prof.full_name IS NULL OR prof.full_name = '' THEN
    missing := missing || 'Full name';
  END IF;
  IF prof.phone IS NULL OR prof.phone = '' THEN
    missing := missing || 'Phone number';
  END IF;
  IF NOT prof.phone_verified THEN
    missing := missing || 'Phone verification';
  END IF;
  IF NOT prof.email_verified THEN
    missing := missing || 'Email verification';
  END IF;
  IF prof.avatar_url IS NULL OR prof.avatar_url = '' THEN
    missing := missing || 'Profile photo';
  END IF;
  IF prof.date_of_birth IS NULL THEN
    missing := missing || 'Date of birth';
  END IF;
  IF prof.verification_status != 'verified' THEN
    missing := missing || 'Identity verification';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM worker_skills WHERE user_id = p_user_id) THEN
    missing := missing || 'At least one skill/service category';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM service_locations WHERE user_id = p_user_id) THEN
    missing := missing || 'Service location';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM availability WHERE user_id = p_user_id AND available = true) THEN
    missing := missing || 'Availability schedule';
  END IF;

  can_apply := array_length(missing, 1) IS NULL;

  RETURN jsonb_build_object(
    'canApply', can_apply,
    'missing', missing,
    'completionScore', get_profile_completion(p_user_id)
  );
END;
$$;
