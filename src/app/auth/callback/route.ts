import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Handles the redirect back from Supabase after Google OAuth, a magic link
// click, or an email confirmation link. Exchanges the auth code for a
// session, then sends the user on to the app.
export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const next = searchParams.get("next") ?? "/dashboard";

    console.log('Auth callback received:', { 
      code: code ? 'present' : 'missing', 
      error, 
      errorDescription, 
      origin,
      url: request.url
    });

    // If accessed directly without parameters, return a simple response
    if (!code && !error) {
      return NextResponse.redirect(`${origin}/login?error=direct_access&description=${encodeURIComponent('Auth callback accessed directly')}`);
    }

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

    // Fallback
    console.error('Auth callback reached fallback');
    return NextResponse.redirect(`${origin}/login?error=fallback&description=${encodeURIComponent('Unexpected callback state')}`);

  } catch (err) {
    console.error('Critical error in auth callback:', err);
    // If we can't even parse the URL, return a basic response
    return new Response('Auth callback error: ' + (err instanceof Error ? err.message : 'Unknown error'), { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
