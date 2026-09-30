"use client";

import { useState } from "react";
import { WorkerSidebar } from "@/components/worker/worker-sidebar";
import { WorkerHeader }  from "@/components/worker/worker-header";
import { useAuthGuard }  from "@/lib/auth-guard";
import { WorkerAvailableTasks } from "@/components/worker/worker-available-tasks";
import { useEffect, useCallback } from "react";
import { listAvailableTasks, type Task } from "@/lib/task-store";

function WorkerFindTasksPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const t = await listAvailableTasks();
    setTasks(t);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" /></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <WorkerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <WorkerHeader user={user} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="mb-6 text-xl font-bold text-gray-900">Find Tasks</h1>
          <WorkerAvailableTasks tasks={tasks} loading={loading} onRefresh={load} />
        </main>
      </div>
    </div>
  );
}
export default WorkerFindTasksPage;
