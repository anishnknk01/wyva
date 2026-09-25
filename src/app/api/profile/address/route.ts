import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { flat_house, street_area, landmark, city, district, state, country, pin_code, latitude, longitude } = body;

  const { data: existing } = await supabase.from("addresses").select("id").eq("user_id", user.id).maybeSingle();

  let result;
  if (existing) {
    result = await supabase.from("addresses")
      .update({ flat_house, street_area, landmark, city, district, state, country, pin_code, latitude, longitude, updated_at: new Date().toISOString() })
      .eq("user_id", user.id).select().single();
  } else {
    result = await supabase.from("addresses")
      .insert({ user_id: user.id, flat_house, street_area, landmark, city, district, state, country, pin_code, latitude, longitude })
      .select().single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ address: result.data });
}
