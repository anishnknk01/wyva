"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.9 10.9 0 0 0 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function GoogleButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);

  // Test function to show the redirect URL without actually starting OAuth
  function showRedirectUrl() {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = `${baseUrl}/auth/callback`;
    
    alert(`Google will redirect to: ${redirectUrl}\n\nMake sure this exact URL is in your Google Console under "Authorized redirect URIs"`);
  }

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    
    // Construct the redirect URL explicitly
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    // Get the redirect parameter from current URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get('redirect') || '/tasks';
    const callbackUrl = `${baseUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
    
    console.log('=== GOOGLE OAUTH DEBUG ===');
    console.log('Base URL:', baseUrl);
    console.log('Redirect URL:', callbackUrl);
    console.log('Final destination:', redirectTo);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Starting Google OAuth...');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      console.error('Google OAuth initiation error:', error);
      toast.error("Couldn't start Google sign-in", { description: error.message });
      setLoading(false);
    } else {
      console.log('Google OAuth initiated successfully - browser should redirect to Google');
    }
    // On success the browser is redirected to Google, so no further local
    // state update is needed.
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full rounded-full"
        disabled={loading}
        onClick={handleClick}
      >
        <GoogleIcon />
        {label}
      </Button>
      
      {/* Debug button - remove in production */}
      <button
        type="button"
        onClick={showRedirectUrl}
        className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
      >
        🔍 Debug: Show redirect URL
      </button>
    </div>
  );
}
