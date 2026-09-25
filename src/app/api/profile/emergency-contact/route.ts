import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, relationship, phone } = await request.json();
  if (!name || !phone) return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });

  const { data: existing } = await supabase.from("emergency_contacts").select("id").eq("user_id", user.id).maybeSingle();

  let result;
  if (existing) {
    result = await supabase.from("emergency_contacts")
      .update({ name, relationship, phone, updated_at: new Date().toISOString() })
      .eq("user_id", user.id).select().single();
  } else {
    result = await supabase.from("emergency_contacts")
      .insert({ user_id: user.id, name, relationship, phone })
      .select().single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ emergency: result.data });
}
