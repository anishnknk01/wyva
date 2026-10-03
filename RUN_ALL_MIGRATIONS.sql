-- ============================================================
-- WYSA — Run ALL migrations at once
-- Paste this entire file into Supabase SQL Editor and click Run
-- ============================================================

-- ── STEP 1: Fix missing profile row ────────────────────────────────────────
INSERT INTO profiles (id, full_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- ── STEP 2: Add role column ─────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text
    CHECK (role IN ('customer', 'worker'));

-- ── STEP 3: Add worker profile columns to profiles ──────────────────────────
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
  ADD COLUMN IF NOT EXISTS phone_verified        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_now         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accept_emergency_tasks boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step       integer NOT NULL DEFAULT 0;

-- ── STEP 4: Worker ID auto-generation ──────────────────────────────────────
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

UPDATE profiles SET worker_id = 'WYS-' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0')
WHERE worker_id IS NULL;

-- ── STEP 5: Create all new tables ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS identity_verifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('aadhaar','pan')),
  provider          text NOT NULL DEFAULT 'manual',
  status            text NOT NULL DEFAULT 'pending',
  masked_identifier text,
  verified_name     text,
  verified_dob      date,
  provider_reference text,
  failure_reason    text,
  verified_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flat_house  text, street_area text, landmark text,
  city        text, district text,
  state       text NOT NULL DEFAULT 'Karnataka',
  country     text NOT NULL DEFAULT 'India',
  pin_code    text, latitude numeric(10,7), longitude numeric(10,7),
  is_primary  boolean NOT NULL DEFAULT true,
  verified    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_locations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city           text, area text, latitude numeric(10,7), longitude numeric(10,7),
  service_radius integer NOT NULL DEFAULT 5,
  pin_code       text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  category   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO skills (name, category) VALUES
  ('Cleaning','Home Services'),('Cooking','Home Services'),('Laundry','Home Services'),
  ('Gardening','Home Services'),('House Help','Home Services'),('Elder Care','Care'),
  ('Child Care','Care'),('Patient Assistance','Care'),('Companion Care','Care'),
  ('Grocery Delivery','Delivery & Errands'),('Parcel Pickup','Delivery & Errands'),
  ('Shopping','Delivery & Errands'),('Local Errands','Delivery & Errands'),
  ('Computer Help','Technical'),('Mobile Help','Technical'),('Wi-Fi Setup','Technical'),
  ('Device Setup','Technical'),('Event Help','Other'),('Moving Assistance','Other'),
  ('Photography','Other'),('Tutoring','Other'),('Custom Service','Other')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS worker_skills (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id          uuid REFERENCES skills(id) ON DELETE SET NULL,
  custom_skill_name text,
  experience_years  integer,
  skill_level       text,
  description       text,
  certificate_url   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_skill_or_custom CHECK (skill_id IS NOT NULL OR custom_skill_name IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS work_experience (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  occupation          text, years_experience integer, description text,
  relevant_experience text, certifications text[], education text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  available   boolean NOT NULL DEFAULT false,
  start_time  text, end_time text,
  UNIQUE(user_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS task_preferences (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_categories text[], min_payment integer, max_travel_km integer,
  preferred_hours      text, weekday_preference text, work_type text,
  remote_preference    text, emergency_preference boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS payout_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_holder_name text, masked_account text, ifsc_code text, upi_id text,
  verified            boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         text NOT NULL, relationship text, phone text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS documents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type         text NOT NULL, status text NOT NULL DEFAULT 'pending',
  storage_path     text, rejection_reason text, verified_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL, details jsonb, actor text,
  created_at timestamptz NOT NULL DEFAULT now()
);

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

-- ── STEP 6: Row-Level Security ──────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE identity_verifications   ENABLE ROW LEVEL SECURITY;
  ALTER TABLE addresses                ENABLE ROW LEVEL SECURITY;
  ALTER TABLE service_locations        ENABLE ROW LEVEL SECURITY;
  ALTER TABLE worker_skills            ENABLE ROW LEVEL SECURITY;
  ALTER TABLE work_experience          ENABLE ROW LEVEL SECURITY;
  ALTER TABLE availability             ENABLE ROW LEVEL SECURITY;
  ALTER TABLE task_preferences         ENABLE ROW LEVEL SECURITY;
  ALTER TABLE payout_accounts          ENABLE ROW LEVEL SECURITY;
  ALTER TABLE emergency_contacts       ENABLE ROW LEVEL SECURITY;
  ALTER TABLE documents                ENABLE ROW LEVEL SECURITY;
  ALTER TABLE verification_events      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE worker_onboarding_progress ENABLE ROW LEVEL SECURITY;
  ALTER TABLE skills                   ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create policies (ignore if already exist)
DO $$ BEGIN CREATE POLICY "own_identity"   ON identity_verifications   USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_address"    ON addresses                USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_svc_loc"    ON service_locations        USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_skills"     ON worker_skills            USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_experience" ON work_experience          USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_avail"      ON availability             USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_prefs"      ON task_preferences         USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_payout"     ON payout_accounts          USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_emergency"  ON emergency_contacts       USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_docs"       ON documents                USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_events"     ON verification_events      USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own_onboarding" ON worker_onboarding_progress USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "public_skills"  ON skills FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── STEP 7: Helper functions ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_profile_completion(p_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE score integer := 0; rec profiles%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM profiles WHERE id = p_user_id;
  IF rec.full_name IS NOT NULL AND rec.full_name <> '' THEN score := score + 10; END IF;
  IF rec.phone IS NOT NULL THEN score := score + 5; END IF;
  IF rec.phone_verified THEN score := score + 5; END IF;
  IF rec.email_verified THEN score := score + 10; END IF;
  IF rec.avatar_url IS NOT NULL THEN score := score + 5; END IF;
  IF rec.verification_status = 'verified' THEN score := score + 20; END IF;
  IF EXISTS (SELECT 1 FROM addresses WHERE user_id = p_user_id) THEN score := score + 10; END IF;
  IF EXISTS (SELECT 1 FROM service_locations WHERE user_id = p_user_id) THEN score := score + 5; END IF;
  IF EXISTS (SELECT 1 FROM worker_skills WHERE user_id = p_user_id) THEN score := score + 10; END IF;
  IF EXISTS (SELECT 1 FROM availability WHERE user_id = p_user_id AND available = true) THEN score := score + 5; END IF;
  IF EXISTS (SELECT 1 FROM payout_accounts WHERE user_id = p_user_id) THEN score := score + 10; END IF;
  IF EXISTS (SELECT 1 FROM emergency_contacts WHERE user_id = p_user_id) THEN score := score + 5; END IF;
  RETURN LEAST(score, 100);
END;
$$;

-- ── STEP 8: Update signup trigger to include role ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    CASE WHEN new.raw_user_meta_data->>'role' IN ('customer','worker')
         THEN new.raw_user_meta_data->>'role' ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- ── STEP 9: Tasks exact location and media columns ──────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS photos text[],
  ADD COLUMN IF NOT EXISTS location_coordinates jsonb;

-- ── STEP 10: Messages and real-time chat ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id text NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  message_text text NOT NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  image_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_task_id_idx ON public.messages (task_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages (receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages they sent or received"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP TRIGGER IF EXISTS messages_set_updated_at ON public.messages;
CREATE TRIGGER messages_set_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_user_conversations(user_id uuid)
RETURNS TABLE (
  task_id           text,
  other_user_id     uuid,
  other_user_name   text,
  other_user_avatar text,
  last_message      text,
  last_message_at   timestamptz,
  unread_count      bigint,
  task_title        text,
  task_status       text,
  conversation_id   text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest AS (
    SELECT DISTINCT ON (m.task_id,
                         LEAST(m.sender_id, m.receiver_id),
                         GREATEST(m.sender_id, m.receiver_id))
      m.task_id,
      CASE WHEN m.sender_id = user_id THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
      m.message_text AS last_message,
      m.created_at   AS last_message_at
    FROM public.messages m
    WHERE m.sender_id = user_id OR m.receiver_id = user_id
    ORDER BY m.task_id,
             LEAST(m.sender_id, m.receiver_id),
             GREATEST(m.sender_id, m.receiver_id),
             m.created_at DESC
  ),
  unread AS (
    SELECT m.task_id,
           CASE WHEN m.sender_id = user_id THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
           COUNT(*) AS cnt
    FROM public.messages m
    WHERE m.receiver_id = user_id AND m.read_at IS NULL
    GROUP BY m.task_id, other_user_id
  )
  SELECT
    l.task_id,
    l.other_user_id,
    COALESCE(p.full_name, 'Unknown') AS other_user_name,
    p.avatar_url                     AS other_user_avatar,
    l.last_message,
    l.last_message_at,
    COALESCE(u.cnt, 0)                AS unread_count,
    COALESCE(t.title, '')             AS task_title,
    COALESCE(t.status, '')            AS task_status,
    l.task_id || '-' || l.other_user_id::text AS conversation_id
  FROM latest l
  LEFT JOIN public.profiles p ON p.id = l.other_user_id
  LEFT JOIN public.tasks    t ON t.id = l.task_id
  LEFT JOIN unread          u ON u.task_id = l.task_id AND u.other_user_id = l.other_user_id
  ORDER BY l.last_message_at DESC;
END;
$$;

-- ── STEP 11: Notification preferences ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  task_updates boolean NOT NULL DEFAULT true,
  new_messages boolean NOT NULL DEFAULT true,
  payment_notifications boolean NOT NULL DEFAULT true,
  marketing_notifications boolean NOT NULL DEFAULT false,
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  quiet_hours_start text,
  quiet_hours_end text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users manage their own notification preferences"
  ON public.notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── STEP 12: Task applications (multi-applicant booking flow) ───────────────
CREATE TABLE IF NOT EXISTS public.task_applications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     text NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  wysa_id     uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'rejected')),
  message     text,
  proposed_at timestamptz NOT NULL DEFAULT now(),
  decided_at  timestamptz,
  UNIQUE (task_id, wysa_id)
);

CREATE INDEX IF NOT EXISTS task_applications_task_id_idx ON public.task_applications (task_id);
CREATE INDEX IF NOT EXISTS task_applications_wysa_id_idx ON public.task_applications (wysa_id);

ALTER TABLE public.task_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "see own or task-owner applications" ON public.task_applications;
CREATE POLICY "see own or task-owner applications"
  ON public.task_applications FOR SELECT
  TO authenticated
  USING (
    wysa_id = auth.uid()
    OR task_id IN (SELECT id FROM public.tasks WHERE customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "wysa inserts own application" ON public.task_applications;
CREATE POLICY "wysa inserts own application"
  ON public.task_applications FOR INSERT
  TO authenticated
  WITH CHECK (wysa_id = auth.uid());

DROP POLICY IF EXISTS "task owner updates application status" ON public.task_applications;
CREATE POLICY "task owner updates application status"
  ON public.task_applications FOR UPDATE
  TO authenticated
  USING (task_id IN (SELECT id FROM public.tasks WHERE customer_id = auth.uid()));

-- ── STEP 13: Push subscriptions for Web Push API ───────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text,
  auth text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions (endpoint);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own subscriptions"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── STEP 14: Helper RPC for incrementing interested_count ───────────────────
CREATE OR REPLACE FUNCTION public.increment_interested_count(task_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.tasks
  SET interested_count = COALESCE(interested_count, 0) + 1
  WHERE id = task_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_interested_count(text) TO authenticated;

-- ── DONE ────────────────────────────────────────────────────────────────────
SELECT 'All migrations applied successfully!' as result;
