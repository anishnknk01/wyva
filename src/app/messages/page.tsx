"use client";

import { RoleLayout }        from "@/components/layout/role-layout";
import { DashboardMessages } from "@/components/dashboard/dashboard-messages";

export default function MessagesPage() {
  return (
    <RoleLayout>
      <DashboardMessages />
    </RoleLayout>
  );
}
