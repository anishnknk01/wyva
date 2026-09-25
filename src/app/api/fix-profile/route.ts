/**
 * Creates missing profile row and sets role from metadata.
 * Also allows explicitly setting a role via body.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Allow explicit role override from request body
  let roleOverride: string | null = null;
  try {
    const body = await request.json();
    if (body?.role) roleOverride = body.role;
  } catch {}

  const role = roleOverride ?? user.user_metadata?.role ?? null;
  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "";

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: name, role }, { onConflict: "id" });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({ success: true, role, name });
}
