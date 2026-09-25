"use client";

import type { Metadata } from "next";

import { TasksPage } from "@/components/tasks/tasks-page";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout";
import { withAuth } from "@/lib/auth-guard";

// Note: metadata export doesn't work with client components
// Consider moving this to layout.tsx or using next/head

function TasksRoute() {
  return (
    <DashboardLayoutWrapper>
      <TasksPage />
    </DashboardLayoutWrapper>
  );
}

export default withAuth(TasksRoute);
