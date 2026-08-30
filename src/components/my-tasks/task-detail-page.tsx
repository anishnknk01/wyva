"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Clock,
  Hourglass,
  MessageCircle,
  Phone,
  ShieldCheck,
  PartyPopper,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WysaAcceptedCard } from "@/components/my-tasks/wysa-accepted-card";
import { TaskDoneCheckCard } from "@/components/my-tasks/task-done-check-card";
import { TaskStatusBanner } from "@/components/my-tasks/task-status-banner";
import { DisputeDialog } from "@/components/my-tasks/dispute-dialog";
import { RateDialog } from "@/components/my-tasks/rate-dialog";
import { ChatDialog } from "@/components/my-tasks/chat-dialog";
import { RequestCallDialog } from "@/components/my-tasks/request-call-dialog";
import {
  formatCurrency,
  formatDateLong,
  formatTime12h,
  taskDurationLabel,
  taskStatusLabels,
  getEffectiveStatus,
  type DisputeReason,
} from "@/lib/tasks";
import { updateTask, submitRating, type Task } from "@/lib/task-store";
import { getWysaProfile, type RealWysaProfile } from "@/lib/wysas";

export function MyTaskDetailPage({ task: initialTask }: { task: Task }) {
  const [task, setTask] = useState(initialTask);
  const [acceptedWysa, setAcceptedWysa] = useState<RealWysaProfile | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  const status = getEffectiveStatus(task.status, task.date, task.time);

  useEffect(() => {
    if (!task.acceptedWysaId) {
      setAcceptedWysa(null);
      return;
    }
    let active = true;
    getWysaProfile(task.acceptedWysaId).then((profile) => {
      if (active) setAcceptedWysa(profile);
    });
    return () => {
      active = false;
    };
  }, [task.acceptedWysaId]);

  async function handleConfirmWysa() {
    const updated = await updateTask(task.id, {
      status: "confirmed",
      confirmedWysaId: task.acceptedWysaId,
    });
    if (updated) setTask(updated);
    toast.success("Task confirmed");
  }

  async function handleChooseAnother() {
    const updated = await updateTask(task.id, {
      status: "waiting_for_wysa",
      acceptedWysaId: null,
    });
    if (updated) setTask(updated);
    toast.info("Task is open for other Wysas again");
  }

  async function handleTaskDone() {
    const updated = await updateTask(task.id, { status: "payment_released" });
    if (updated) setTask(updated);
    toast.success("Payment released");
  }

  function handleNotCompleted() {
    setDisputeOpen(true);
  }

  async function handleSubmitDispute(reason: DisputeReason) {
    const updated = await updateTask(task.id, {
      status: "under_review",
      dispute: { reason, submittedAt: new Date().toISOString() },
    });
    if (updated) setTask(updated);
    setDisputeOpen(false);
    toast.success("Issue submitted", { description: "Status: Under review" });
  }

  async function handleRate(stars: number, review: string) {
    if (!task.acceptedWysaId) return;
    const ok = await submitRating(
      task.id,
      task.customerId,
      task.acceptedWysaId,
      stars,
      review
    );
    if (ok) {
      setTask({
        ...task,
        userRating: { stars, review, submittedAt: new Date().toISOString() },
      });
      toast.success("Rating submitted");
    } else {
      toast.error("Couldn't submit rating");
    }
    setRateOpen(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/my-tasks"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to My Tasks
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Badge className="h-auto gap-1.5 rounded-full bg-sun/20 px-3 py-1 text-xs font-semibold text-sun-foreground">
            {taskStatusLabels[status]}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
        </div>

        <p className="mt-3 font-heading text-lg font-semibold">{task.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>

        <dl className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5" />
              Location
            </dt>
            <dd className="text-right font-medium">{task.area}, Mangalore</dd>
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
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Budget</dt>
            <dd className="text-right font-medium text-coral">
              {formatCurrency(task.budget)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {status === "waiting_for_wysa" && (
          <TaskStatusBanner variant="warning">
            Wysas nearby can now review your task and choose whether to
            accept it.
          </TaskStatusBanner>
        )}

        {status === "wysa_accepted" && acceptedWysa && (
          <WysaAcceptedCard
            wysa={acceptedWysa}
            onConfirm={handleConfirmWysa}
            onChooseAnother={handleChooseAnother}
          />
        )}

        {(status === "confirmed" || status === "in_progress") && acceptedWysa && (
          <>
            <TaskStatusBanner variant="info">
              {status === "in_progress" ? "Task started" : "Task confirmed"}{" "}
              with {acceptedWysa.name}.
            </TaskStatusBanner>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setChatOpen(true)}>
                <MessageCircle className="size-4" />
                Chat
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => setCallOpen(true)}>
                <Phone className="size-4" />
                Call
              </Button>
              <Button variant="outline" className="rounded-full" render={<Link href="/safety" />}>
                <ShieldCheck className="size-4" />
                Safety
              </Button>
            </div>
          </>
        )}

        {status === "completed" && (
          <TaskDoneCheckCard onTaskDone={handleTaskDone} onNotCompleted={handleNotCompleted} />
        )}

        {status === "payment_released" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-teal/30 bg-teal/5 p-4 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-teal">
                <PartyPopper className="size-4" />
                Task completed!
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Payment is now released to the Wysa.
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Wallet className="size-3.5" />
                  Task budget
                </span>
                <span className="font-medium">{formatCurrency(task.budget)}</span>
              </div>
            </div>
            {!task.userRating && acceptedWysa && (
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-full"
                onClick={() => setRateOpen(true)}
              >
                Rate {acceptedWysa.name}
              </Button>
            )}
          </div>
        )}

        {status === "under_review" && (
          <TaskStatusBanner variant="danger">
            Your issue has been submitted and is under review.
            {task.dispute ? ` Reason: ${task.dispute.reason}.` : ""}
          </TaskStatusBanner>
        )}

        {status === "cancelled" && (
          <TaskStatusBanner variant="danger">
            This task was cancelled.
          </TaskStatusBanner>
        )}
      </div>

      {acceptedWysa && (
        <>
          <ChatDialog
            otherName={acceptedWysa.name}
            open={chatOpen}
            onOpenChange={setChatOpen}
          />
          <RequestCallDialog
            otherName={acceptedWysa.name}
            open={callOpen}
            onOpenChange={setCallOpen}
          />
          <RateDialog
            open={rateOpen}
            onOpenChange={setRateOpen}
            subjectName={acceptedWysa.name}
            onSubmit={handleRate}
          />
        </>
      )}
      <DisputeDialog
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        onSubmit={handleSubmitDispute}
      />
    </div>
  );
}
