"use client";

import { useEffect, useState } from "react";

import { loadTask, type Task } from "@/lib/task-store";

/** Loads a task by id from Supabase on mount. Returns loading state so
 * callers can avoid a flash of "not found" while the fetch is in flight. */
export function useTask(taskId: string | undefined) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    loadTask(taskId).then((loaded) => {
      if (active) {
        setTask(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [taskId]);

  return { task, loading, setTask };
}
