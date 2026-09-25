"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { activities } from "@/lib/content";

// Quick-link pills shown under the search bar (first 5 categories)
const quickLinks = activities.slice(0, 5);

export function Hero() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/tasks?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/tasks");
    }
  }

  return (
    <section className="relative min-h-[520px] sm:min-h-[580px] flex items-center overflow-hidden">
      {/* Dark overlay background — replace the gradient with a real photo if available */}
      <div className="absolute inset-0 bg-gray-900">
        {/* subtle grid texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* right-side glow for depth */}
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-teal-900/40 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {/* headline */}
          <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            {user
              ? `Welcome back, ${user.user_metadata?.full_name?.split(" ")[0] || "there"}.`
              : "Your time.\nYour Wysa."}
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Post a task. A verified local Wysa will handle it.
          </p>

          {/* search bar */}
          <form
            onSubmit={handleSearch}
            className="mt-8 flex items-center overflow-hidden rounded-lg bg-white shadow-lg"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a task or category…"
              className="flex-1 px-5 py-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
            />
            <button
              type="submit"
              className="flex items-center justify-center bg-gray-900 hover:bg-gray-800 transition-colors px-5 py-4"
              aria-label="Search"
            >
              <Search className="size-5 text-white" />
            </button>
          </form>

          {/* quick-link pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {quickLinks.map((activity) => (
              <button
                key={activity.title}
                onClick={() =>
                  router.push(`/create-task?category=${encodeURIComponent(activity.title)}`)
                }
                className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                {activity.title}
                <span className="text-white/60">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
