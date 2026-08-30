"use client";

import { useParams } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PayTaskPage } from "@/components/pay-task/pay-task-page";
import { TaskNotFound } from "@/components/ui/task-not-found";
import { useTask } from "@/lib/use-task";

export default function PayTaskRoute() {
  const params = useParams<{ taskId: string }>();
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;
  const { task, loading } = useTask(taskId);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-cream">
        {loading ? null : task ? <PayTaskPage task={task} /> : <TaskNotFound />}
      </main>
      <Footer />
    </>
  );
}
