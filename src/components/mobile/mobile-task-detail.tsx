"use client";

/**
 * Single Task Details screen for mobile — reused by every entry point
 * (Home's Nearby Tasks / Your Recent Tasks, Find Tasks results, category
 * taps, My Tasks). There is no mobile-specific detail UI here: this file
 * just loads the real task by id and renders the SAME two detail
 * components the desktop app already uses, picking whichever one applies
 * based on the task's real relationship to the current user — exactly
 * the same split the desktop app already has between:
 *   - src/components/tasks/task-detail-page.tsx       (worker/Wysa view —
 *     browsing/accepting a task: Apply, Mark complete, Rate customer)
 *   - src/components/my-tasks/task-detail-page.tsx     (customer view —
 *     the task you posted: Confirm, Task done, Rate Wysa)
 * No new status system, no new mutations — both components call the same
 * task-store.ts functions (acceptTask/updateTask/submitRating) that
 * already update the task in Supabase, so a change here is immediately
 * visible everywhere else that reads the same task (My Tasks, Find Tasks,
 * Home, the desktop app).
 */

import { useRouter } from "next/navigation";
import { useUser } from "@/lib/use-user";
import { useTask } from "@/lib/use-task";
import { TaskDetailPage } from "@/components/tasks/task-detail-page";
import { MyTaskDetailPage } from "@/components/my-tasks/task-detail-page";
import { LoadingPage } from "@/components/ui/loading-spinner";

export function MobileTaskDetail({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { task, loading: taskLoading } = useTask(taskId);

  if (userLoading || taskLoading) {
    return <LoadingPage message="Loading task..." />;
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <p className="text-gray-900 font-medium">Task not found</p>
        <p className="mt-1 text-sm text-gray-500">
          This task may have been removed or the link is incorrect.
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  // Same role split the desktop app already uses: a task is "mine as a
  // customer" when I posted it. Otherwise this is the browse/accept
  // (worker) view — including before anyone has accepted it yet, which
  // matches how /mobile/find-tasks and Home's "Nearby Tasks" already
  // present these tasks (Apply Now / X interested).
  const isOwner = !!user && task.customerId === user.id;

  if (isOwner) {
    return (
      <MyTaskDetailPage
        task={task}
        backHref="/mobile/my-tasks"
        messagesBasePath="/mobile/messages"
      />
    );
  }

  return (
    <TaskDetailPage
      task={task}
      backHref="/mobile/find-tasks"
      findMoreHref="/mobile/find-tasks"
    />
  );
}
