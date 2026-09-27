/**
 * POST /api/tasks/[taskId]/apply
 * Worker applies for a task (creates a task_applications row).
 * Does NOT immediately claim the task — the customer reviews all applicants
 * and accepts one via POST /api/tasks/[taskId]/applications/[appId]/accept.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;

  // Verify the task exists and is still open for applications
  const { data: task } = await supabase
    .from("tasks")
    .select("id, status, customer_id")
    .eq("id", taskId)
    .single();

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (task.customer_id === user.id)
    return NextResponse.json({ error: "You cannot apply for your own task" }, { status: 400 });
  if (task.status !== "waiting_for_wysa")
    return NextResponse.json({ error: "This task is no longer accepting applications" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const message = (body.message as string | undefined)?.trim() ?? null;

  // Upsert — idempotent if the worker applies again
  const { data, error } = await supabase
    .from("task_applications")
    .upsert(
      { task_id: taskId, wysa_id: user.id, message, status: "pending" },
      { onConflict: "task_id,wysa_id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("apply failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment interested_count on the task so the customer sees activity
  await supabase.rpc("increment_interested_count" as any, { task_id: taskId }).catch(() => {
    // RPC may not exist — fall back to a direct update
    supabase
      .from("tasks")
      .update({ interested_count: (task as any).interested_count + 1 })
      .eq("id", taskId);
  });

  return NextResponse.json({ application: data });
}
