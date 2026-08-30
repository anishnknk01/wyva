"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskCardSkeleton } from "@/components/tasks/task-card-skeleton";
import { TasksEmptyState } from "@/components/tasks/tasks-empty-state";
import { taskCategories, taskAreas } from "@/lib/tasks";
import { listAvailableTasks, type Task } from "@/lib/task-store";

export function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Any category");
  const [area, setArea] = useState("Any area");

  useEffect(() => {
    let active = true;
    listAvailableTasks().then((loaded) => {
      if (active) {
        setTasks(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (category !== "Any category" && task.category !== category) return false;
      if (area !== "Any area" && task.area !== area) return false;
      return true;
    });
  }, [tasks, category, area]);

  function handleView(task: Task) {
    router.push(`/tasks/${task.id}`);
  }

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-gradient-to-b from-cream via-background to-background">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-coral/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-8 sm:px-6 sm:pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold text-coral shadow-sm">
              <Briefcase className="size-3.5" />
              Available Tasks
            </span>
            <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Find Tasks
            </h1>
            <p className="mt-2 text-muted-foreground">
              People in Mangalore posting what they need. Pick a task that
              works for you.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              render={<Link href="/wysa-tasks" />}
            >
              <LayoutDashboard className="size-3.5" />
              My Wysa dashboard
            </Button>
          </div>

          <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <Select value={category} onValueChange={(v) => setCategory(v ?? "Any category")}>
              <SelectTrigger className="w-full sm:flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Any category">Any category</SelectItem>
                {taskCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={area} onValueChange={(v) => setArea(v ?? "Any area")}>
              <SelectTrigger className="w-full sm:flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Any area">Any area</SelectItem>
                {taskAreas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Loading tasks..."
            : `${filtered.length} task${filtered.length === 1 ? "" : "s"} available`}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <TaskCardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="sm:col-span-2">
              <TasksEmptyState />
            </div>
          ) : (
            filtered.map((task) => (
              <TaskCard key={task.id} task={task} onView={handleView} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
