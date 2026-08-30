"use client";

// Supabase client for use in Client Components (browser).
import { createBrowserClient } from "@supabase/ssr";

// Using 'any' here to bypass deep generic inference issues with newer Supabase
// client libraries. Type operations explicitly where needed.
export function createClient() {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
