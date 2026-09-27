-- WYSA — messages + notification_preferences.
-- Run this once against your Supabase project (SQL Editor, or via the
-- Supabase CLI / psql using SUPABASE_DB_URL from .env.local).
--
-- Fixes two recurring "Could not find the table ... in the schema cache"
-- (PGRST205) errors seen in dev logs on /messages and /mobile/messages:
-- the app code (src/lib/message-store.ts, src/components/mobile/
-- notification-settings.tsx) has always assumed these tables exist, but
-- no migration ever created them. CREATE_MESSAGES_TABLE.sql at the repo
-- root attempted this already but has a real bug — it declares
-- `task_id UUID REFERENCES tasks(id)`, while tasks.id is actually `text`
-- (e.g. "TSK-12852", see supabase/migrations/0001_init.sql) — so running
-- it as-is would fail outright. This migration supersedes that file with
-- the corrected type and folds in notification_preferences, which never
-- had a creation script at all despite being fully typed in
-- src/lib/supabase/database.types.ts and queried by the app.

-- ---------------------------------------------------------------------------
-- messages: 1:1 chat between a task's customer and accepted Wysa.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references public.tasks (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  message_text text not null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'system')),
  image_url text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_task_id_idx on public.messages (task_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists messages_receiver_id_idx on public.messages (receiver_id);
create index if not exists messages_created_at_idx on public.messages (created_at);

alter table public.messages enable row level security;

drop policy if exists "Users can view messages they sent or received" on public.messages;
create policy "Users can view messages they sent or received"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());

drop policy if exists "Users can update their own messages" on public.messages;
create policy "Users can update their own messages"
  on public.messages for update
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- Reuses the set_updated_at() trigger function already defined in
-- 0001_init.sql for the tasks table, rather than redefining it here.
drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
  before update on public.messages
  for each row execute procedure public.set_updated_at();

-- Backs src/lib/message-store.ts getUserConversations() — see
-- FIX_MESSAGES_RPC.sql for the original standalone version of this
-- function; defined here too so a fresh database gets it in one pass.
create or replace function public.get_user_conversations(user_id uuid)
returns table (
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
language plpgsql
security definer
as $$
begin
  return query
  with latest as (
    select distinct on (m.task_id,
                         least(m.sender_id, m.receiver_id),
                         greatest(m.sender_id, m.receiver_id))
      m.task_id,
      case when m.sender_id = user_id then m.receiver_id else m.sender_id end as other_user_id,
      m.message_text as last_message,
      m.created_at   as last_message_at
    from public.messages m
    where m.sender_id = user_id or m.receiver_id = user_id
    order by m.task_id,
             least(m.sender_id, m.receiver_id),
             greatest(m.sender_id, m.receiver_id),
             m.created_at desc
  ),
  unread as (
    select m.task_id,
           case when m.sender_id = user_id then m.receiver_id else m.sender_id end as other_user_id,
           count(*) as cnt
    from public.messages m
    where m.receiver_id = user_id and m.read_at is null
    group by m.task_id, other_user_id
  )
  select
    l.task_id,
    l.other_user_id,
    coalesce(p.full_name, 'Unknown') as other_user_name,
    p.avatar_url                     as other_user_avatar,
    l.last_message,
    l.last_message_at,
    coalesce(u.cnt, 0)                as unread_count,
    coalesce(t.title, '')             as task_title,
    coalesce(t.status, '')            as task_status,
    l.task_id || '-' || l.other_user_id::text as conversation_id
  from latest l
  left join public.profiles p on p.id = l.other_user_id
  left join public.tasks    t on t.id = l.task_id
  left join unread          u on u.task_id = l.task_id and u.other_user_id = l.other_user_id
  order by l.last_message_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- notification_preferences: per-user push/email notification toggles.
-- ---------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  task_updates boolean not null default true,
  new_messages boolean not null default true,
  payment_notifications boolean not null default true,
  marketing_notifications boolean not null default false,
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  quiet_hours_start text,
  quiet_hours_end text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users manage their own notification preferences" on public.notification_preferences;
create policy "Users manage their own notification preferences"
  on public.notification_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute procedure public.set_updated_at();

select 'messages + notification_preferences migration applied successfully!' as result;
