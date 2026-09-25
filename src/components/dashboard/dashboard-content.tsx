"use client";

import { DashboardHeader } from './dashboard-header';
import { DashboardStats } from './dashboard-stats';
import { DashboardTasks } from './dashboard-tasks';
import { DashboardCalendar } from './dashboard-calendar';
import { RecentActivity } from './recent-activity';
import { useDashboardData } from '@/hooks/use-dashboard-data';

interface DashboardContentProps {
  user: any;
  setSidebarOpen: (open: boolean) => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardContent({ user, setSidebarOpen }: DashboardContentProps) {
  const data = useDashboardData();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <DashboardHeader user={user} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content - matching the image layout */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {getGreeting()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-gray-500 text-sm">Here's an overview of your tasks.</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <DashboardStats data={data} />
          </div>

          {/* Main Grid Layout - matching the image */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tasks (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <DashboardTasks data={data} />
            </div>

            {/* Right Column - Calendar & Activity (1/3 width) */}
            <div className="space-y-6">
              <DashboardCalendar data={data} />
              <RecentActivity />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}