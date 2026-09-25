/**
 * KYC Identity Verification Integration Layer
 *
 * This route provides the integration interface for an authorized KYC/identity
 * provider (e.g. Digio, Signzy, KARZA, IDfy, or similar licensed provider).
 *
 * IMPORTANT SECURITY RULES:
 * - OTPs are NEVER stored, logged, or returned to the frontend.
 * - Raw Aadhaar numbers are NEVER stored; only masked form (XXXX XXXX 1234).
 * - All verification state changes happen server-side only.
 * - The frontend must NEVER be trusted as the source of verification status.
 * - Provider credentials must be in environment variables only.
 *
 * To connect a real provider:
 * 1. Set KYC_PROVIDER_API_KEY and KYC_PROVIDER_SECRET in .env.local
 * 2. Replace the TODO blocks below with the provider's SDK/API calls
 * 3. Implement the /api/profile/kyc-webhook route to receive async results
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const KYC_PROVIDER_API_KEY = process.env.KYC_PROVIDER_API_KEY;
const KYC_PROVIDER_SECRET  = process.env.KYC_PROVIDER_SECRET;

type InitiateBody = {
  type: "aadhaar" | "pan";
  step: "initiate" | "submit_otp" | "verify_pan";
  // Aadhaar initiate: vid (Virtual ID) provided by user — never full Aadhaar
  vid?: string;
  // OTP step
  otp?: string;
  session_id?: string;
  // PAN
  pan_number?: string;
  full_name?: string;
  dob?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: InitiateBody = await request.json();
  const { type, step } = body;

  if (!["aadhaar", "pan"].includes(type))
    return NextResponse.json({ error: "Invalid verification type" }, { status: 400 });

  // Check for existing pending/verified record
  const { data: existing } = await supabase
    .from("identity_verifications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("verification_type", type)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.status === "verified")
    return NextResponse.json({ error: "Already verified" }, { status: 400 });

  // ── AADHAAR FLOW ──────────────────────────────────────────────────────────
  if (type === "aadhaar" && step === "initiate") {
    if (!body.vid)
      return NextResponse.json({ error: "VID (Virtual Aadhaar ID) is required" }, { status: 400 });

    if (!KYC_PROVIDER_API_KEY) {
      // Provider not configured — create a pending record for manual review
      const { data } = await supabase.from("identity_verifications").insert({
        user_id: user.id,
        verification_type: "aadhaar",
        provider: "manual_pending",
        status: "pending",
        masked_identifier: "XXXX XXXX " + body.vid.slice(-4),
      }).select("id").single();

      await supabase.from("verification_events").insert({
        user_id: user.id, event_type: "kyc_initiated",
        details: { type: "aadhaar", provider: "manual" }, actor: "user",
      });

      return NextResponse.json({
        session_id: data?.id,
        message: "Identity verification submitted for manual review. Our team will verify within 24 hours.",
        requiresOtp: false,
      });
    }

    // TODO: Replace with real provider API call
    // Example: const res = await fetch(`${KYC_PROVIDER_BASE}/aadhaar/otp`, {
    //   method: "POST",
    //   headers: { "x-api-key": KYC_PROVIDER_API_KEY, "Content-Type": "application/json" },
    //   body: JSON.stringify({ uid: body.vid }),
    // });
    // const result = await res.json();
    // Store result.session_id (never store OTP or aadhaar number)

    return NextResponse.json({
      error: "KYC provider not configured. Please set KYC_PROVIDER_API_KEY.",
    }, { status: 503 });
  }

  if (type === "aadhaar" && step === "submit_otp") {
    if (!body.session_id || !body.otp)
      return NextResponse.json({ error: "session_id and otp are required" }, { status: 400 });

    // OTP is validated server-side and NEVER stored
    if (!KYC_PROVIDER_API_KEY) {
      return NextResponse.json({ error: "KYC provider not configured" }, { status: 503 });
    }

    // TODO: Replace with real provider OTP validation call
    // const res = await fetch(`${KYC_PROVIDER_BASE}/aadhaar/otp/verify`, {
    //   method: "POST",
    //   headers: { "x-api-key": KYC_PROVIDER_API_KEY },
    //   body: JSON.stringify({ session_id: body.session_id, otp: body.otp }),
    // });
    // const result = await res.json();
    // if (result.verified) { ... update DB, update profiles.verification_status }
    // NEVER log body.otp

    return NextResponse.json({ error: "KYC provider not configured" }, { status: 503 });
  }

  // ── PAN FLOW ──────────────────────────────────────────────────────────────
  if (type === "pan" && step === "verify_pan") {
    if (!body.pan_number || !body.full_name)
      return NextResponse.json({ error: "pan_number and full_name are required" }, { status: 400 });

    const maskedPan = body.pan_number.slice(0, 6).replace(/./g, "X") + body.pan_number.slice(6);

    if (!KYC_PROVIDER_API_KEY) {
      // Provider not configured — mark pending for manual review
      const { data } = await supabase.from("identity_verifications").insert({
        user_id: user.id,
        verification_type: "pan",
        provider: "manual_pending",
        status: "pending",
        masked_identifier: maskedPan,
        verified_name: body.full_name,
      }).select("id").single();

      await supabase.from("verification_events").insert({
        user_id: user.id, event_type: "kyc_initiated",
        details: { type: "pan", provider: "manual" }, actor: "user",
      });

      return NextResponse.json({
        session_id: data?.id,
        message: "PAN verification submitted for manual review.",
      });
    }

    // TODO: Replace with real provider PAN verification call
    // const res = await fetch(`${KYC_PROVIDER_BASE}/pan/verify`, {
    //   method: "POST",
    //   headers: { "x-api-key": KYC_PROVIDER_API_KEY },
    //   body: JSON.stringify({ pan: body.pan_number, name: body.full_name, dob: body.dob }),
    // });
    // const result = await res.json();
    // NEVER log the raw PAN number

    return NextResponse.json({ error: "KYC provider not configured" }, { status: 503 });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
