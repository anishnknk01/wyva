/**
 * Worker Eligibility Gate
 * Robust against missing profile rows and missing migration tables.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const missing: string[] = [];
  let score = 0;

  // ── Profile row (may be null if trigger didn't fire) ─────────────────────
  let { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, phone_verified, avatar_url, date_of_birth")
    .eq("id", user.id)
    .maybeSingle();

  // Auto-create profile row if missing (defensive)
  if (!profile) {
    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "";
    await supabase.from("profiles").insert({ id: user.id, full_name: name }).select().maybeSingle();
    profile = { full_name: name, phone: null, phone_verified: false, avatar_url: null, date_of_birth: null } as any;
  }

  // ── 1. Name (20 pts) ──────────────────────────────────────────────────────
  if (profile?.full_name?.trim()) score += 20;
  else missing.push("Add your full name");

  // ── 2. Phone (10 pts) ─────────────────────────────────────────────────────
  if (profile?.phone?.trim()) score += 10;
  else missing.push("Add your phone number");

  // ── 3. Email confirmed (10 pts) ───────────────────────────────────────────
  if (user.email_confirmed_at) score += 10;
  else missing.push("Verify your email address");

  // ── 4. Photo (5 pts, optional) ────────────────────────────────────────────
  if (profile?.avatar_url) score += 5;

  // ── 5. Date of birth (5 pts, optional) ───────────────────────────────────
  if (profile?.date_of_birth) score += 5;

  // ── 6. Skills (20 pts) — new table → wysa_profiles fallback ──────────────
  let hasSkills = false;
  try {
    const { data: rows, error } = await supabase
      .from("worker_skills").select("id").eq("user_id", user.id).limit(1);
    if (!error) hasSkills = (rows?.length ?? 0) > 0;
  } catch {}

  if (!hasSkills) {
    try {
      const { data: wp } = await supabase.from("wysa_profiles")
        .select("skills, activities").eq("id", user.id).maybeSingle();
      hasSkills = (wp?.skills?.length ?? 0) > 0 || (wp?.activities?.length ?? 0) > 0;
    } catch {}
  }

  // Also check onboarding answers saved in worker_onboarding_progress
  if (!hasSkills) {
    try {
      const { data: prog } = await supabase.from("worker_onboarding_progress")
        .select("answers").eq("user_id", user.id).maybeSingle();
      hasSkills = (prog?.answers?.categories?.length ?? 0) > 0;
    } catch {}
  }

  if (hasSkills) score += 20;
  else missing.push("Add your skills or services");

  // ── 7. Location (20 pts) — new table → wysa_profiles → onboarding answers ─
  let hasLocation = false;
  try {
    const { data: loc, error } = await supabase
      .from("service_locations").select("id").eq("user_id", user.id).maybeSingle();
    if (!error) hasLocation = !!loc;
  } catch {}

  if (!hasLocation) {
    try {
      const { data: wp } = await supabase.from("wysa_profiles")
        .select("area").eq("id", user.id).maybeSingle();
      hasLocation = !!wp?.area?.trim();
    } catch {}
  }

  if (!hasLocation) {
    try {
      const { data: prog } = await supabase.from("worker_onboarding_progress")
        .select("answers").eq("user_id", user.id).maybeSingle();
      hasLocation = !!(prog?.answers?.service_location?.city);
    } catch {}
  }

  if (hasLocation) score += 20;
  else missing.push("Set your service location");

  // ── 8. Availability (10 pts) — new table → wysa_profiles → onboarding ─────
  let hasAvailability = false;
  try {
    const { data: rows, error } = await supabase
      .from("availability").select("id").eq("user_id", user.id).eq("available", true).limit(1);
    if (!error) hasAvailability = (rows?.length ?? 0) > 0;
  } catch {}

  if (!hasAvailability) {
    try {
      const { data: wp } = await supabase.from("wysa_profiles")
        .select("availability_note").eq("id", user.id).maybeSingle();
      hasAvailability = !!wp?.availability_note?.trim();
    } catch {}
  }

  if (!hasAvailability) {
    try {
      const { data: prog } = await supabase.from("worker_onboarding_progress")
        .select("answers").eq("user_id", user.id).maybeSingle();
      const avail = prog?.answers?.availability ?? [];
      hasAvailability = avail.some((a: any) => a.available);
    } catch {}
  }

  if (hasAvailability) score += 10;
  else missing.push("Set your availability");

  const canApply = missing.length === 0;

  return NextResponse.json({
    canApply,
    missing,
    completionScore: Math.min(score, 100),
  }, { headers: { "Cache-Control": "no-store" } });
}
