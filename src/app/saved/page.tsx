"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, MapPin, Clock, IndianRupee } from "lucide-react";
import { RoleLayout }    from "@/components/layout/role-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }         from "@/components/ui/badge";
import { Button }        from "@/components/ui/button";
import { listAvailableTasks, type Task } from "@/lib/task-store";
import { getSavedTaskIds, toggleSavedTask } from "@/lib/saved-tasks";
import { taskDurations, taskStatusLabels } from "@/lib/tasks";

function durationLabel(durationId: string, customHours: number) {
  if (durationId === "custom") return `${customHours}h`;
  return taskDurations.find((d) => d.id === durationId)?.label ?? `${customHours}h`;
}

function SavedContent() {
  const router = useRouter();
  const [savedTasks, setSavedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const savedIds = new Set(getSavedTaskIds());
      if (savedIds.size === 0) { setLoading(false); return; }
      const available = await listAvailableTasks();
      setSavedTasks(available.filter((t) => savedIds.has(t.id)));
      setLoading(false);
    }
    load();
  }, []);

  function handleUnsave(taskId: string) {
    toggleSavedTask(taskId);
    setSavedTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved Tasks</h1>
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : savedTasks.length === 0 ? (
        <div className="py-16 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved tasks yet</h3>
          <p className="text-gray-500 text-sm mb-4">Bookmark tasks to see them here.</p>
          <Button onClick={() => router.push("/tasks")} className="bg-teal-600 hover:bg-teal-700">Browse Tasks</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {savedTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUnsave(task.id)}>
                    <Bookmark className="h-4 w-4 fill-teal-600 text-teal-600" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{task.area}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{durationLabel(task.durationId, task.customHours)}</span>
                  <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{task.budget}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{taskStatusLabels[task.status]}</Badge>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => router.push(`/tasks/${task.id}`)}>View Task</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return <RoleLayout><SavedContent /></RoleLayout>;
}
