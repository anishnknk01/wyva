"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkerSidebar }          from "@/components/worker/worker-sidebar";
import { WorkerHeader }           from "@/components/worker/worker-header";
import { WorkerDashboardContent } from "@/components/worker/worker-dashboard-content";
import { useAuthGuard }           from "@/lib/auth-guard";
import { createClient }           from "@/lib/supabase/client";

function WorkerDashboardPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    (async () => {
      const supabase = createClient();

      // First check if profile already has enough data to skip onboarding entirely.
      // This handles: (a) existing users, (b) missing migration tables.
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      // If name is already set, consider them set up — skip onboarding
      if (profile?.full_name?.trim()) {
        setChecking(false);
        return;
      }

      // Profile is empty — try checking onboarding progress table
      // (may not exist if migration hasn't been run yet — handle gracefully)
      try {
        const { data: progress, error: progressError } = await supabase
          .from("worker_onboarding_progress")
          .select("completed_at, step")
          .eq("user_id", user.id)
          .maybeSingle();

        // Table doesn't exist → just let them into the dashboard
        if (progressError) {
          setChecking(false);
          return;
        }

        // Already completed onboarding
        if (progress?.completed_at) {
          setChecking(false);
          return;
        }

        // Partially through onboarding → resume
        if (progress && !progress.completed_at && (progress.step ?? 0) >= 3) {
          router.replace("/worker/onboarding");
          return;
        }

        // Truly new worker with no name and no progress → start onboarding
        router.replace("/worker/onboarding");
      } catch {
        // Any unexpected error — just show the dashboard rather than looping
        setChecking(false);
      }
    })();
  }, [user, authLoading, router]);

  if (authLoading || checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <WorkerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <WorkerHeader user={user} setSidebarOpen={setSidebarOpen} />
        <WorkerDashboardContent user={user} />
      </div>
    </div>
  );
}

export default WorkerDashboardPage;
