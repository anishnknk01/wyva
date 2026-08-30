import { MapPin, CalendarDays, Clock, Hourglass, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateLong, formatTime12h, taskDurationLabel } from "@/lib/tasks";
import type { Task } from "@/lib/task-store";

export function TaskCard({
  task,
  onView,
}: {
  task: Task;
  onView: (task: Task) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onView(task)}
        className="flex flex-col gap-3 p-4 text-left sm:p-5"
      >
        <div className="flex items-start justify-between gap-2">
          <Badge className="h-auto gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-semibold text-coral">
            {task.category || "General"}
          </Badge>
          <span className="shrink-0 font-heading text-base font-bold text-coral">
            {formatCurrency(task.budget)}
          </span>
        </div>

        <h3 className="font-heading text-lg font-semibold leading-tight">
          {task.title}
        </h3>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {task.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 text-coral" />
            {task.area}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDateLong(task.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatTime12h(task.time)}
          </span>
          <span className="flex items-center gap-1">
            <Hourglass className="size-3.5" />
            {taskDurationLabel(task.durationId, task.customHours)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-teal">
          <Users className="size-3.5" />
          {task.interestedCount} {task.interestedCount === 1 ? "person" : "people"} interested
        </div>
      </button>

      <div className="border-t border-border p-3">
        <Button className="w-full rounded-full" onClick={() => onView(task)}>
          View task
        </Button>
      </div>
    </div>
  );
}
