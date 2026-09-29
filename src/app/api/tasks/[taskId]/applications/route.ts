/**
 * GET  /api/tasks/[taskId]/applications
 * Returns all applications for a task, enriched with the worker's
 * profile (name, avatar, rating, skills, etc.) — customer-facing.
 *
 * POST /api/tasks/[taskId]/applications  { wysaId }
 * Customer accepts a specific applicant (rejects all others, updates
 * task status to wysa_accepted, fires notification to accepted worker).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;

  // Only the task owner can see all applications
  const { data: task } = await supabase
    .from("tasks")
    .select("customer_id")
    .eq("id", taskId)
    .single();

  if (!task || task.customer_id !== user.id)
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

  const { data: apps, error } = await supabase
    .from("task_applications")
    .select("*")
    .eq("task_id", taskId)
    .order("proposed_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!apps || apps.length === 0) return NextResponse.json({ applications: [] });

  // Enrich each application with the worker's profile data
  const wysaIds = apps.map((a: any) => a.wysa_id);

  const [{ data: profiles }, { data: wysaProfiles }, { data: skills }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").in("id", wysaIds),
    supabase
      .from("wysa_profiles")
      .select("id, area, bio, rating, sessions_count, verified, languages, interests")
      .in("id", wysaIds),
    supabase
      .from("worker_skills")
      .select("user_id, custom_skill_name")
      .in("user_id", wysaIds),
  ]);

  const profileMap: Record<string, any> = {};
  (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
  const wysaMap: Record<string, any> = {};
  (wysaProfiles ?? []).forEach((p: any) => { wysaMap[p.id] = p; });
  const skillsMap: Record<string, string[]> = {};
  (skills ?? []).forEach((s: any) => {
    if (s.custom_skill_name) {
      (skillsMap[s.user_id] = skillsMap[s.user_id] ?? []).push(s.custom_skill_name);
    }
  });

  const enriched = apps.map((app: any) => {
    const profile = profileMap[app.wysa_id];
    const wysa   = wysaMap[app.wysa_id];
    return {
      id:          app.id,
      taskId:      app.task_id,
      wysaId:      app.wysa_id,
      status:      app.status,
      message:     app.message,
      proposedAt:  app.proposed_at,
      decidedAt:   app.decided_at,
      // Worker profile
      name:         profile?.full_name ?? "Wysa",
      avatarUrl:    profile?.avatar_url ?? null,
      area:         wysa?.area ?? "",
      bio:          wysa?.bio ?? "",
      rating:       wysa?.rating ?? 0,
      sessionsCount: wysa?.sessions_count ?? 0,
      verified:     wysa?.verified ?? false,
      languages:    wysa?.languages ?? [],
      interests:    wysa?.interests ?? [],
      skills:       skillsMap[app.wysa_id] ?? [],
    };
  });

  return NextResponse.json({ applications: enriched });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  const { wysaId } = await request.json();
  if (!wysaId) return NextResponse.json({ error: "wysaId required" }, { status: 400 });

  // Only the task owner can accept
  const { data: task } = await supabase
    .from("tasks")
    .select("id, status, customer_id, interested_count")
    .eq("id", taskId)
    .single();

  if (!task || task.customer_id !== user.id)
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

  if (task.status !== "waiting_for_wysa")
    return NextResponse.json({ error: "Task is not open for acceptance" }, { status: 400 });

  // Reject all other pending applications
  await supabase
    .from("task_applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("task_id", taskId)
    .eq("status", "pending")
    .neq("wysa_id", wysaId);

  // Accept this applicant
  await supabase
    .from("task_applications")
    .update({ status: "accepted", decided_at: new Date().toISOString() })
    .eq("task_id", taskId)
    .eq("wysa_id", wysaId);

  // Update task: set status + accepted_wysa_id
  const { data: updatedTask, error: taskError } = await supabase
    .from("tasks")
    .update({
      status: "wysa_accepted",
      accepted_wysa_id: wysaId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (taskError || !updatedTask)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });

  // Fire push notification to the accepted Wysa
  try {
    const acceptedWysaName = (await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", wysaId)
      .single()
    ).data?.full_name ?? "You";

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Server-to-server call with no browser session to forward — proves
        // trust via the service-role secret instead. See send/route.ts.
        "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      },
      body: JSON.stringify({
        userId: wysaId,
        title: "You've been accepted!",
        body: `The customer has chosen you for the task. Confirm now to get started.`,
        tag: `task-${taskId}-wysa_accepted`,
        data: { taskId, type: "task_update", status: "wysa_accepted" },
      }),
    });
  } catch { /* notifications are best-effort */ }

  return NextResponse.json({ task: updatedTask });
}
