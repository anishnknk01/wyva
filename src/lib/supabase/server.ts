// Supabase client for use in Server Components, Route Handlers, and Server
// Actions. Reads/writes auth cookies via Next.js's cookies() API.
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Using 'any' here to bypass deep generic inference issues with newer Supabase
// client libraries. Type operations explicitly where needed.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore since
            // middleware handles refreshing the session cookie.
          }
        },
      },
    }
  );
}
