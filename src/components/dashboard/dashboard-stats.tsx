"use client";

import { FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  {
    title: "Total Tasks",
    value: "3",
    subtitle: "Tasks you have posted",
    icon: FileText,
    color: "blue",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    title: "Accepted",
    value: "1", 
    subtitle: "Helpers assigned",
    icon: CheckCircle,
    color: "green", 
    bgColor: "bg-green-50",
    iconColor: "text-green-600"
  },
  {
    title: "Pending",
    value: "1",
    subtitle: "Waiting for acceptance", 
    icon: Clock,
    color: "yellow",
    bgColor: "bg-yellow-50", 
    iconColor: "text-yellow-600"
  },
  {
    title: "Completed",
    value: "1",
    subtitle: "Help received",
    icon: XCircle,
    color: "red",
    bgColor: "bg-red-50",
    iconColor: "text-red-600"
  }
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`${stat.bgColor} rounded-lg p-3 mr-4`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-900">{stat.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}