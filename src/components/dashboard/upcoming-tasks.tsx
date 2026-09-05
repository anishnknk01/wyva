"use client";

import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const upcomingTasks = [
  {
    id: 1,
    date: "5",
    month: "Sep",
    title: "Need help taking my grand...",
    time: "5:00 PM",
    location: "Bajal, Mangalore",
  },
  {
    id: 2,
    date: "7", 
    month: "Sep",
    title: "Grocery shopping assistance",
    time: "11:00 AM",
    location: "Falnir, Mangalore",
  }
];

export function UpcomingTasks() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
        <Link 
          href="/my-tasks"
          className="text-sm text-teal-600 hover:text-teal-700 flex items-center"
        >
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingTasks.map((task) => (
          <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center justify-center bg-teal-50 rounded-lg p-2 min-w-[48px]">
              <span className="text-lg font-bold text-teal-600">{task.date}</span>
              <span className="text-xs text-teal-600">{task.month}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {task.title}
              </h4>
              <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {task.time}
                </span>
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {task.location}
                </span>
              </div>
            </div>
            
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}