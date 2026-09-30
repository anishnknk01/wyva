"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
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

  // Both sidebars render their own desktop column (hidden below `lg`, takes
  // up normal flex space when shown) and mobile overlay drawer (`fixed`,
  // only mounted while open, takes up no flex space) internally — so a
  // single instance in normal flow handles both cases with no wrapper div.
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {role === "worker"
        ? <WorkerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        : <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      }
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Pages using RoleLayout (messages, payments, settings, saved,
            my-tasks, profile) don't render their own header, so without
            this there was no way to open the mobile sidebar at all below
            the lg breakpoint — the hamburger button only existed on
            /dashboard and /worker/* pages that render their own header. */}
        <div className="flex items-center border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
