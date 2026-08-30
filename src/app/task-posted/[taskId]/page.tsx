"use client";

import { useParams } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TaskPostedPage } from "@/components/task-posted/task-posted-page";
import { TaskNotFound } from "@/components/ui/task-not-found";
import { useTask } from "@/lib/use-task";

export default function TaskPostedRoute() {
  const params = useParams<{ taskId: string }>();
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;
  const { task, loading } = useTask(taskId);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        {loading ? null : task ? <TaskPostedPage task={task} /> : <TaskNotFound />}
      </main>
      <Footer />
    </>
  );
}
