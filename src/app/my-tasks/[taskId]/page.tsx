"use client";

import { useParams } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MyTaskDetailPage } from "@/components/my-tasks/task-detail-page";
import { TaskNotFound } from "@/components/ui/task-not-found";
import { useTask } from "@/lib/use-task";
import { withAuth } from "@/lib/auth-guard";

function MyTaskDetailRoute() {
  const params = useParams<{ taskId: string }>();
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;
  const { task, loading } = useTask(taskId);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        {loading ? null : task ? <MyTaskDetailPage task={task} /> : <TaskNotFound />}
      </main>
      <Footer />
    </>
  );
}

export default withAuth(MyTaskDetailRoute);
