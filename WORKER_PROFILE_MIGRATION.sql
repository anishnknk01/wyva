-- ============================================================
-- Worker Profile & Verification System Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Extend profiles with worker-specific columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name          text,
  ADD COLUMN IF NOT EXISTS date_of_birth         date,
  ADD COLUMN IF NOT EXISTS gender                text,
  ADD COLUMN IF NOT EXISTS bio                   text,
  ADD COLUMN IF NOT EXISTS worker_id             text UNIQUE,
  ADD COLUMN IF NOT EXISTS account_status        text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS verification_status   text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS is_available          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_time_rate          numeric(5,2),
  ADD COLUMN IF NOT EXISTS cancellation_rate     numeric(5,2),
  ADD COLUMN IF NOT EXISTS email_verified        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified        boolean NOT NULL DEFAULT false;

-- Auto-generate a Worker ID for existing and new rows
CREATE OR REPLACE FUNCTION generate_worker_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.worker_id IS NULL THEN
    NEW.worker_id := 'WYS-' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_worker_id ON profiles;
CREATE TRIGGER trg_generate_worker_id
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_worker_id();

-- Backfill existing rows
UPDATE profiles
SET worker_id = 'WYS-' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0')
WHERE worker_id IS NULL;

-- 2. Identity verifications
CREATE TABLE IF NOT EXISTS identity_verifications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type   text NOT NULL,          -- 'aadhaar' | 'pan'
  provider            text NOT NULL DEFAULT 'manual', -- KYC provider name
  status              text NOT NULL DEFAULT 'pending', -- pending | verified | failed | expired
  masked_identifier   text,                  -- XXXX XXXX 1234
  verified_name       text,
  verified_dob        date,
  provider_reference  text,                  -- provider's transaction/reference ID
  failure_reason      text,
  verified_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- Security: never store raw Aadhaar, OTP, or raw auth credentials
  CONSTRAINT chk_verification_type CHECK (verification_type IN ('aadhaar', 'pan'))
);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_user
  ON identity_verifications(user_id);

-- 3. Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flat_house    text,
  street_area   text,
  landmark      text,
  city          text,
  district      text,
  state         text NOT NULL DEFAULT 'Karnataka',
  country       text NOT NULL DEFAULT 'India',
  pin_code      text,
  latitude      numeric(10,7),
  longitude     numeric(10,7),
  is_primary    boolean NOT NULL DEFAULT true,
  verified      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- 4. Service locations (public-facing approximate location)
CREATE TABLE IF NOT EXISTS service_locations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city            text,
  area            text,
  latitude        numeric(10,7),
  longitude       numeric(10,7),
  service_radius  integer NOT NULL DEFAULT 5, -- km
  pin_code        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. Skills catalog
CREATE TABLE IF NOT EXISTS skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  category    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed skills
INSERT INTO skills (name, category) VALUES
  ('Cleaning','Home Services'), ('Cooking','Home Services'),
  ('Laundry','Home Services'), ('Gardening','Home Services'),
  ('House Help','Home Services'), ('Elder Care','Care'),
  ('Child Care','Care'), ('Patient Assistance','Care'),
  ('Companion Care','Care'), ('Grocery Delivery','Delivery & Errands'),
  ('Parcel Pickup','Delivery & Errands'), ('Shopping','Delivery & Errands'),
  ('Local Errands','Delivery & Errands'), ('Computer Help','Technical'),
  ('Mobile Help','Technical'), ('Wi-Fi Setup','Technical'),
  ('Device Setup','Technical'), ('Event Help','Other'),
  ('Moving Assistance','Other'), ('Photography','Other'),
  ('Tutoring','Other'), ('Custom Service','Other')
ON CONFLICT (name) DO NOTHING;

