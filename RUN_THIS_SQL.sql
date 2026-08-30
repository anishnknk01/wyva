-- ============================================================================
-- COPY EVERYTHING BELOW THIS LINE AND RUN IT IN SUPABASE
-- ============================================================================

-- Step 1: Go to this URL:
-- https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/sql/new

-- Step 2: Copy EVERYTHING from line 9 onwards (all the SQL below)

-- Step 3: Paste it into the Supabase SQL Editor

-- Step 4: Click the RUN button (or press Cmd+Enter)

-- ============================================================================

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  is_wysa boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create wysa_profiles table
create table if not exists public.wysa_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  area text not null default '',
  bio text not null default '',
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  activities text[] not null default '{}',
  skills text[] not null default '{}',
  price_per_hour integer not null default 0,
  verified boolean not null default false,
  rating numeric(3, 2) not null default 0,
  sessions_count integer not null default 0,
  availability_note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.wysa_profiles enable row level security;

create policy "Wysa profiles are viewable by any authenticated user"
  on public.wysa_profiles for select
  to authenticated
  using (true);

create policy "Users manage their own Wysa profile"
  on public.wysa_profiles for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create tasks table (THE MOST IMPORTANT ONE!)
create table if not exists public.tasks (
  id text primary key,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null default '',
  area text not null default '',
  location_note text not null default '',
  task_date date,
  task_time time,
  duration_id text not null default '1',
  custom_hours numeric not null default 1,
  budget integer not null default 0,
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  platform_fee integer not null default 50,
  total integer not null default 0,
  payment_method text,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text not null default 'draft',
  interested_count integer not null default 0,
  accepted_wysa_id uuid references public.profiles (id) on delete set null,
  confirmed_wysa_id uuid references public.profiles (id) on delete set null,
  dispute_reason text,
  dispute_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_customer_id_idx on public.tasks (customer_id);
create index if not exists tasks_accepted_wysa_id_idx on public.tasks (accepted_wysa_id);

alter table public.tasks enable row level security;

create policy "Tasks are viewable by any authenticated user"
  on public.tasks for select
  to authenticated
  using (true);

create policy "Customers can insert their own tasks"
  on public.tasks for insert
  to authenticated
  with check (auth.uid() = customer_id);

create policy "Customer or accepted Wysa can update a task"
  on public.tasks for update
  to authenticated
  using (
    auth.uid() = customer_id
    or auth.uid() = accepted_wysa_id
    or status = 'waiting_for_wysa'
  )
  with check (
    auth.uid() = customer_id
    or auth.uid() = accepted_wysa_id
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- Create ratings table
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references public.tasks (id) on delete cascade,
  rater_id uuid not null references public.profiles (id) on delete cascade,
  ratee_id uuid not null references public.profiles (id) on delete cascade,
  stars smallint not null check (stars >= 1 and stars <= 5),
  review text not null default '',
  created_at timestamptz not null default now(),
  unique (task_id, rater_id)
);

alter table public.ratings enable row level security;

create policy "Ratings are viewable by any authenticated user"
  on public.ratings for select
  to authenticated
  using (true);

create policy "Users can insert their own ratings"
  on public.ratings for insert
  to authenticated
  with check (auth.uid() = rater_id);

-- Create wysa_applications table
create table if not exists public.wysa_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  preferred_name text,
  age integer not null,
  area text not null,
  phone text not null,
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  activities text[] not null default '{}',
  intro text not null,
  hourly_rate integer,
  availability text,
  photo_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.wysa_applications enable row level security;

create policy "Users can view their own applications"
  on public.wysa_applications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Authenticated users can submit an application"
  on public.wysa_applications for insert
  to authenticated
  with check (auth.uid() = user_id);
