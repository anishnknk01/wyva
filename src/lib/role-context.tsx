"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "customer" | "worker" | null;

const RoleContext = createContext<Role>(null);
// Bump this key whenever the role logic changes to clear stale cached values
const CACHE_KEY = "wysa_role_v6";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    // Check sessionStorage first — avoids a DB round-trip on every navigation
    const cached = sessionStorage.getItem(CACHE_KEY) as Role;
    if (cached) { setRole(cached); return; }

    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const metaRole = user.user_metadata?.role as Role;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        fetch("/api/fix-profile", { method: "POST" }).catch(() => {});
      }

      // DB role first, then user_metadata (reliable — set at signup), then customer
      const resolved = (profile?.role ?? metaRole ?? "customer") as Role;
      setRole(resolved);
      sessionStorage.setItem(CACHE_KEY, resolved);
    })();
  }, []);

  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRoleContext() {
  return useContext(RoleContext);
}

export function clearRoleCache() {
  if (typeof window !== "undefined") {
    ["wysa_role", "wysa_role_v2", "wysa_role_v3", "wysa_role_v4"].forEach(k => sessionStorage.removeItem(k));
  }
}
