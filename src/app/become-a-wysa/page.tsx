"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Briefcase, CheckCircle, Clock, IndianRupee, MapPin } from "lucide-react";
import Link from "next/link";

// "Become a Wysa" is now handled by the Worker account type.
// This page acts as a marketing/landing page:
// - Logged-in workers     → redirect to /worker/dashboard
// - Logged-in customers   → redirect to /select-role (they can switch)
// - Not logged in         → show marketing page with CTA → /signup
export default function BecomeAWysaPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // stay on this page for unauthenticated visitors

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = profile?.role ?? user.user_metadata?.role;

      if (role === "worker") {
        router.replace("/worker/dashboard");
      } else if (role === "customer") {
        // Let customer switch roles
        router.replace("/select-role");
      }
      // role === null → stay here so they can sign up
    })();
  }, [router]);

  const perks = [
    { icon: IndianRupee, text: "Earn on your own schedule" },
    { icon: MapPin,      text: "Work in your neighbourhood" },
    { icon: Clock,       text: "Choose your own hours" },
    { icon: CheckCircle, text: "Get paid after every task" },
  ];

  const steps = [
    { num: "01", title: "Sign up as a Worker", desc: "Create a Worker account — takes under 2 minutes." },
    { num: "02", title: "Complete your profile", desc: "Add your skills, availability, and area. Verify your identity." },
    { num: "03", title: "Get booked & earn",    desc: "Accept tasks nearby and get paid once the customer confirms." },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal nav */}
      <header className="border-b border-gray-100 px-6 py-4">
        <Link href="/" className="font-heading text-2xl font-extrabold tracking-tight text-gray-900">
          wysa<span className="text-teal-600">.</span>
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
          <Briefcase className="h-4 w-4" /> Now open in Mangalore
        </div>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Earn by helping people.<br />
          <span className="text-purple-600">Become a Wysa.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
          Join verified locals who earn on their own schedule — helping with
          errands, companionship, elder care, and more.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-purple-700 transition-colors"
          >
            <Briefcase className="h-4 w-4" /> Sign up as a Worker
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Already have an account? Log in
          </Link>
        </div>
      </section>

      {/* Perks */}
      <section className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">Why become a Wysa?</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="rounded-2xl border border-gray-200 p-6">
                <span className="text-3xl font-extrabold text-purple-200">{num}</span>
                <h3 className="mt-3 text-base font-semibold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-100 bg-purple-600 py-16 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to start earning?</h2>
        <p className="mt-2 text-purple-200">Sign up as a Worker today — it's free.</p>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-purple-700 shadow hover:bg-gray-50 transition-colors"
        >
          <Briefcase className="h-4 w-4" /> Get started
        </Link>
      </section>

      {/* Footer strip */}
      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} WYSA. Mangalore, Karnataka.
      </footer>
    </div>
  );
}
