"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, KeyRound, ArrowLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Handle OAuth errors from URL params
  useEffect(() => {
    const error = searchParams.get('error');
    const description = searchParams.get('description');
    
    if (error) {
      let errorMessage = "Authentication failed";
      
      switch (error) {
        case 'access_denied':
          errorMessage = "Google sign-in was cancelled";
          break;
        case 'redirect_uri_mismatch':
          errorMessage = "Configuration error - please contact support";
          break;
        case 'session_exchange':
          errorMessage = description || "Session creation failed";
          break;
        case 'missing_code':
          errorMessage = "Authentication response incomplete";
          break;
        default:
          errorMessage = description || errorMessage;
      }
      
      toast.error("Google Sign-In Error", { description: errorMessage });
    }
  }, [searchParams]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter your email and password to continue.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Couldn't log in", { description: error.message });
      return;
    }
    toast.success("Welcome back!");
    router.push("/tasks");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email to get a login link.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Couldn't send login link", { description: error.message });
      return;
    }
    setMagicLinkSent(true);
    toast.success("Login link sent", { description: `Check ${email}` });
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </Link>

      <h1 className="font-heading text-2xl font-bold">Log in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome back to WYSA.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      {magicLinkSent ? (
        <div className="rounded-2xl border border-teal/30 bg-teal/5 p-4 text-sm">
          <p className="font-semibold text-teal">Check your email</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We sent a login link to {email}. Click it to finish logging in.
          </p>
        </div>
      ) : mode === "password" ? (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10"
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" size="lg" className="mt-1 w-full rounded-full" disabled={loading}>
            <KeyRound className="size-4" />
            {loading ? "Logging in..." : "Log in"}
          </Button>
          <button
            type="button"
            onClick={() => setMode("magic-link")}
            className="text-center text-sm font-medium text-coral hover:underline"
          >
            Log in with an email link instead
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-link">Email</Label>
            <Input
              id="email-link"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10"
              autoComplete="email"
            />
          </div>
          <Button type="submit" size="lg" className="mt-1 w-full rounded-full" disabled={loading}>
            <Mail className="size-4" />
            {loading ? "Sending..." : "Send login link"}
          </Button>
          <button
            type="button"
            onClick={() => setMode("password")}
            className="text-center text-sm font-medium text-coral hover:underline"
          >
            Log in with a password instead
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-coral hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
