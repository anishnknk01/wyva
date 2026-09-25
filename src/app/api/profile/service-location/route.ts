import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { city, area, latitude, longitude, service_radius, pin_code } = body;

  const { data: existing } = await supabase.from("service_locations").select("id").eq("user_id", user.id).maybeSingle();

  let result;
  if (existing) {
    result = await supabase.from("service_locations")
      .update({ city, area, latitude, longitude, service_radius, pin_code, updated_at: new Date().toISOString() })
      .eq("user_id", user.id).select().single();
  } else {
    result = await supabase.from("service_locations")
      .insert({ user_id: user.id, city, area, latitude, longitude, service_radius, pin_code })
      .select().single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ serviceLocation: result.data });
}
