import { MapPin, CalendarDays, Clock, Hourglass, Tag } from "lucide-react";

import { formatCurrency, formatDateLong, formatTime12h, taskDurationLabel } from "@/lib/tasks";
import type { Task } from "@/lib/task-store";

export function TaskPaymentSummary({ task }: { task: Task }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <p className="font-heading text-base font-semibold">{task.title}</p>

      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Tag className="size-3.5" />
            Category
          </dt>
          <dd className="text-right font-medium">{task.category || "Not selected"}</dd>
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

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Task budget</span>
          <span className="font-medium">{formatCurrency(task.budget)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Platform fee</span>
          <span className="font-medium">{formatCurrency(task.platformFee)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base">
          <span className="font-heading font-semibold">Total</span>
          <span className="font-heading font-bold text-coral">
            {formatCurrency(task.total)}
          </span>
        </div>
      </div>
    </div>
  );
}
