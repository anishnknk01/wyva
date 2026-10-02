"use client";

import Link from 'next/link';
import { Bell } from 'lucide-react';
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

function MobileHomePage() {
  // No `title` here — the Home screen's own top section (greeting,
  // location, search) replaces the generic header title entirely, so
  // there's no duplicate "Good morning" text between the header and body.
  return (
    <MobileLayout headerRight={<NotificationBell />}>
      <MobileDashboard />
    </MobileLayout>
  );
}

export default withAuth(MobileHomePage);