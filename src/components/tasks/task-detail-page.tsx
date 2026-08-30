"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Clock,
  Hourglass,
  Tag,
  Languages,
  Heart,
  X,
  ClipboardCheck,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AcceptTaskDialog } from "@/components/tasks/accept-task-dialog";
import { TaskStatusBanner } from "@/components/my-tasks/task-status-banner";
import { RateDialog } from "@/components/my-tasks/rate-dialog";
import {
  formatCurrency,
  formatDateLong,
  formatTime12h,
  taskDurationLabel,
  getEffectiveStatus,
  taskStatusLabels,
} from "@/lib/tasks";
import { updateTask, submitRating, type Task } from "@/lib/task-store";
import { useUser } from "@/lib/use-user";

export function TaskDetailPage({ task: initialTask }: { task: Task }) {
  const { user } = useUser();
  const [task, setTask] = useState(initialTask);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  const isMine = !!user && task.acceptedWysaId === user.id;
  const status = getEffectiveStatus(task.status, task.date, task.time);

  async function handleAccept() {
    if (!user) {
      toast.error("Please log in to accept a task.");
      return;
    }
    const updated = await updateTask(task.id, {
      status: "wysa_accepted",
      acceptedWysaId: user.id,
      interestedCount: task.interestedCount + 1,
    });
    if (updated) setTask(updated);
    setAcceptOpen(false);
    toast.success("Task accepted");
  }

  async function handleMarkComplete() {
    const updated = await updateTask(task.id, { status: "completed" });
    if (updated) setTask(updated);
    toast.success("Marked as complete", {
      description: "Waiting for the customer to confirm the task is done.",
    });
  }

  async function handleRate(stars: number, review: string) {
    if (!user) return;
    const ok = await submitRating(task.id, user.id, task.customerId, stars, review);
    if (ok) {
      setTask({
        ...task,
        wysaRating: { stars, review, submittedAt: new Date().toISOString() },
      });
      toast.success("Rating submitted");
    } else {
      toast.error("Couldn't submit rating");
    }
    setRateOpen(false);
  }

  if (dismissed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <X className="size-6" />
        </span>
        <h1 className="mt-4 font-heading text-xl font-semibold">
          No worries, this task isn&apos;t for you.
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You can keep browsing for other tasks that fit better.
        </p>
        <Button className="mt-6 rounded-full" render={<Link href="/tasks" />}>
          Find more tasks
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/tasks"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to tasks
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <Badge className="h-auto gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-xs font-semibold text-coral">
            {task.category || "General"}
          </Badge>
          <span className="font-heading text-xl font-bold text-coral">
            {formatCurrency(task.budget)}
          </span>
        </div>

        <h1 className="mt-3 font-heading text-2xl font-bold">{task.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {task.description}
        </p>

        <dl className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Tag className="size-3.5" />
              Category
            </dt>
            <dd className="text-right font-medium">{task.category || "General"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5" />
              Location
            </dt>
            <dd className="text-right font-medium">
              {task.area}, Mangalore
              {task.locationNote ? ` · ${task.locationNote}` : ""}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Date
            </dt>
            <dd className="text-right font-medium">{formatDateLong(task.date)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5" />
              Time
            </dt>
            <dd className="text-right font-medium">{formatTime12h(task.time)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Hourglass className="size-3.5" />
              Duration
            </dt>
            <dd className="text-right font-medium">
              {taskDurationLabel(task.durationId, task.customHours)}
            </dd>
          </div>
        </dl>

        {(task.languages.length > 0 || task.interests.length > 0) && (
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
            {task.languages.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Languages className="size-3.5" />
                  Preferred languages
                </p>
                <p className="mt-1 text-sm">{task.languages.join(" • ")}</p>
              </div>
            )}
            {task.interests.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Heart className="size-3.5" />
                  Interests
                </p>
                <p className="mt-1 text-sm">{task.interests.join(" • ")}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        {!task.acceptedWysaId ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full sm:flex-1"
              onClick={() => setDismissed(true)}
            >
              Not for me
            </Button>
            <Button
              size="lg"
              className="rounded-full sm:flex-1"
              onClick={() => {
                if (!user) {
                  toast.error("Please log in to accept a task.");
                  return;
                }
                setAcceptOpen(true);
              }}
            >
              I can do this
            </Button>
          </div>
        ) : !isMine ? (
          <TaskStatusBanner variant="warning">
            This task has already been accepted by another Wysa.
          </TaskStatusBanner>
        ) : status === "wysa_accepted" ? (
          <TaskStatusBanner variant="info">
            You&apos;ve accepted this task. Waiting for the customer to
            confirm you.
          </TaskStatusBanner>
        ) : status === "confirmed" ? (
          <TaskStatusBanner variant="info">
            {taskStatusLabels.confirmed}. The task starts at{" "}
            {formatTime12h(task.time)} on {formatDateLong(task.date)}.
          </TaskStatusBanner>
        ) : status === "in_progress" ? (
          <div className="flex flex-col gap-3">
            <TaskStatusBanner variant="info">Task started</TaskStatusBanner>
            <Button size="lg" className="w-full rounded-full" onClick={handleMarkComplete}>
              <ClipboardCheck className="size-4" />
              Mark task complete
            </Button>
          </div>
        ) : status === "completed" ? (
          <TaskStatusBanner variant="warning">
            Waiting for the customer to confirm the task is done.
          </TaskStatusBanner>
        ) : status === "payment_released" ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-teal/30 bg-teal/5 p-4 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-teal">
                <Wallet className="size-4" />
                Payment released
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Task budget</span>
                <span className="font-medium">{formatCurrency(task.budget)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your earnings</span>
                <span className="font-heading font-bold text-teal">
                  {formatCurrency(task.budget)}
                </span>
              </div>
            </div>
            {!task.wysaRating && (
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-full"
                onClick={() => setRateOpen(true)}
              >
                Rate customer
              </Button>
            )}
          </div>
        ) : status === "under_review" ? (
          <TaskStatusBanner variant="danger">
            The customer reported an issue with this task. It&apos;s under
            review.
          </TaskStatusBanner>
        ) : status === "cancelled" ? (
          <TaskStatusBanner variant="danger">
            This task was cancelled.
          </TaskStatusBanner>
        ) : (
          <TaskStatusBanner variant="info">
            {taskStatusLabels[status]}
          </TaskStatusBanner>
        )}
      </div>

      <AcceptTaskDialog
        open={acceptOpen}
        onOpenChange={setAcceptOpen}
        onConfirmAccept={handleAccept}
      />
      <RateDialog
        open={rateOpen}
        onOpenChange={setRateOpen}
        subjectName="the customer"
        onSubmit={handleRate}
      />
    </div>
  );
}
