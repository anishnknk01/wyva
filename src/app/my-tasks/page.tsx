"use client";

import { RoleLayout }  from "@/components/layout/role-layout";
import { MyTasksPage } from "@/components/my-tasks/my-tasks-page";

export default function MyTasksRoute() {
  return (
    <RoleLayout>
      <div className="flex-1 overflow-y-auto bg-white">
        <MyTasksPage />
      </div>
    </RoleLayout>
  );
}
