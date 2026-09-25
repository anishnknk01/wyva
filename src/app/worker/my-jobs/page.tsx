"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkerSidebar } from "@/components/worker/worker-sidebar";
import { WorkerHeader }  from "@/components/worker/worker-header";
import { WorkerActiveJobs } from "@/components/worker/worker-active-jobs";
import { useAuthGuard }  from "@/lib/auth-guard";
import { listWysaAcceptedTasks, listWysaCompletedTasks, type Task } from "@/lib/task-store";

function WorkerMyJobsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active,    setActive]    = useState<Task[]>([]);
  const [completed, setCompleted] = useState<Task[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab, setTab] = useState<"active"|"completed">("active");

  const load = useCallback(async () => {
    if (!user) return;
    const [a, c] = await Promise.all([listWysaAcceptedTasks(user.id), listWysaCompletedTasks(user.id)]);
    setActive(a); setCompleted(c); setLoading(false);
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" /></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="w-64 shrink-0"><WorkerSidebar /></div>
      <div className="flex flex-1 flex-col min-w-0">
        <WorkerHeader user={user} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="mb-4 text-xl font-bold text-gray-900">My Jobs</h1>
          <div className="mb-5 flex gap-2">
            {(["active","completed"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-purple-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {t === "active" ? `Active (${active.length})` : `Completed (${completed.length})`}
              </button>
            ))}
          </div>
          <WorkerActiveJobs tasks={tab === "active" ? active : completed} loading={loading} />
        </main>
      </div>
    </div>
  );
}
export default WorkerMyJobsPage;
