import Link from "next/link";
import { Rocket, MapPin, CalendarDays, Clock, Hourglass, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateLong, formatTime12h, taskDurationLabel } from "@/lib/tasks";
import type { Task } from "@/lib/task-store";

export function TaskPostedPage({ task }: { task: Task }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-coral/10 text-coral">
          <Rocket className="size-8" />
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">
          Your task is live!
        </h1>
        <Badge className="mt-3 h-auto gap-1.5 rounded-full bg-sun/20 px-3 py-1 text-xs font-semibold text-sun-foreground">
          Waiting for Wysa
        </Badge>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="font-heading text-base font-semibold">{task.title}</p>

        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Budget</dt>
            <dd className="text-right font-medium text-coral">
              {formatCurrency(task.budget)}
            </dd>
          </div>
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
        </dl>
      </div>

      <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-teal/30 bg-teal/5 p-4 text-sm text-foreground">
        <Users className="size-4 shrink-0 text-teal" />
        Wysas nearby can now review your task and choose whether to accept
        it.
      </div>

      <Button
        size="lg"
        className="mt-6 w-full rounded-full"
        render={<Link href={`/my-tasks/${task.id}`} />}
      >
        View my task
      </Button>
    </div>
  );
}
