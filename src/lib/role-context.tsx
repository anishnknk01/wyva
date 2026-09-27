"use client";

/**
 * Role context — determines whether the logged-in user is a "customer" or "worker".
 *
 * PERMANENT FIX:
 * The role is stored in TWO places:
 *   1. profiles.role (DB) — authoritative but blocked by RLS when policies are missing
 *   2. user_metadata.role (Supabase Auth JWT) — always readable, survives RLS issues
 *
 * We read from auth metadata first (instant, no DB round-trip, never blocked by RLS),
 * then DB as a fallback. This means role detection ALWAYS works regardless of RLS state.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "customer" | "worker" | null;

const RoleContext = createContext<Role>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const resolveRole = async (user: import("@supabase/supabase-js").User | null) => {
      if (!user) return;

      // 1. Auth metadata — always readable, embedded in JWT, set at signup + role-select
      const metaRole = user.user_metadata?.role as Role | undefined;

      if (metaRole) {
        if (!cancelled) setRole(metaRole);
        return; // Fast path — no DB needed
      }

      // 2. DB fallback — only if metadata not set (existing accounts / Google OAuth users)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const dbRole = profile?.role as Role | undefined;

      if (dbRole) {
        if (!cancelled) setRole(dbRole);
        // Sync the role into auth metadata so future loads use the fast path
        supabase.auth.updateUser({ data: { role: dbRole } }).catch(() => {});
        return;
      }

      // 3. No role anywhere — auto-create profile row
      if (!profile) {
        fetch("/api/fix-profile", { method: "POST" }).catch(() => {});
      }

      // null means "not chosen yet" — routes will send to /select-role
      if (!cancelled) setRole(null);
    };

    // Initial resolve — getUser() re-validates against the server so it's safe
    // to trust immediately after an OAuth redirect (unlike getSession, which
    // can momentarily return a stale/null session client-side).
    supabase.auth.getUser().then(({ data: { user } }) => resolveRole(user));

    // Keep role in sync with auth state changes (login, token refresh, OAuth
    // redirect completing after this provider already mounted, logout, etc.)
    // so we never get stuck showing null/wrong role after the initial mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveRole(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRoleContext() {
  return useContext(RoleContext);
}

/** No-op — kept for compatibility. Role now comes from auth metadata, not sessionStorage. */
export function clearRoleCache() {}
