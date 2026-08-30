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

  console.log('Auth callback received:', { 
    code: code ? 'present' : 'missing', 
    error, 
    errorDescription, 
    origin 
  });

  // Handle OAuth errors from the provider
  if (error) {
    console.error("OAuth provider error:", error, errorDescription);
    const encodedError = encodeURIComponent(error);
    const encodedDescription = encodeURIComponent(errorDescription || "Authentication failed");
    return NextResponse.redirect(`${origin}/login?error=${encodedError}&description=${encodedDescription}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!exchangeError) {
        console.log('Session exchange successful, redirecting to:', next);
        // Success - redirect to the app
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error("Session exchange error:", exchangeError);
        const encodedDescription = encodeURIComponent(exchangeError.message);
        return NextResponse.redirect(`${origin}/login?error=session_exchange&description=${encodedDescription}`);
      }
    } catch (err) {
      console.error("Unexpected error in auth callback:", err);
      return NextResponse.redirect(`${origin}/login?error=unexpected&description=${encodeURIComponent('An unexpected error occurred')}`);
    }
  }

  // No code and no error - shouldn't happen
  console.error('Auth callback received without code or error');
  return NextResponse.redirect(`${origin}/login?error=missing_code&description=${encodeURIComponent('Authentication response incomplete')}`);
}
