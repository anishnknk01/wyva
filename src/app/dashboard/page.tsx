"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuthGuard } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/client";

function DashboardPage() {
  const { user, loading } = useAuthGuard();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    (async () => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      // profile row missing OR role not set → stay on customer dashboard (default)
      if (!profile) return;

      const role = profile.role ?? user.user_metadata?.role;

      if (role === "worker") {
        router.replace("/worker/dashboard");
      }
    })();
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  return <DashboardLayout />;
}

export default DashboardPage;
