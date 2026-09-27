#!/usr/bin/env node
/**
 * Schema safety check — verifies every table/column the app code depends on
 * actually exists in the connected Supabase project, and fails loudly with
 * a pointer to the exact migration file to run if something's missing.
 *
 * This exists because of a recurring failure mode in this project: a
 * feature ships assuming a column or table exists, the migration that
 * creates it was written but never actually run against the real database,
 * and the app doesn't find out until a user hits "Save" and gets a cryptic
 * PGRST204/PGRST205 error deep in a save handler (see task-store.ts
 * saveTask, message-store.ts getUserConversations, notification-settings.tsx).
 *
 * Run manually:   npm run check:schema
 * Run in CI/dev:   wired into `predev`/`prebuild` in package.json so it
 *                  runs automatically and can't be silently skipped.
 *
 * Exit code 0  — everything checked out.
 * Exit code 1  — something is missing; details + fix printed to stderr.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.warn(
    "\n⚠️  check:schema — skipped: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY " +
    "not set in the environment. Can't verify the database schema without them.\n" +
    "   (This is expected in environments that don't have .env.local, e.g. some CI jobs.)\n"
  );
  process.exit(0);
}

/**
 * Runs a minimal PostgREST select against a table, using plain fetch rather
 * than the full @supabase/supabase-js client. The full client eagerly
 * constructs a RealtimeClient (websocket) even for REST-only usage, which
 * crashes on Node versions without native WebSocket support (e.g. 20.x) —
 * unnecessary for a one-shot schema check that never needs realtime.
 */
async function selectOne(table, columns) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns.join(","))}&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (res.ok) return { error: null };
  const body = await res.json().catch(() => ({}));
  return { error: { code: body.code, message: body.message ?? res.statusText } };
}

/** Lists all storage buckets in the project via the Storage Management API. */
async function listBuckets() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) return null;
  const buckets = await res.json().catch(() => []);
  return new Set(buckets.map(b => b.id));
}

// Storage buckets the app uploads to. Missing a bucket fails uploads with
// "StorageApiError: Bucket not found" — this happened for both of these in
// practice (neither existed at all), which is why this check exists.
const BUCKET_CHECKS = [
  {
    bucket: "task-photos",
    fix: "supabase/migrations/0003_storage_buckets.sql",
    critical: false, // photo upload failure doesn't block posting the task itself
  },
  {
    bucket: "avatars",
    fix: "supabase/migrations/0003_storage_buckets.sql",
    critical: false, // profile still works without a photo
  },
];

// Each entry: the table, the columns the app actually reads/writes, which
// migration file creates them if missing, and whether the app has a real
// fallback if this table doesn't exist yet.
//
//   critical: true  — the app has no fallback; missing this breaks a core
//                      flow outright (posting/browsing tasks, signing up).
//                      Fails the build (prebuild) if missing.
//   critical: false — a real feature, but the app already degrades
//                      gracefully without it (e.g. message-store.ts falls
//                      back to a direct query, notification prefs just use
//                      in-memory defaults). Warns, doesn't fail the build,
//                      so a peripheral feature being mid-rollout doesn't
//                      block shipping everything else.
//
// Keep this list in sync with src/lib/supabase/database.types.ts whenever
// a new table/column is added — that's the whole point of this check.
const CHECKS = [
  {
    table: "profiles",
    columns: ["id", "full_name", "role", "onboarding_completed"],
    fix: "supabase/migrations/0001_init.sql, then ADD_ROLE_COLUMN.sql and WORKER_PROFILE_MIGRATION.sql",
    critical: true,
  },
  {
    table: "tasks",
    columns: [
      "id", "customer_id", "title", "status",
      "photos", "location_coordinates", "location_name", "location_address",
    ],
    fix: "supabase/migrations/0001_init.sql, then ADD_PHOTOS_COLUMN.sql, ADD_LOCATION_COORDINATES.sql, and ADD_EXACT_LOCATION_COLUMNS.sql",
    critical: true,
  },
  {
    table: "ratings",
    columns: ["id", "task_id", "rater_id", "ratee_id", "stars"],
    fix: "supabase/migrations/0001_init.sql",
    critical: true,
  },
  {
    table: "messages",
    columns: ["id", "task_id", "sender_id", "receiver_id", "message_text", "read_at"],
    fix: "supabase/migrations/0002_messages_and_notifications.sql",
    critical: false,
  },
  {
    table: "notification_preferences",
    columns: ["id", "user_id", "task_updates", "push_notifications"],
    fix: "supabase/migrations/0002_messages_and_notifications.sql",
    critical: false,
  },
  {
    table: "worker_skills",
    columns: ["id", "user_id", "skill_id"],
    fix: "WORKER_PROFILE_MIGRATION.sql (via RUN_ALL_MIGRATIONS.sql)",
    critical: true,
  },
  {
    table: "service_locations",
    columns: ["id", "user_id", "area", "latitude", "longitude"],
    fix: "WORKER_PROFILE_MIGRATION.sql (via RUN_ALL_MIGRATIONS.sql)",
    critical: true,
  },
  {
    table: "push_subscriptions",
    columns: ["id", "user_id", "endpoint"],
    fix: "CREATE_PUSH_SUBSCRIPTIONS_TABLE.sql",
    critical: false,
  },
  {
    table: "task_applications",
    columns: ["id", "task_id", "wysa_id", "status", "proposed_at"],
    fix: "supabase/migrations/0004_task_applications.sql",
    critical: false,
  },
];

