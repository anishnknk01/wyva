"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MyTaskRow } from "@/components/my-tasks/my-task-row";
import { MyTasksEmptyState } from "@/components/my-tasks/my-tasks-empty-state";
import { listAllTasksForCustomer, type Task } from "@/lib/task-store";
import { useUser } from "@/lib/use-user";

export function MyTasksPage() {
  const { user, loading: userLoading } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    let active = true;
    listAllTasksForCustomer(user.id).then((loaded) => {
      if (active) {
        setTasks(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [user, userLoading]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </Link>

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">My Tasks</h1>
        <Button className="rounded-full" render={<Link href="/create-task" />}>
          Post a Task
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {userLoading || loading ? null : !user ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-coral hover:underline">
              Log in
            </Link>{" "}
            to see the tasks you&apos;ve posted.
          </div>
        ) : tasks.length === 0 ? (
          <MyTasksEmptyState />
        ) : (
          tasks.map((task) => <MyTaskRow key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
