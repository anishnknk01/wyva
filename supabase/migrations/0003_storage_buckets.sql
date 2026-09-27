-- WYSA — storage buckets + RLS policies for task photos and avatars.
-- Run this once against your Supabase project (SQL Editor).
--
-- Context: task photo uploads were failing with "StorageApiError: Bucket
-- not found" — neither `task-photos` nor `avatars` existed as storage
-- buckets at all (confirmed via the Storage API: GET /storage/v1/bucket
-- returned an empty list). The buckets themselves have already been
-- created for you via the Storage REST API (that part doesn't require a
-- direct Postgres connection, unlike RLS policies below, which do).
--
-- This migration is idempotent — safe to run even if the buckets already
-- exist, and uses `drop policy if exists` before each `create policy` so
-- re-running it doesn't error on "policy already exists".

-- ---------------------------------------------------------------------------
-- Buckets (no-op if already created — kept here so a fresh project only
-- needs to run migrations, not also hit the Storage API by hand).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('task-photos', 'task-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- task-photos: customer uploads photos when creating a task; anyone can
-- view them (public marketplace listings); only the task's own customer
-- can delete them.
-- ---------------------------------------------------------------------------
drop policy if exists "Allow authenticated users to upload task photos" on storage.objects;
create policy "Allow authenticated users to upload task photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'task-photos');

drop policy if exists "Allow public read access to task photos" on storage.objects;
create policy "Allow public read access to task photos"
  on storage.objects for select
  using (bucket_id = 'task-photos');

drop policy if exists "Allow task owners to delete their photos" on storage.objects;
create policy "Allow task owners to delete their photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'task-photos'
    and (storage.foldername(name))[1] in (
      select id from public.tasks where customer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- avatars: every user manages their own avatar. All three upload call
-- sites (worker-profile.tsx, worker/onboarding/page.tsx,
-- profile-header.tsx) do `.from("avatars").upload(\`avatars/${userId}.ext\`)`
-- — since .from("avatars") already selects the bucket, the object's actual
-- key *inside* that bucket is "avatars/{userId}.{ext}" (yes, a redundant
-- nested "avatars/" folder within the "avatars" bucket — that's the
-- existing convention, matched here rather than "fixed" so this migration
-- doesn't require touching three unrelated call sites or invalidating
-- already-uploaded avatar URLs). So the filename (without extension) is
-- what must match auth.uid(), not the folder segment.
-- ---------------------------------------------------------------------------
drop policy if exists "Allow public read access to avatars" on storage.objects;
create policy "Allow public read access to avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(storage.filename(name), '.', 1) = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(storage.filename(name), '.', 1) = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(storage.filename(name), '.', 1) = auth.uid()::text
  );

select 'Storage buckets + policies applied successfully!' as result;
