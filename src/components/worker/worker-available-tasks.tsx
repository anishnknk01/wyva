"use client";

import { useRouter } from "next/navigation";
import { MapPin, Clock, IndianRupee, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acceptTask } from "@/lib/task-store";
import { taskDurations, taskStatusLabels } from "@/lib/tasks";
import { EligibilityGuard } from "@/components/worker/onboarding/eligibility-guard";
import type { Task } from "@/lib/task-store";

function durationLabel(id: string, hours: number) {
  if (id === "custom") return `${hours}h`;
  return taskDurations.find(d => d.id === id)?.label ?? `${hours}h`;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24)    return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Props = { tasks: Task[]; loading: boolean; onRefresh: () => void };

export function WorkerAvailableTasks({ tasks, loading, onRefresh }: Props) {
  const router = useRouter();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  async function handleApply(taskId: string) {
    setApplyingId(taskId);
    const updated = await acceptTask(taskId);
    setApplyingId(null);
    if (updated) { toast.success("Task accepted!"); onRefresh(); }
    else toast.error("Couldn't accept task. Please try again.");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">Available Tasks</CardTitle>
          <Button variant="outline" size="sm" onClick={() => router.push("/worker/find-tasks")}>
            View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
        )}
        {!loading && tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No tasks available right now. Check back soon.</p>
        )}
        {!loading && tasks.slice(0, 5).map(task => (
          <div key={task.id} className="rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</h3>
              <span className="ml-2 shrink-0 text-sm font-bold text-purple-600">₹{task.budget}</span>
            </div>
            <p className="mb-3 text-xs text-gray-500 line-clamp-2">{task.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{task.area}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{durationLabel(task.durationId, task.customHours)}</span>
              <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{task.budget}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <Badge variant="secondary" className="text-xs">{task.category}</Badge>
                <span className="text-xs text-gray-400">{timeAgo(task.createdAt)}</span>
              </div>
              <EligibilityGuard onEligible={() => handleApply(task.id)}>
                {({ onClick, loading: checking }) => (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    disabled={applyingId === task.id || checking}
                    onClick={onClick}
                  >
                    {applyingId === task.id ? "Applying…" : checking ? "Checking…" : "Accept"}
                  </Button>
                )}
              </EligibilityGuard>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
