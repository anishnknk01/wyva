"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, Plus, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activities = [
  {
    id: 1,
    type: "accepted",
    title: "Your task was accepted",
    description: "Grocery shopping assistance",
    time: "2 hours ago",
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    id: 2,
    type: "posted",
    title: "You posted a new task", 
    description: "Need help taking my grandmother...",
    time: "5 hours ago",
    icon: Plus,
    iconColor: "text-blue-600", 
    bgColor: "bg-blue-50"
  },
  {
    id: 3,
    type: "completed",
    title: "Task completed",
    description: "Help with computer set-up",
    time: "3 days ago",
    icon: Clock,
    iconColor: "text-gray-600",
    bgColor: "bg-gray-50"
  }
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Link 
          href="/activity"
          className="text-sm text-teal-600 hover:text-teal-700 flex items-center"
        >
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`${activity.bgColor} rounded-full p-2`}>
                <Icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}