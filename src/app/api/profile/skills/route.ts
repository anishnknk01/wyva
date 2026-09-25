import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET catalog skills
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: catalog } = await supabase.from("skills").select("*").order("category");
  const { data: mine } = await supabase.from("worker_skills")
    .select("*, skills(name, category)").eq("user_id", user.id);

  return NextResponse.json({ catalog: catalog ?? [], mySkills: mine ?? [] });
}

// POST — add a skill
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { skill_id, custom_skill_name, experience_years, skill_level, description } = body;

  if (!skill_id && !custom_skill_name)
    return NextResponse.json({ error: "skill_id or custom_skill_name required" }, { status: 400 });

  const { data, error } = await supabase.from("worker_skills")
    .insert({ user_id: user.id, skill_id, custom_skill_name, experience_years, skill_level, description })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ skill: data });
}

// DELETE — remove a skill
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  const { error } = await supabase.from("worker_skills").delete()
    .eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
