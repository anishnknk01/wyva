"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WysaTaskRow } from "@/components/wysa-tasks/wysa-task-row";
import { formatCurrency } from "@/lib/tasks";
import {
  listAvailableTasks,
  listWysaAcceptedTasks,
  listWysaCompletedTasks,
  calculateWysaEarnings,
  type Task,
} from "@/lib/task-store";
import { useUser } from "@/lib/use-user";

export function WysaTasksPage() {
  const { user, loading: userLoading } = useUser();
  const [availableCount, setAvailableCount] = useState(0);
  const [accepted, setAccepted] = useState<Task[]>([]);
  const [completed, setCompleted] = useState<Task[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([
      listAvailableTasks(),
      listWysaAcceptedTasks(user.id),
      listWysaCompletedTasks(user.id),
      calculateWysaEarnings(user.id),
    ]).then(([availableTasks, acceptedTasks, completedTasks, totalEarnings]) => {
      if (!active) return;
      setAvailableCount(availableTasks.length);
      setAccepted(acceptedTasks);
      setCompleted(completedTasks);
      setEarnings(totalEarnings);
      setLoading(false);
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

      <h1 className="font-heading text-2xl font-bold sm:text-3xl">Wysa dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track the tasks you&apos;ve taken on and what you&apos;ve earned.
      </p>

      {!userLoading && !user ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-coral hover:underline">
            Log in
          </Link>{" "}
          to see your accepted tasks and earnings.
        </div>
      ) : loading ? null : (
        <>
          {/* Estimated Earnings */}
          <div className="mt-6 rounded-2xl border border-teal/30 bg-teal/5 p-5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-teal">
              <Wallet className="size-4" />
              Estimated earnings
            </p>
            <p className="mt-1 font-heading text-3xl font-bold">{formatCurrency(earnings)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              From {completed.length} completed task{completed.length === 1 ? "" : "s"} with
              payment released.
            </p>
          </div>

          {/* Available Tasks */}
          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-1.5 font-heading text-lg font-semibold">
                <Briefcase className="size-4.5 text-coral" />
                Available tasks
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                render={<Link href="/tasks" />}
              >
                View all
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {availableCount} task{availableCount === 1 ? "" : "s"} nearby waiting for a
              Wysa.
            </p>
          </section>

          {/* My Accepted Tasks */}
          <section className="mt-8">
            <h2 className="font-heading text-lg font-semibold">My accepted tasks</h2>
            <div className="mt-3 flex flex-col gap-3">
              {accepted.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  You haven&apos;t accepted any tasks yet.{" "}
                  <Link href="/tasks" className="font-medium text-coral hover:underline">
                    Find a task
                  </Link>
                </div>
              ) : (
                accepted.map((task) => <WysaTaskRow key={task.id} task={task} />)
              )}
            </div>
          </section>

          {/* Completed Tasks */}
          <section className="mt-8">
            <h2 className="flex items-center gap-1.5 font-heading text-lg font-semibold">
              <CheckCircle2 className="size-4.5 text-teal" />
              Completed tasks
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {completed.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Completed tasks with payment released will show up here.
                </div>
              ) : (
                completed.map((task) => <WysaTaskRow key={task.id} task={task} />)
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
