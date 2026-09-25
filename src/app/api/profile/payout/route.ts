import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { account_holder_name, masked_account, ifsc_code, upi_id } = await request.json();

  const { data: existing } = await supabase.from("payout_accounts").select("id").eq("user_id", user.id).maybeSingle();

  let result;
  if (existing) {
    result = await supabase.from("payout_accounts")
      .update({ account_holder_name, masked_account, ifsc_code, upi_id, updated_at: new Date().toISOString() })
      .eq("user_id", user.id).select().single();
  } else {
    result = await supabase.from("payout_accounts")
      .insert({ user_id: user.id, account_holder_name, masked_account, ifsc_code, upi_id })
      .select().single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

  await supabase.from("verification_events").insert({
    user_id: user.id, event_type: "payout_updated", actor: "user",
  });

  return NextResponse.json({ payout: result.data });
}
