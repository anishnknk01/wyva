import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Handles the redirect back from Supabase after Google OAuth, a magic link
// click, or an email confirmation link. Exchanges the auth code for a
// session, then sends the user on to the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/tasks";

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${error}&description=${encodeURIComponent(errorDescription || "Authentication failed")}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      // Success - redirect to the app
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Session exchange error:", exchangeError);
      return NextResponse.redirect(`${origin}/login?error=session_exchange&description=${encodeURIComponent(exchangeError.message)}`);
    }
  }

  // No code and no error - shouldn't happen
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
