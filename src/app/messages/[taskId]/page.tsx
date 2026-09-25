"use client";

import { Suspense } from "react";
import { RoleLayout }     from "@/components/layout/role-layout";
import { DashboardChat }  from "@/components/dashboard/dashboard-chat";

export default function ChatPage({ params }: { params: { taskId: string } }) {
  return (
    <RoleLayout>
      <div className="flex h-full overflow-hidden">
        <Suspense fallback={null}>
          <DashboardChat taskId={params.taskId} />
        </Suspense>
      </div>
    </RoleLayout>
  );
}
