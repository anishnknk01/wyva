"use client";

import { FileText, Clock, CheckCircle, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardData } from "@/hooks/use-dashboard-data";

export function DashboardStats({ data }: { data: DashboardData }) {
  const { loading, myPostedTasks, activeTasks, completedTasks, totalSpent } = data;

  const stats = [
    {
      name: "Tasks Posted",
      value: myPostedTasks.length,
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      name: "In Progress",
      value: activeTasks.length,
      icon: Clock,
      color: "text-teal-500",
      bg: "bg-teal-50",
    },
    {
      name: "Completed",
      value: completedTasks.length,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      name: "Total Spent",
      value: `₹${totalSpent.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ name, value, icon: Icon, color, bg }) => (
        <Card key={name} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{name}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {loading ? "—" : value}
                </p>
              </div>
              <div className={`${bg} p-3 rounded-xl`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
