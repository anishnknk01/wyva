import { NextResponse } from "next/server";

import { getRazorpay } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Creates a Razorpay order for a task's total (budget + platform fee).
// The amount is looked up server-side from the task record rather than
// trusted from the client, so a tampered request body can't under-pay.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const taskId = body?.taskId;
  if (!taskId || typeof taskId !== "string") {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  // Use the admin client for the lookup so RLS doesn't get in the way of
  // reading a task the caller doesn't yet "own" in edge cases, but verify
  // ownership manually below before creating a charge.
  const admin = createAdminClient();
  const { data: task, error: taskError } = await admin
    .from("tasks")
    .select("id, customer_id, total, status")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (task.customer_id !== authData.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (task.status !== "payment_pending") {
    return NextResponse.json(
      { error: "This task is not awaiting payment." },
      { status: 409 }
    );
  }

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: task.total * 100, // Razorpay expects paise.
      currency: "INR",
      receipt: task.id,
      notes: { taskId: task.id },
    });

    await admin.from("tasks").update({ razorpay_order_id: order.id }).eq("id", task.id);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Razorpay order creation failed", err);
    return NextResponse.json({ error: "Could not create payment order" }, { status: 502 });
  }
}
