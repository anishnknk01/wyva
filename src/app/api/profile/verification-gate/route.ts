/**
 * Verification Gate
 *
 * Server-side check — can this user apply for or accept tasks?
 * The backend enforces this; disabling buttons on the frontend is NOT sufficient.
 *
 * Required for VERIFIED status:
 *   ✓ Phone on file
 *   ✓ Email verified (via Supabase auth)
 *   ✓ Identity verification passed (from identity_verifications table)
 *   ✓ Profile photo uploaded
 *   ✓ Address saved
 *   ✓ Service location saved
 *   ✓ At least one skill added
 *   ✓ At least one available day set
 *   ✓ Payout account saved
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type VerificationGateResult = {
  canApply: boolean;
  missingSteps: string[];
  completionScore: number;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const missing: string[] = [];

  const [
    { data: profile },
    { data: address },
    { data: serviceLocation },
    { data: skillCount },
    { data: availCount },
    { data: payout },
    { data: identityVerif },
    { data: completion },
  ] = await Promise.all([
    supabase.from("profiles").select("phone, avatar_url, phone_verified").eq("id", user.id).single(),
    supabase.from("addresses").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("service_locations").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("worker_skills").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("availability").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("available", true),
    supabase.from("payout_accounts").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("identity_verifications").select("status").eq("user_id", user.id).eq("status", "verified").limit(1).maybeSingle(),
    supabase.rpc("get_profile_completion", { p_user_id: user.id }),
  ]);

  if (!profile?.phone) missing.push("Add phone number");
  if (!user.email_confirmed_at) missing.push("Verify email address");
  if (!identityVerif) missing.push("Complete identity verification");
  if (!profile?.avatar_url) missing.push("Add profile photo");
  if (!address) missing.push("Add address");
  if (!serviceLocation) missing.push("Set service location");
  if ((skillCount as any)?.count === 0) missing.push("Add at least one skill");
  if ((availCount as any)?.count === 0) missing.push("Set availability");
  if (!payout) missing.push("Add payout details");

  return NextResponse.json({
    canApply: missing.length === 0,
    missingSteps: missing,
    completionScore: completion ?? 0,
  } satisfies VerificationGateResult);
}
