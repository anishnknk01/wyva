"use client";

import { useParams } from "next/navigation";
import { RoleLayout }        from "@/components/layout/role-layout";
import { MyTaskDetailPage }  from "@/components/my-tasks/task-detail-page";
import { TaskNotFound }      from "@/components/ui/task-not-found";
import { useTask }           from "@/lib/use-task";

function TaskDetailContent() {
  const params = useParams<{ taskId: string }>();
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;
  const { task, loading } = useTask(taskId);

  if (loading) return null;
  return task ? <MyTaskDetailPage task={task} /> : <TaskNotFound />;
}

export default function MyTaskDetailRoute() {
  return (
    <RoleLayout>
      <div className="flex-1 overflow-y-auto bg-white">
        <TaskDetailContent />
      </div>
    </RoleLayout>
  );
}
