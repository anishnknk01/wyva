"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { TasksPage } from "@/components/tasks/tasks-page";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout";
import { withAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/client";

function TasksRoute() {
  const router = useRouter();

  // Workers have their own dedicated task-browsing page at /worker/find-tasks.
  // Redirect them there so they don't land on the customer-facing task list.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const role = user?.user_metadata?.role;
      if (role === "worker") router.replace("/worker/find-tasks");
    });
  }, [router]);

  return (
    <DashboardLayoutWrapper>
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" /></div>}>
        <TasksPage />
      </Suspense>
    </DashboardLayoutWrapper>
  );
}

export default withAuth(TasksRoute);
