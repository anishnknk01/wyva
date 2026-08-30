import Link from "next/link";
import { MapPin, CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateLong, taskStatusLabels } from "@/lib/tasks";
import type { Task } from "@/lib/task-store";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  payment_pending: "bg-sun/20 text-sun-foreground",
  waiting_for_wysa: "bg-sun/20 text-sun-foreground",
  wysa_accepted: "bg-primary/10 text-primary",
  confirmed: "bg-teal/10 text-teal",
  in_progress: "bg-teal/10 text-teal",
  completed: "bg-teal/10 text-teal",
  payment_released: "bg-teal/15 text-teal",
  cancelled: "bg-destructive/10 text-destructive",
  under_review: "bg-destructive/10 text-destructive",
};

export function MyTaskRow({ task }: { task: Task }) {
  return (
    <Link
      href={`/my-tasks/${task.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge
            className={`h-auto gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[task.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {taskStatusLabels[task.status]}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
        </div>
        <p className="font-heading text-base font-semibold">{task.title}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 text-coral" />
            {task.area}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDateLong(task.date)}
          </span>
        </div>
      </div>

      <span className="font-heading text-lg font-bold text-coral">
        {formatCurrency(task.budget)}
      </span>
    </Link>
  );
}
