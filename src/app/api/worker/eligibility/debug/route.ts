/**
 * Debug endpoint — shows exactly what the eligibility check sees.
 * Remove this in production.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results: Record<string, any> = { user_id: user.id, email: user.email, email_confirmed: user.email_confirmed_at };

  const { data: profile } = await supabase.from("profiles")
    .select("full_name, phone, phone_verified, email_verified, avatar_url, date_of_birth, verification_status")
    .eq("id", user.id).maybeSingle();
  results.profile = profile;

  const { data: s, error: sErr } = await supabase.from("worker_skills").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  results.worker_skills = { count: (s as any)?.count, error: sErr?.message };

  const { data: l, error: lErr } = await supabase.from("service_locations").select("id").eq("user_id", user.id).maybeSingle();
  results.service_location = { found: !!l, error: lErr?.message };

  const { data: a, error: aErr } = await supabase.from("availability").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("available", true);
  results.availability = { count: (a as any)?.count, error: aErr?.message };

  const { data: wp } = await supabase.from("wysa_profiles").select("area, skills, activities, availability_note").eq("id", user.id).maybeSingle();
  results.wysa_profile = wp;

  const { data: iv, error: ivErr } = await supabase.from("identity_verifications").select("status").eq("user_id", user.id).limit(1);
  results.identity_verifications = { data: iv, error: ivErr?.message };

  return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
}
