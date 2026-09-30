"use client";

import { useState } from "react";
import { WorkerSidebar } from "@/components/worker/worker-sidebar";
import { WorkerHeader }  from "@/components/worker/worker-header";
import { useAuthGuard }  from "@/lib/auth-guard";
import { SectionRatings } from "@/components/profile/section-ratings";
import { useWorkerProfile } from "@/hooks/use-worker-profile";

function WorkerReviewsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const { data }  = useWorkerProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading || !data) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" /></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <WorkerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <WorkerHeader user={user} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6 max-w-3xl">
          <h1 className="mb-6 text-xl font-bold text-gray-900">My Reviews</h1>
          <SectionRatings data={data} />
        </main>
      </div>
    </div>
  );
}
export default WorkerReviewsPage;
