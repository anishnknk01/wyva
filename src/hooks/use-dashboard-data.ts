"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { listAllTasksForCustomer, type Task } from "@/lib/task-store";

export type DashboardData = {
  loading: boolean;
  // Customer-only metrics — tasks THEY posted
  myPostedTasks: Task[];
  activeTasks: Task[];        // posted & currently in progress
  completedTasks: Task[];     // posted & completed
  totalSpent: number;         // sum paid for completed tasks
  // "Available" pool shown in the task browser widget
  availableTasks: Task[];
  refresh: () => void;
};

// Statuses that mean the task is still in progress from the customer's view
const IN_PROGRESS_STATUSES = new Set([
  "waiting_for_wysa",
  "wysa_accepted",
  "confirmed",
  "in_progress",
  "payment_pending",
]);

export function useDashboardData(): DashboardData {
  const [loading,        setLoading]        = useState(true);
  const [myPostedTasks,  setMyPostedTasks]  = useState<Task[]>([]);
  const [activeTasks,    setActiveTasks]    = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [totalSpent,     setTotalSpent]     = useState(0);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Only fetch tasks this user posted as a customer
    const posted = await listAllTasksForCustomer(user.id);

    const active    = posted.filter(t => IN_PROGRESS_STATUSES.has(t.status));
    const completed = posted.filter(t => ["completed","payment_released"].includes(t.status));
    const spent     = completed.reduce((sum, t) => sum + (t.total ?? 0), 0);

    // Fetch available tasks so customer can browse/re-post similar ones
    const { data: available } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "waiting_for_wysa")
      .order("created_at", { ascending: false })
      .limit(6);

    setMyPostedTasks(posted);
    setActiveTasks(active);
    setCompletedTasks(completed);
    setTotalSpent(spent);
    setAvailableTasks((available ?? []) as any);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return {
    loading,
    myPostedTasks,
    activeTasks,
    completedTasks,
    totalSpent,
    availableTasks,
    refresh: load,
  };
}

export function taskIsActive(task: Task) {
  return IN_PROGRESS_STATUSES.has(task.status);
}
