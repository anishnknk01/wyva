/**
 * KYC Provider Webhook Handler
 *
 * This endpoint receives async verification results from the KYC provider.
 * It is the ONLY place that sets verification_status = 'verified' on profiles.
 * The frontend must NEVER be trusted to report its own verification status.
 *
 * Security:
 * - Validate the webhook signature before processing.
 * - Set KYC_WEBHOOK_SECRET in .env.local.
 * - Use HTTPS only.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const KYC_WEBHOOK_SECRET = process.env.KYC_WEBHOOK_SECRET;

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Validate webhook signature
  const sig = request.headers.get("x-webhook-signature") ?? "";
  if (KYC_WEBHOOK_SECRET && !verifySignature(rawBody, sig, KYC_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(rawBody); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();

  const { reference_id, verification_id, status, verified_name, verified_dob, failure_reason } = payload;

  if (!verification_id || !status)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Look up the verification record
  const { data: verif } = await supabase
    .from("identity_verifications")
    .select("id, user_id, verification_type")
    .eq("id", verification_id)
    .single();

  if (!verif) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStatus = status === "verified" ? "verified" : "failed";

  // Update verification record
  await supabase.from("identity_verifications").update({
    status: newStatus,
    verified_name: verified_name ?? null,
    verified_dob: verified_dob ?? null,
    provider_reference: reference_id ?? null,
    failure_reason: failure_reason ?? null,
    verified_at: newStatus === "verified" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", verification_id);

  // If verified, update profile.verification_status
  if (newStatus === "verified") {
    await supabase.from("profiles").update({
      verification_status: "verified",
    }).eq("id", verif.user_id);
  }

  // Audit log — NEVER log OTPs or raw identity numbers
  await supabase.from("verification_events").insert({
    user_id: verif.user_id,
    event_type: "kyc_webhook_received",
    details: { type: verif.verification_type, status: newStatus },
    actor: "provider",
  });

  return NextResponse.json({ received: true });
}
