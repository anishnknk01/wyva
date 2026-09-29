"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Not much a server action can do to warn the user here (no client
    // round-trip / toast from this context), but at minimum this should be
    // logged rather than fully discarded — a failed sign-out could leave
    // stale session cookies behind.
    console.error("signOut failed", error);
  }
  redirect("/");
}
