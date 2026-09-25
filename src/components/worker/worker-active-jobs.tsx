"use client";

import { useRouter } from "next/navigation";
import { MapPin, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { taskStatusLabels } from "@/lib/tasks";
import type { Task } from "@/lib/task-store";

const STATUS_COLORS: Record<string, string> = {
  wysa_accepted: "border-blue-200 bg-blue-50 text-blue-700",
  confirmed:     "border-green-200 bg-green-50 text-green-700",
  in_progress:   "border-purple-200 bg-purple-50 text-purple-700",
  completed:     "border-gray-200 bg-gray-50 text-gray-600",
};

type Props = { tasks: Task[]; loading: boolean };

export function WorkerActiveJobs({ tasks, loading }: Props) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">My Active Jobs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="py-6 text-center text-sm text-gray-400">Loading…</p>}
        {!loading && tasks.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No active jobs. Accept a task to get started.</p>
        )}
        {!loading && tasks.map(task => (
          <div key={task.id} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</h3>
              <Badge className={`shrink-0 text-xs ${STATUS_COLORS[task.status] ?? "border-gray-200 bg-gray-50 text-gray-600"}`}>
                {taskStatusLabels[task.status]}
              </Badge>
            </div>
            <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{task.area}</span>
              <span className="font-semibold text-purple-600">₹{task.budget}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs"
                onClick={() => router.push(`/my-tasks/${task.id}`)}>
                View Details
              </Button>
              <Button variant="outline" size="sm" className="text-xs"
                onClick={() => router.push(`/messages/${task.id}?user=${task.customerId}`)}>
                <MessageCircle className="mr-1 h-3.5 w-3.5" /> Message
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
