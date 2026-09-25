import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: Array<{ day_of_week: string; available: boolean; start_time?: string; end_time?: string }> = await request.json();

  // Upsert each day
  const rows = body.filter(r => DAYS.includes(r.day_of_week)).map(r => ({
    user_id: user.id, day_of_week: r.day_of_week,
    available: r.available, start_time: r.start_time ?? null, end_time: r.end_time ?? null,
  }));

  const { error } = await supabase.from("availability")
    .upsert(rows, { onConflict: "user_id,day_of_week" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
