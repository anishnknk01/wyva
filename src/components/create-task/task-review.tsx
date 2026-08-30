import { MapPin, CalendarDays, Clock, Hourglass, Tag } from "lucide-react";

import { formatCurrency, formatDateLong, formatTime12h, taskDurationLabel } from "@/lib/tasks";

export function TaskReview({
  title,
  description,
  category,
  area,
  locationNote,
  date,
  time,
  durationId,
  customHours,
  budget,
  platformFee,
}: {
  title: string;
  description: string;
  category: string;
  area: string;
  locationNote: string;
  date: string;
  time: string;
  durationId: string;
  customHours: number;
  budget: number;
  platformFee: number;
}) {
  const total = budget + platformFee;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="font-heading text-lg font-semibold">Review your task</h2>

      <div className="mt-4 flex flex-col gap-1">
        <p className="font-heading text-base font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <dl className="mt-5 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Tag className="size-3.5" />
            Category
          </dt>
          <dd className="text-right font-medium">{category}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5" />
            Location
          </dt>
          <dd className="text-right font-medium">
            {area}, Mangalore{locationNote ? ` · ${locationNote}` : ""}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Date
          </dt>
          <dd className="text-right font-medium">{formatDateLong(date)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" />
            Time
          </dt>
          <dd className="text-right font-medium">{formatTime12h(time)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Hourglass className="size-3.5" />
            Duration
          </dt>
          <dd className="text-right font-medium">
            {taskDurationLabel(durationId, customHours)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-medium">{formatCurrency(budget)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Platform fee</span>
          <span className="font-medium">{formatCurrency(platformFee)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base">
          <span className="font-heading font-semibold">Total</span>
          <span className="font-heading font-bold text-coral">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
