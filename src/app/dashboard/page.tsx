"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { withAuth } from "@/lib/auth-guard";

function DashboardPage() {
  return <DashboardLayout />;
}

export default withAuth(DashboardPage);