"use client";

import { useRouter } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@supabase/supabase-js";
import { useUnreadMessages } from "@/hooks/use-chat";
import { RoleSwitcher } from "@/components/ui/role-switcher";

interface DashboardHeaderProps {
  user: User | null;
  setSidebarOpen: (open: boolean) => void;
}

export function DashboardHeader({ user, setSidebarOpen }: DashboardHeaderProps) {
  const router = useRouter();
  const { unreadCount } = useUnreadMessages();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button and search */}
        <div className="flex items-center flex-1 max-w-2xl">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <form
            className="relative flex-1 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              const query = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value;
              router.push(query ? `/tasks?q=${encodeURIComponent(query)}` : "/tasks");
            }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              name="q"
              placeholder="Search for tasks, locations, or services..."
              className="pl-10 pr-4 py-2 w-full"
            />
          </form>
        </div>

        {/* Right side - Notifications and profile */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => router.push("/messages")}
            aria-label="Messages"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          <button
            onClick={() => router.push("/profile")}
            className="flex items-center space-x-3"
          >
            <div className="h-8 w-8 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <span className="text-sm text-gray-600">Hello,</span>
              <span className="text-sm font-medium text-gray-900 ml-1">{userName}!</span>
              <span className="ml-2 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">Customer</span>
            </div>
          </button>
          <RoleSwitcher currentRole="customer" />
        </div>
      </div>
    </header>
  );
}