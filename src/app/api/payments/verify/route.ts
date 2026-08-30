import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verifies a Razorpay Checkout payment's signature server-side, then (only
// if valid) transitions the task from payment_pending to waiting_for_wysa.
// This is the only place a task's payment status may legitimately change —
// the client can never set status directly, preventing a tampered browser
// request from marking a task as paid without a verified payment.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { taskId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } =
    body ?? {};

  if (!taskId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "utf-8");
  const actual = Buffer.from(razorpaySignature, "utf-8");
  const signatureValid =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: task, error: taskError } = await admin
    .from("tasks")
    .select("id, customer_id, razorpay_order_id, status")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (task.customer_id !== authData.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (task.razorpay_order_id !== razorpayOrderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }
  if (task.status !== "payment_pending") {
    // Already processed (or in some other state) — avoid double-processing.
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  const { data: updated, error: updateError } = await admin
    .from("tasks")
    .update({
      status: "waiting_for_wysa",
      razorpay_payment_id: razorpayPaymentId,
      payment_method: paymentMethod ?? "card",
    })
    .eq("id", taskId)
    .select()
    .single();

  if (updateError || !updated) {
    console.error("Failed to finalize task payment", updateError);
    return NextResponse.json({ error: "Could not finalize payment" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
