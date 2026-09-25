"use client";

import { CheckCircle, Clock, IndianRupee, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  completedTasks: number;
  activeTasks: number;
  earnings: number;
  rating: number | null;
  totalRatings: number | null;
  loading: boolean;
};

export function WorkerStats({ completedTasks, activeTasks, earnings, rating, totalRatings, loading }: Props) {
  const stats = [
    { label: "Active Jobs",       value: loading ? "—" : activeTasks,              icon: Clock,        bg: "bg-blue-50",   icon_cls: "text-blue-500" },
    { label: "Completed",         value: loading ? "—" : completedTasks,            icon: CheckCircle,  bg: "bg-green-50",  icon_cls: "text-green-500" },
    { label: "Total Earnings",    value: loading ? "—" : `₹${earnings.toLocaleString()}`, icon: IndianRupee, bg: "bg-purple-50", icon_cls: "text-purple-500" },
    { label: "Avg Rating",        value: loading ? "—" : (rating && totalRatings ? `${rating.toFixed(1)} (${totalRatings})` : "No ratings"), icon: Star, bg: "bg-amber-50", icon_cls: "text-amber-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, bg, icon_cls }) => (
        <Card key={label} className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`${bg} rounded-xl p-3`}>
              <Icon className={`h-5 w-5 ${icon_cls}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
