"use client";

import { useEffect, useState } from "react";
import { RoleLayout }       from "@/components/layout/role-layout";
import { DashboardProfile } from "@/components/dashboard/dashboard-profile";
import { createClient }     from "@/lib/supabase/client";
import dynamic from "next/dynamic";

const WorkerProfilePage = dynamic(() =>
  import("@/components/worker/worker-profile").then(m => ({ default: m.WorkerProfile })),
  { loading: () => <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" /></div> }
);

export default function ProfilePage() {
  const [role, setRole] = useState<"customer" | "worker" | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      // DB role takes priority, then user_metadata (set at signup), then default customer
      const resolved = profile?.role ?? user.user_metadata?.role ?? "customer";
      setRole(resolved as "customer" | "worker");
    })();
  }, []);

  return (
    <RoleLayout>
      {role === null
        ? <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" /></div>
        : role === "worker"
        ? <WorkerProfilePage />
        : <DashboardProfile />
      }
    </RoleLayout>
  );
}
