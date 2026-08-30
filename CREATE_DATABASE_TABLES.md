# 🚨 URGENT: Create Database Tables

## The Problem

Your app is trying to save tasks, but the database tables don't exist yet!

**Error:** `"Could not find the table 'public.tasks' in the schema cache"`

## The Solution (2 minutes)

You need to run the SQL migration file to create all the database tables.

---

## Option 1: Using Supabase Dashboard (Easiest)

### Step 1: Open SQL Editor
Visit: https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/sql/new

### Step 2: Copy the Migration SQL
Open this file on your computer:
```
/Users/anish/veller/supabase/migrations/0001_init.sql
```

**Or copy this content:**

```sql
-- WYSA marketplace schema.
-- Run this once against your Supabase project (SQL Editor, or via the
-- Supabase CLI / psql using SUPABASE_DB_URL from .env.local).

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user (customer and/or Wysa).
-- ---------------------------------------------------------------------------
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

-- Auto-create a profile row whenever a new auth user signs up.
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

-- ---------------------------------------------------------------------------
-- wysa_profiles: extra public marketplace info for users who are Wysas.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- tasks: the core marketplace entity.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- ratings: customer <-> Wysa ratings after a task is paid out.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- wysa_applications: "Become a Wysa" application form submissions.
-- ---------------------------------------------------------------------------
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
```

### Step 3: Paste and Run
1. Paste the entire SQL into the Supabase SQL Editor
2. Click **RUN** (or press Cmd+Enter)
3. Wait for "Success. No rows returned"

### Step 4: Verify Tables Created
Go to: https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/editor

You should see these tables:
- ✅ profiles
- ✅ wysa_profiles  
- ✅ tasks
- ✅ ratings
- ✅ wysa_applications

---

## Option 2: Using Supabase CLI (If You Have It)

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref bcsylldvbwgmzevrjnfa

# Run migrations
supabase db push
```

---

## After Running the Migration

### ✅ Test Your App

1. **Refresh your browser** at http://localhost:3000
2. **Log in** (or sign up if you haven't)
3. **Go to Create Task**: http://localhost:3000/create-task
4. **Fill out the form** and click "Review your task"
5. **Click "Continue to payment"**
6. **You should see the payment page!** ✅

The error "Couldn't post your task" should be gone!

---

## What This Creates

### Tables:
- **profiles** - User accounts (auto-created on signup)
- **wysa_profiles** - Companion profiles for Wysas
- **tasks** - All task postings and bookings
- **ratings** - Reviews after task completion
- **wysa_applications** - Applications to become a Wysa

### Security:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only modify their own data
- ✅ Public browsing for marketplace listings
- ✅ Automatic profile creation on signup

### Features:
- ✅ Auto-update timestamps
- ✅ Foreign key constraints
- ✅ Database indexes for performance
- ✅ Triggers for data consistency

---

## Troubleshooting

### "Function does not exist" error
- Make sure you're running the SQL in the **SQL Editor**
- Don't use the Table Editor - it can't create functions

### "Permission denied" error
- You need to be the project owner
- Check you're logged into the correct Supabase account

### Tables created but still getting errors
- Hard refresh your browser (Cmd+Shift+R)
- Clear browser cache
- Restart your dev server: `npm run dev`

### Need to start over?
To drop all tables and re-run:
```sql
drop table if exists public.wysa_applications cascade;
drop table if exists public.ratings cascade;
drop table if exists public.tasks cascade;
drop table if exists public.wysa_profiles cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user cascade;
drop function if exists public.set_updated_at cascade;
```

Then re-run the migration SQL above.

---

## ⚡ Quick Link

**Run SQL Now:** https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/sql/new

Copy the migration SQL above, paste it there, and click RUN!