-- 6. Worker skills (junction)
CREATE TABLE IF NOT EXISTS worker_skills (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id          uuid REFERENCES skills(id) ON DELETE SET NULL,
  custom_skill_name text,
  experience_years  integer,
  skill_level       text, -- beginner | intermediate | expert
  description       text,
  certificate_url   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_skill_or_custom CHECK (
    skill_id IS NOT NULL OR custom_skill_name IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_worker_skills_user ON worker_skills(user_id);

-- 7. Work experience
CREATE TABLE IF NOT EXISTS work_experience (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  occupation          text,
  years_experience    integer,
  description         text,
  relevant_experience text,
  certifications      text[],
  education           text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_experience_user ON work_experience(user_id);

-- 8. Weekly availability
CREATE TABLE IF NOT EXISTS availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,  -- mon|tue|wed|thu|fri|sat|sun
  available   boolean NOT NULL DEFAULT false,
  start_time  text,           -- "09:00"
  end_time    text,           -- "18:00"
  UNIQUE(user_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_availability_user ON availability(user_id);

-- extra availability flags on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS available_now          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accept_emergency_tasks boolean NOT NULL DEFAULT false;

-- 9. Task preferences
CREATE TABLE IF NOT EXISTS task_preferences (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_categories    text[],
  min_payment             integer,
  max_travel_km           integer,
  preferred_hours         text,
  weekday_preference      text,   -- weekday | weekend | both
  work_type               text,   -- full-time | part-time
  remote_preference       text,   -- remote | onsite | both
  emergency_preference    boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 10. Payout accounts (masked in app — never expose full details publicly)
CREATE TABLE IF NOT EXISTS payout_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_holder_name text,
  masked_account      text,       -- XXXX XXXX 1234
  ifsc_code           text,
  upi_id              text,
  verified            boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
  -- Full bank account number should be stored encrypted by the payout provider,
  -- never in plain text here. Store only the masked version + IFSC.
);

-- 11. Emergency contacts (private — never shown publicly)
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  relationship text,
  phone        text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 12. Documents (private storage — use signed URLs only)
CREATE TABLE IF NOT EXISTS documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type      text NOT NULL,   -- identity | pan | aadhaar | certificate | licence | other
  status        text NOT NULL DEFAULT 'pending', -- pending | verified | rejected | expired
  storage_path  text,            -- private Supabase Storage path (never a public URL)
  rejection_reason text,
  verified_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);

-- 13. Verification events audit log
CREATE TABLE IF NOT EXISTS verification_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  details     jsonb,
  actor       text,           -- 'user' | 'admin' | 'system' | 'provider'
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_events_user
  ON verification_events(user_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

-- Only the user can read/write their own profile extensions
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_identity" ON identity_verifications
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_address" ON addresses
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_service_location" ON service_locations
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_skills" ON worker_skills
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_experience" ON work_experience
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_availability" ON availability
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE task_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_preferences" ON task_preferences
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE payout_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_payout" ON payout_accounts
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_emergency" ON emergency_contacts
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_documents" ON documents
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE verification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_events" ON verification_events
  USING (user_id = auth.uid());

-- Skills catalog is public-readable
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_skills" ON skills
  FOR SELECT USING (true);

-- ============================================================
-- Helper: compute profile completion score (0–100)
-- ============================================================
CREATE OR REPLACE FUNCTION get_profile_completion(p_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  score integer := 0;
  rec   profiles%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM profiles WHERE id = p_user_id;
  IF rec.full_name   IS NOT NULL AND rec.full_name <> ''  THEN score := score + 10; END IF;
  IF rec.phone       IS NOT NULL THEN score := score + 5;  END IF;
  IF rec.phone_verified                                   THEN score := score + 5;  END IF;
  IF rec.email_verified                                   THEN score := score + 10; END IF;
  IF rec.avatar_url  IS NOT NULL                          THEN score := score + 5;  END IF;
  IF rec.verification_status = 'verified'                 THEN score := score + 20; END IF;
  IF EXISTS (SELECT 1 FROM addresses WHERE user_id = p_user_id)           THEN score := score + 10; END IF;
  IF EXISTS (SELECT 1 FROM service_locations WHERE user_id = p_user_id)   THEN score := score + 5;  END IF;
  IF EXISTS (SELECT 1 FROM worker_skills WHERE user_id = p_user_id)       THEN score := score + 10; END IF;
  IF EXISTS (SELECT 1 FROM availability WHERE user_id = p_user_id AND available = true) THEN score := score + 5; END IF;
  IF EXISTS (SELECT 1 FROM payout_accounts WHERE user_id = p_user_id)     THEN score := score + 10; END IF;
  IF EXISTS (SELECT 1 FROM emergency_contacts WHERE user_id = p_user_id)  THEN score := score + 5;  END IF;
  RETURN LEAST(score, 100);
END;
$$;