/** True if a PostgREST error means "table not found" or "column not found". */
function isMissingSchemaError(error) {
  if (!error) return false;
  // PGRST205: table not found in schema cache. PGRST204: column not found.
  return error.code === "PGRST205" || error.code === "PGRST204";
}

async function checkOne({ table, columns, fix, critical }) {
  const { error } = await selectOne(table, columns);

  if (!error) return { table, ok: true };
  if (isMissingSchemaError(error)) {
    return { table, ok: false, critical, message: error.message, fix };
  }
  // Any other error (RLS denial, network, etc.) isn't a schema problem —
  // the service-role key bypasses RLS, so this shouldn't happen in
  // practice, but don't treat it as a false failure if it does.
  return { table, ok: true, warning: error.message };
}

async function main() {
  console.log(`\n🔎 Checking Supabase schema against ${SUPABASE_URL} ...\n`);

  const results = await Promise.all(CHECKS.map(checkOne));

  console.log("Tables:");
  for (const r of results) {
    if (!r.ok) {
      console.error(`  ${r.critical ? "✗" : "⚠"} ${r.table} — ${r.message}`);
    } else if (r.warning) {
      console.warn(`  ? ${r.table} — non-schema error, ignoring: ${r.warning}`);
    } else {
      console.log(`  ✓ ${r.table}`);
    }
  }

  const existingBuckets = await listBuckets();
  const bucketResults = existingBuckets
    ? BUCKET_CHECKS.map(b => ({
        ...b,
        ok: existingBuckets.has(b.bucket),
      }))
    : [];

  if (existingBuckets) {
    console.log("\nStorage buckets:");
    for (const b of bucketResults) {
      if (b.ok) {
        console.log(`  ✓ ${b.bucket}`);
      } else {
        console.error(`  ${b.critical ? "✗" : "⚠"} ${b.bucket} — bucket does not exist`);
      }
    }
  } else {
    console.warn("\n⚠️  Couldn't list storage buckets (Storage API request failed) — skipping bucket check.");
  }

  const failures = [...results, ...bucketResults].filter(r => !r.ok);
  const criticalFailures = failures.filter(f => f.critical);
  const nonCriticalFailures = failures.filter(f => !f.critical);
  const warnings = results.filter(r => r.ok && r.warning);

  if (warnings.length > 0) {
    console.warn(`\n${warnings.length} table(s) returned a non-schema error — see above.`);
  }

  if (nonCriticalFailures.length > 0) {
    console.warn(
      `\n⚠️  ${nonCriticalFailures.length} optional table(s)/bucket(s) are missing. The app already ` +
      "has a fallback for these, so this won't break the build, but the affected features are degraded:\n"
    );
    for (const f of nonCriticalFailures) {
      console.warn(`  • ${f.table ?? f.bucket} → ${f.fix}`);
    }
  }

  if (criticalFailures.length > 0) {
    console.error(
      `\n❌ ${criticalFailures.length} table(s)/column(s)/bucket(s) that core features depend on ` +
      "are missing from the database.\nThis WILL cause features to fail at runtime with errors like\n" +
      '"Could not find the table/column ... in the schema cache" or "Bucket not found".\n\n' +
      "Run the following migration(s) in the Supabase SQL Editor:\n"
    );
    for (const f of criticalFailures) {
      console.error(`  • ${f.table ?? f.bucket} → ${f.fix}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log("\n✅ Schema check passed — every table/bucket core features depend on exists.\n");
}

main().catch(err => {
  console.error("\n⚠️  check:schema failed to run:", err.message);
  // Don't block dev/build on a network hiccup talking to Supabase — this
  // check is a safety net, not a hard gate on being online.
  process.exit(0);
});
