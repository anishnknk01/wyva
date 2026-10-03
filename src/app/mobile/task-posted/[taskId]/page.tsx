"use client";

import { use } from "react";
import { MobileLayout } from "@/components/mobile/mobile-layout";
import { TaskPostedPage } from "@/components/task-posted/task-posted-page";
import { TaskNotFound } from "@/components/ui/task-not-found";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useTask } from "@/lib/use-task";
import { withAuth } from "@/lib/auth-guard";

interface PageProps {
  params: Promise<{ taskId: string }>;
}

function MobileTaskPostedPage({ params }: PageProps) {
  const { taskId } = use(params);
  const { task, loading } = useTask(taskId);

  return (
    <MobileLayout
      title="Task Confirmation"
      showBack={false}
      showBottomNav={true}
    >
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <LoadingPage />
        ) : task ? (
          <TaskPostedPage
            task={task}
            viewTaskHref={`/mobile/tasks/${task.id}`}
          />
        ) : (
          <TaskNotFound />
        )}
      </div>
    </MobileLayout>
  );
}

export default withAuth(MobileTaskPostedPage);
