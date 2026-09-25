"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  listAvailableTasks,
  listWysaAcceptedTasks,
  listWysaCompletedTasks,
  calculateWysaEarnings,
  type Task,
} from "@/lib/task-store";
import { WorkerStats }            from "./worker-stats";
import { WorkerAvailableTasks }   from "./worker-available-tasks";
import { WorkerActiveJobs }       from "./worker-active-jobs";
import { ProfileCompletionCard }  from "@/components/worker/onboarding/profile-completion-card";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type Props = { user: User | null };

export function WorkerDashboardContent({ user }: Props) {
  const [available,   setAvailable]   = useState<Task[]>([]);
  const [active,      setActive]      = useState<Task[]>([]);
  const [completed,   setCompleted]   = useState<Task[]>([]);
  const [earnings,    setEarnings]    = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const [avail, acc, comp, earn, { data: profile }] = await Promise.all([
      listAvailableTasks(),
      listWysaAcceptedTasks(user.id),
      listWysaCompletedTasks(user.id),
      calculateWysaEarnings(user.id),
      supabase.from("profiles")
        .select("average_rating, total_ratings")
        .eq("id", user.id).single(),
    ]);
    setAvailable(avail);
    setActive(acc);
    setCompleted(comp);
    setEarnings(earn);
    setProfileData(profile);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {firstName}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening with your work today.
          </p>
        </div>

        {/* Stats */}
        <WorkerStats
          activeTasks={active.length}
          completedTasks={completed.length}
          earnings={earnings}
          rating={profileData?.average_rating ?? null}
          totalRatings={profileData?.total_ratings ?? null}
          loading={loading}
        />

        {/* Real server-driven profile completion + eligibility */}
        <ProfileCompletionCard compact />

        {/* Two-column task grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <WorkerAvailableTasks tasks={available} loading={loading} onRefresh={load} />
          <WorkerActiveJobs tasks={active} loading={loading} />
        </div>
      </div>
    </main>
  );
}
