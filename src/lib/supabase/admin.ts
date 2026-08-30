import "server-only";

// Admin client using the SERVICE ROLE key. This bypasses Row Level Security
// and must never be imported into any Client Component or exposed to the
// browser. Use only inside Route Handlers / Server Actions for operations
// that legitimately need to bypass RLS (e.g. Razorpay webhook handlers
// updating a task's payment status regardless of the current user).
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Using 'any' here to bypass deep generic inference issues with newer Supabase
// client libraries. Type operations explicitly where needed.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseClient<any>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
