"use client";

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayoutWrapper({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* No child page here renders its own header, so without this
            there's no way to open the mobile sidebar below lg. */}
        <div className="flex items-center border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}