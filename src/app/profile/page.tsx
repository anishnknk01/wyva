"use client";

import { RoleLayout }       from "@/components/layout/role-layout";
import { DashboardProfile } from "@/components/dashboard/dashboard-profile";
import { useRoleContext }   from "@/lib/role-context";
import dynamic from "next/dynamic";

const WorkerProfilePage = dynamic(
  () => import("@/components/worker/worker-profile").then(m => ({ default: m.WorkerProfile })),
  { loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
    </div>
  )}
);

export default function ProfilePage() {
  // Read from shared context — same source as the sidebar and header.
  // This prevents the page from making its own separate DB query that
  // can return a different (stale/blocked) result and flip the UI.
  const role = useRoleContext();

  return (
    <RoleLayout>
      {role === null ? (
        // Still loading role from context — show spinner
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-500" />
        </div>
      ) : role === "worker" ? (
        <WorkerProfilePage />
      ) : (
        <DashboardProfile />
      )}
    </RoleLayout>
  );
}
