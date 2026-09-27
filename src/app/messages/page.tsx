"use client";

import { Suspense } from "react";
import { RoleLayout }        from "@/components/layout/role-layout";
import { DashboardMessages } from "@/components/dashboard/dashboard-messages";

export default function MessagesPage() {
  return (
    <RoleLayout>
      <Suspense fallback={null}>
        <DashboardMessages />
      </Suspense>
    </RoleLayout>
  );
}
