/**
 * Worker Onboarding Progress API
 *
 * GET  — fetch saved progress (step + answers) for resuming
 * POST — save progress after each step
 * PUT  — mark onboarding complete
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("worker_onboarding_progress")
    .select("step, answers, completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ progress: data ?? { step: 0, answers: {}, completed_at: null } });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { step, answers } = await request.json();

  // Upsert progress row
  const { error } = await supabase
    .from("worker_onboarding_progress")
    .upsert({
      user_id: user.id,
      step,
      answers,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also persist individual fields to profiles so other pages can read them directly
  const profilePatch: Record<string, unknown> = {};
  if (answers.full_name)     profilePatch.full_name      = answers.full_name;
  if (answers.date_of_birth) profilePatch.date_of_birth  = answers.date_of_birth;
  if (answers.phone)         profilePatch.phone          = answers.phone;
  if (answers.bio)           profilePatch.bio            = answers.bio;
  if (answers.avatar_url)    profilePatch.avatar_url     = answers.avatar_url;
  if (answers.is_available !== undefined) profilePatch.is_available = answers.is_available;
  if (answers.available_now !== undefined) profilePatch.available_now = answers.available_now;

  if (Object.keys(profilePatch).length > 0) {
    await supabase.from("profiles").update(profilePatch).eq("id", user.id);
  }

  // Persist service location
  if (answers.service_location) {
    const sl = answers.service_location;
    await supabase.from("service_locations").upsert({
      user_id: user.id,
      city: sl.city,
      area: sl.area,
      latitude: sl.latitude,
      longitude: sl.longitude,
      service_radius: sl.service_radius ?? 5,
      pin_code: sl.pin_code,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  // Persist availability
  if (answers.availability && Array.isArray(answers.availability)) {
    const rows = answers.availability.map((a: any) => ({
      user_id: user.id,
      day_of_week: a.day_of_week,
      available: a.available,
      start_time: a.start_time ?? null,
      end_time: a.end_time ?? null,
    }));
    await supabase
      .from("availability")
      .upsert(rows, { onConflict: "user_id,day_of_week" });
  }

  // Persist skills/categories
  if (answers.categories && Array.isArray(answers.categories)) {
    // Remove old onboarding skills, re-insert
    await supabase.from("worker_skills").delete().eq("user_id", user.id);
    const skillRows = answers.categories.map((cat: string) => ({
      user_id: user.id,
      custom_skill_name: cat,
    }));
    await supabase.from("worker_skills").insert(skillRows);
  }

  return NextResponse.json({ success: true });
}

export async function PUT() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("worker_onboarding_progress")
    .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
