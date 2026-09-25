"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  MessageCircle,
  IndianRupee,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ActivityItem = {
  id: string;
  type: "message" | "task_posted" | "task_completed" | "payment_released";
  title: string;
  description: string;
  userName: string;
  amount?: number;
  time: string;
  icon: typeof CheckCircle;
  iconColor: string;
  bgColor: string;
  href: string;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const items: ActivityItem[] = [];

      // Recent messages received
      const { data: messages } = await supabase
        .from("messages")
        .select("id, task_id, message_text, message_type, created_at, sender:profiles!messages_sender_id_fkey(full_name)")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      for (const m of messages ?? []) {
        const senderName = (m.sender as any)?.full_name || "Someone";
        items.push({
          id: `msg-${m.id}`,
          type: "message",
          title: m.message_type === "system" ? "Task update" : `New message from ${senderName}`,
          description: m.message_text,
          userName: senderName,
          time: m.created_at,
          icon: MessageCircle,
          iconColor: "text-blue-500",
          bgColor: "bg-blue-50",
          href: `/messages/${m.task_id}`,
        });
      }

      // Recently completed tasks (as customer)
      const { data: completedTasks } = await supabase
        .from("tasks")
        .select("id, title, total, updated_at, status")
        .eq("customer_id", user.id)
        .in("status", ["completed", "payment_released"])
        .order("updated_at", { ascending: false })
        .limit(5);

      for (const t of completedTasks ?? []) {
        items.push({
          id: `task-${t.id}`,
          type: t.status === "payment_released" ? "payment_released" : "task_completed",
          title: t.status === "payment_released" ? "Payment released" : "Task completed",
          description: t.title,
          userName: "You",
          amount: t.status === "payment_released" ? t.total : undefined,
          time: t.updated_at,
          icon: t.status === "payment_released" ? IndianRupee : CheckCircle,
          iconColor: "text-green-500",
          bgColor: "bg-green-50",
          href: `/tasks/${t.id}`,
        });
      }

      // Recently posted tasks
      const { data: postedTasks } = await supabase
        .from("tasks")
        .select("id, title, created_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      for (const t of postedTasks ?? []) {
        items.push({
          id: `posted-${t.id}`,
          type: "task_posted",
          title: "Task posted",
          description: t.title,
          userName: "You",
          time: t.created_at,
          icon: FileText,
          iconColor: "text-orange-500",
          bgColor: "bg-orange-50",
          href: `/tasks/${t.id}`,
        });
      }

      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(items.slice(0, 6));
      setLoading(false);
    }

    load();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Activity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading…</div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No activity yet. Post or accept a task to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <button
                  key={activity.id}
                  onClick={() => router.push(activity.href)}
                  className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`${activity.bgColor} p-2 rounded-lg flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${activity.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-xs bg-gray-100">
                                  {activity.userName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-500">{activity.userName}</span>
                            </div>
                            <span className="text-xs text-gray-400">{timeAgo(activity.time)}</span>
                          </div>
                        </div>

                        {activity.amount && (
                          <span className="text-sm font-semibold text-green-600 ml-2">
                            ₹{activity.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
