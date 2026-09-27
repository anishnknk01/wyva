# Migrations

Run these against your Supabase project **in order**, via the SQL Editor
(or `psql "$SUPABASE_DB_URL" -f supabase/migrations/000X_name.sql`).

| File | What it does |
|---|---|
| `0001_init.sql` | Core schema: `profiles`, `wysa_profiles`, `tasks`, `ratings`, `wysa_applications`. |
| `0002_messages_and_notifications.sql` | `messages` table + `get_user_conversations` RPC, `notification_preferences` table. |

Everything else these depend on (role column, worker profile columns,
photos/location columns on `tasks`, RLS fixes, etc.) currently lives in
one-off `.sql` files at the repo root — see the note below.

## Repo-root `.sql` files

The files scattered at the repo root (`ADD_*.sql`, `FIX_*.sql`,
`CREATE_*.sql`, `RUN_ALL_MIGRATIONS.sql`, etc.) are ad-hoc migrations that
predate this folder. They are **not tracked anywhere as "applied" or
"pending"** — that's exactly how the app has repeatedly broken in
production/dev: a feature ships assuming a column or table exists, but
the migration that creates it was never actually run against the real
database, and the failure only surfaces later as a cryptic
`PGRST204`/`PGRST205` error deep in a save handler.

Two of these root files are now formally retired (kept for history, do
not run them):

- `CREATE_MESSAGES_TABLE.sql` — had a type bug (`task_id UUID` when
  `tasks.id` is `text`). Superseded by `0002_messages_and_notifications.sql`.
- `FIX_MESSAGES_RPC.sql` — depended on a `messages` table it never
  created. Superseded by `0002_messages_and_notifications.sql`.
- `CREATE_RATINGS_SYSTEM.sql` — defines a **different, incompatible**
  `ratings` schema than the one actually in use (`0001_init.sql` +
  `src/lib/task-store.ts`). Marked dead — do not run.

The rest (`ADD_PHOTOS_COLUMN.sql`, `ADD_LOCATION_COORDINATES.sql`,
`ADD_EXACT_LOCATION_COLUMNS.sql`, `ADD_ROLE_COLUMN.sql`,
`WORKER_PROFILE_MIGRATION.sql`, `WORKER_ONBOARDING_MIGRATION.sql`,
`RUN_ALL_MIGRATIONS.sql`, `FIX_PROFILES_RLS.sql`, `FIX_MISSING_PROFILE.sql`,
`CREATE_PUSH_SUBSCRIPTIONS_TABLE.sql`) are still the source of truth for
what they do — they just haven't been moved into this numbered folder
yet. If you're setting up a fresh database, run `0001_init.sql` and
`0002_messages_and_notifications.sql` from here first, then work through
the root-level files in roughly the order their filenames suggest
(`ADD_ROLE_COLUMN` → `WORKER_PROFILE_MIGRATION` →
`WORKER_ONBOARDING_MIGRATION` → `ADD_PHOTOS_COLUMN` →
`ADD_LOCATION_COORDINATES` → `ADD_EXACT_LOCATION_COLUMNS` →
`FIX_PROFILES_RLS`).

**Before shipping a feature that reads/writes a new table or column,
run `npm run check:schema` (see root `package.json`) against your
Supabase project first.** It fails loudly and tells you exactly which
migration to run, instead of the feature silently breaking for users.
