"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, IndianRupee, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { taskStatusLabels } from "@/lib/tasks";
import { getSavedTaskIds, toggleSavedTask } from "@/lib/saved-tasks";
import type { DashboardData } from "@/hooks/use-dashboard-data";
import type { Task } from "@/lib/task-store";

type Tab = "active" | "completed" | "all";

const STATUS_COLORS: Record<string, string> = {
  waiting_for_wysa: "bg-yellow-50 text-yellow-700 border-yellow-200",
  wysa_accepted:    "bg-blue-50 text-blue-700 border-blue-200",
  confirmed:        "bg-green-50 text-green-700 border-green-200",
  in_progress:      "bg-purple-50 text-purple-700 border-purple-200",
  completed:        "bg-teal-50 text-teal-700 border-teal-200",
  payment_released: "bg-gray-50 text-gray-600 border-gray-200",
  payment_pending:  "bg-orange-50 text-orange-700 border-orange-200",
  cancelled:        "bg-red-50 text-red-600 border-red-200",
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24)    return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const statusCls = STATUS_COLORS[task.status] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-gray-100 p-4 text-left hover:shadow-sm transition-shadow"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</h3>
        <Badge className={`shrink-0 text-xs border ${statusCls}`}>
          {taskStatusLabels[task.status]}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{task.area}</span>
        <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{task.budget}</span>
        <span className="text-gray-400">{timeAgo(task.createdAt)}</span>
      </div>
    </button>
  );
}

export function DashboardTasks({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { loading, myPostedTasks, activeTasks, completedTasks } = data;

  const [tab, setTab] = useState<Tab>("active");

  const tabs: { key: Tab; label: string; tasks: Task[] }[] = [
    { key: "active",    label: `In Progress (${activeTasks.length})`,    tasks: activeTasks },
    { key: "completed", label: `Completed (${completedTasks.length})`,   tasks: completedTasks },
    { key: "all",       label: `All (${myPostedTasks.length})`,          tasks: myPostedTasks },
  ];

  const visibleTasks = tabs.find(t => t.key === tab)?.tasks ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">My Tasks</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/my-tasks")}>
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => router.push("/create-task")}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Post Task
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading && <p className="py-8 text-center text-sm text-gray-400">Loading…</p>}

        {!loading && visibleTasks.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400 mb-4">
              {tab === "active"    ? "No tasks in progress." :
               tab === "completed" ? "No completed tasks yet." :
               "You haven't posted any tasks yet."}
            </p>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => router.push("/create-task")}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Post your first task
            </Button>
          </div>
        )}

        {!loading && visibleTasks.map(task => (
          <TaskRow key={task.id} task={task}
            onClick={() => router.push(`/my-tasks/${task.id}`)} />
        ))}
      </CardContent>
    </Card>
  );
}
