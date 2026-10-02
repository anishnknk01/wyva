"use client";

import Link from 'next/link';
import { Bell, Plus } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/mobile-layout';
import { MobileDashboard } from '@/components/mobile/mobile-dashboard';
import { withAuth } from '@/lib/auth-guard';
import { useUnreadMessages } from '@/hooks/use-chat';

function NotificationBell() {
  const { unreadCount } = useUnreadMessages();
  return (
    <Link
      href="/mobile/messages"
      aria-label="Notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-50"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

// Header-right content for the Home screen only: bell + "Post a Task"
// pill, matching the reference design. Every other page still passes no
// headerRight and is completely unaffected.
function HomeHeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <NotificationBell />
      <Link
        href="/mobile/create-task"
        aria-label="Post a Task"
        className="flex items-center gap-1 whitespace-nowrap rounded-full bg-teal-600 px-3 py-2 text-sm font-medium text-white active:bg-teal-700"
      >
        <Plus className="h-4 w-4 shrink-0" />
        Post a Task
      </Link>
    </div>
  );
}

function MobileHomePage() {
  // No `title` here — the Home screen's own top section (location,
  // search) replaces the generic header title entirely, so there's no
  // duplicate heading between the header and body.
  return (
    <MobileLayout headerRight={<HomeHeaderActions />}>
      <MobileDashboard />
    </MobileLayout>
  );
}

export default withAuth(MobileHomePage);