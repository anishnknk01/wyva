-- WYSA — task_applications: multi-applicant booking flow.
-- Paste into Supabase SQL Editor and click Run.
--
-- Previously, a Wysa "applying" immediately wrote their id into
-- tasks.accepted_wysa_id (first-come-first-served, no customer choice).
-- This migration adds a separate applications table so multiple workers
-- can express interest and the customer chooses who to book.
--
-- Existing tasks.accepted_wysa_id / confirmed_wysa_id columns are kept
-- untouched — they still represent the customer-chosen / confirmed Wysa.

-- ---------------------------------------------------------------------------
-- task_applications
-- ---------------------------------------------------------------------------
create table if not exists public.task_applications (
  id          uuid primary key default gen_random_uuid(),
  task_id     text not null references public.tasks (id) on delete cascade,
  wysa_id     uuid not null references public.profiles (id) on delete cascade,
  -- pending   : applied, waiting for customer decision
  -- accepted  : customer accepted this applicant
  -- rejected  : customer accepted someone else, or applicant withdrew
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'rejected')),
  message     text,                         -- optional cover note from the Wysa
  proposed_at timestamptz not null default now(),
  decided_at  timestamptz,

  unique (task_id, wysa_id)                 -- one application per Wysa per task
);

create index if not exists task_applications_task_id_idx on public.task_applications (task_id);
create index if not exists task_applications_wysa_id_idx on public.task_applications (wysa_id);

alter table public.task_applications enable row level security;

-- Wysas can see all applications for tasks they applied to (so they know if
-- they're still pending). Customers can see all applications for their tasks.
drop policy if exists "see own or task-owner applications" on public.task_applications;
create policy "see own or task-owner applications"
  on public.task_applications for select
  to authenticated
  using (
    wysa_id = auth.uid()
    or task_id in (select id from public.tasks where customer_id = auth.uid())
  );

-- Only the applicant themselves can insert their own application.
drop policy if exists "wysa inserts own application" on public.task_applications;
create policy "wysa inserts own application"
  on public.task_applications for insert
  to authenticated
  with check (wysa_id = auth.uid());

-- Only the task owner can update an application (accept / reject).
drop policy if exists "task owner updates application status" on public.task_applications;
create policy "task owner updates application status"
  on public.task_applications for update
  to authenticated
  using (task_id in (select id from public.tasks where customer_id = auth.uid()));

select 'task_applications migration applied successfully!' as result;
