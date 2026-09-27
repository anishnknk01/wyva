"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { WorkerSidebar }    from "@/components/worker/worker-sidebar";
import { useAuthGuard }     from "@/lib/auth-guard";
import { useRoleContext }   from "@/lib/role-context";

export function RoleLayout({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuthGuard();
  const role = useRoleContext(); // instant — no DB call
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Wait for BOTH auth and role to resolve before picking a sidebar.
  // Without this, role starts as null on first mount and null !== "worker"
  // falls through to the Customer sidebar for a frame (or longer, on slow
  // networks) even for workers — this was the "flips to customer" bug.
  if (authLoading || role === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="w-64 shrink-0">
        {role === "worker"
          ? <WorkerSidebar />
          : <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        }
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
