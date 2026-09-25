"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { UserPlus, ArrowLeft, CheckCircle2, ShoppingBag, Briefcase } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";
import { createClient } from "@/lib/supabase/client";

type Role = "customer" | "worker";

export function SignupForm() {
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleRoleSelect(r: Role) {
    setRole(r);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { toast.error("Enter your name."); return; }
    if (!email.trim())    { toast.error("Enter your email."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (!role) { toast.error("Please select a role."); return; }

    setLoading(true);
    const supabase = createClient();

    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get("redirect") || (role === "worker" ? "/worker/dashboard" : "/dashboard");
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: callbackUrl,
      },
    });
    setLoading(false);

    if (error) { toast.error("Couldn't create account", { description: error.message }); return; }
    setSubmitted(true);
  }

  /* ── Submitted state ── */
  if (submitted) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 text-center sm:py-20">
        <span className="flex size-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
          <CheckCircle2 className="size-6" />
        </span>
        <h1 className="mt-4 font-heading text-xl font-semibold">Check your email</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium">{email}</span>.
          Click it to activate your account, then log in.
        </p>
        <Button className="mt-6 rounded-full bg-teal-600 hover:bg-teal-700" render={<Link href="/login" />}>
          Go to login
        </Button>
      </div>
    );
  }

  /* ── Step 1: Role selection ── */
  if (step === "role") {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <h1 className="font-heading text-2xl font-bold">Join WYSA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How do you want to use WYSA?
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Customer card */}
          <button
            onClick={() => handleRoleSelect("customer")}
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-teal-500 hover:shadow-md"
          >
            <div className="flex size-14 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
              <ShoppingBag className="size-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">I need help</p>
              <p className="mt-1 text-sm text-gray-500">Post tasks and hire verified Wysas nearby</p>
            </div>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              Customer
            </span>
          </button>

          {/* Worker card */}
          <button
            onClick={() => handleRoleSelect("worker")}
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-teal-500 hover:shadow-md"
          >
            <div className="flex size-14 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
              <Briefcase className="size-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">I want to earn</p>
              <p className="mt-1 text-sm text-gray-500">Accept tasks and get paid for helping others</p>
            </div>
            <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
              Worker (Wysa)
            </span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  /* ── Step 2: Account details ── */
  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-12 sm:py-16">
      <button
        onClick={() => setStep("role")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* Role badge */}
      <div className="mb-5 flex items-center gap-2">
        {role === "customer" ? (
          <span className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            <ShoppingBag className="size-3" /> Customer
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            <Briefcase className="size-3" /> Worker (Wysa)
          </span>
        )}
      </div>

      <h1 className="font-heading text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {role === "customer"
          ? "Post tasks and get help from verified locals."
          : "Start earning by helping people in your area."}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full-name">Full name</Label>
          <Input id="full-name" value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Your full name" className="h-10" autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" className="h-10" autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters" className="h-10" autoComplete="new-password" />
        </div>
        <Button type="submit" size="lg"
          className="mt-1 w-full rounded-full bg-teal-600 hover:bg-teal-700"
          disabled={loading}>
          <UserPlus className="size-4" />
          {loading ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal-600 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
