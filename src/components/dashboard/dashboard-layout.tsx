"use client";

import { useState, useEffect } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardContent } from './dashboard-content';
import { useAuthGuard } from '@/lib/auth-guard';

export function DashboardLayout() {
  const { user, loading } = useAuthGuard();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed width like in the image */}
      <div className="w-64 flex-shrink-0">
        <DashboardSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardContent 
          user={user}
          setSidebarOpen={setSidebarOpen}
        />
      </div>
    </div>
  );
}