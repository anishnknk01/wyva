import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/profile — fetch full worker profile data for the current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    { data: profile },
    { data: address },
    { data: serviceLocation },
    { data: workerSkills },
    { data: experience },
    { data: avail },
    { data: prefs },
    { data: payout },
    { data: emergency },
    { data: docs },
    { data: identityVerifs },
    { data: completion },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("addresses").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("service_locations").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("worker_skills").select("*, skills(name, category)").eq("user_id", user.id),
    supabase.from("work_experience").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("availability").select("*").eq("user_id", user.id),
    supabase.from("task_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("payout_accounts").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("emergency_contacts").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("documents").select("id,doc_type,status,verified_at").eq("user_id", user.id),
    supabase.from("identity_verifications").select("id,verification_type,status,masked_identifier,verified_name,verified_at").eq("user_id", user.id),
    supabase.rpc("get_profile_completion", { p_user_id: user.id }),
  ]);

  return NextResponse.json({
    profile,
    address,
    serviceLocation,
    workerSkills: workerSkills ?? [],
    experience,
    availability: avail ?? [],
    preferences: prefs,
    payout,
    emergency,
    documents: docs ?? [],
    identityVerifications: identityVerifs ?? [],
    completionScore: completion ?? 0,
    email: user.email,
  });
}

// PATCH /api/profile — update profile fields
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = ["full_name", "display_name", "date_of_birth", "gender", "bio",
    "phone", "is_available", "available_now", "accept_emergency_tasks"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const { data, error } = await supabase
    .from("profiles").update(patch).eq("id", user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log event
  await supabase.from("verification_events").insert({
    user_id: user.id, event_type: "profile_updated",
    details: { fields: Object.keys(patch) }, actor: "user",
  });

  return NextResponse.json({ profile: data });
}
