"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Search, 
  Plus, 
  MessageSquare, 
  User,
  ArrowLeft,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileErrorBoundary } from './error-boundary';
import { NetworkStatus } from './network-status';
import { OfflineBanner } from './offline-banner';
import { LoadingProvider } from './loading-state-manager';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { AnalyticsDashboard, PerformanceIndicator } from './analytics-dashboard';
import { useUnreadMessages } from '@/hooks/use-chat';
import { notificationService } from '@/lib/notifications';
import { useSwipeNavigation } from '@/hooks/use-gestures';
import { useUserBehaviorAnalytics } from '@/hooks/use-analytics-tracking';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showBottomNav?: boolean;
  onBack?: () => void;
}

const bottomNavItems = [
  { icon: Home, label: 'Home', href: '/mobile' },
  { icon: Search, label: 'Find', href: '/mobile/find-tasks' },
  { icon: Plus, label: 'Post', href: '/mobile/create-task' },
  { icon: MessageSquare, label: 'Chats', href: '/mobile/messages' },
  { icon: User, label: 'Profile', href: '/mobile/profile' },
];

export function MobileLayout({ 
  children, 
  title, 
  showBack = false, 
  showBottomNav = true,
  onBack 
}: MobileLayoutProps) {
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();
  const { trackButtonClick, trackGestureUsage } = useUserBehaviorAnalytics();

  // Handle swipe navigation between main sections with analytics
  const { ref: swipeRef } = useSwipeNavigation(
    () => {
      // Swipe left - go to next section
      trackGestureUsage('swipe_left', 'navigation');
      const currentIndex = bottomNavItems.findIndex(item => item.href === pathname);
      const nextIndex = (currentIndex + 1) % bottomNavItems.length;
      const nextHref = bottomNavItems[nextIndex]?.href;
      if (nextHref && nextHref !== pathname) {
        window.location.href = nextHref;
      }
    },
    () => {
      // Swipe right - go to previous section  
      trackGestureUsage('swipe_right', 'navigation');
      const currentIndex = bottomNavItems.findIndex(item => item.href === pathname);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : bottomNavItems.length - 1;
      const prevHref = bottomNavItems[prevIndex]?.href;
      if (prevHref && prevHref !== pathname) {
        window.location.href = prevHref;
      }
    }
  );

  // Initialize push notifications on app load
  useEffect(() => {
    const initNotifications = async () => {
      if (typeof window !== 'undefined') {
        await notificationService.initialize();
        
        // Auto-request permission if not set (but don't be intrusive)
        const permission = notificationService.getPermissionStatus();
        if (permission === 'default' && localStorage.getItem('push-prompt-shown') !== 'true') {
          // Show a subtle prompt later, not immediately on load
          setTimeout(() => {
            if (notificationService.getPermissionStatus() === 'default') {
              // Could show a banner or toast here to encourage enabling notifications
              console.log('Push notifications available - user can enable in settings');
            }
          }, 5000);
        }
      }
    };

    initNotifications();
  }, []);

  return (
    <AnalyticsProvider>
      <div ref={swipeRef} className="flex flex-col h-screen bg-white">
        <NetworkStatus />
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => {
                  trackButtonClick('back', pathname);
                  onBack?.();
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-gray-900">
              {title || 'Wysa'}
            </h1>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => trackButtonClick('menu', pathname)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Main Content with Error Boundary and Loading Provider */}
        <main className="flex-1 overflow-y-auto">
          {/* Offline Status Banner */}
          <div className="sticky top-0 z-10 p-2">
            <OfflineBanner />
          </div>
          
          <MobileErrorBoundary>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </MobileErrorBoundary>
        </main>

        {/* Bottom Navigation */}
        {showBottomNav && (
          <nav className="bg-white border-t border-gray-200 px-2 py-1">
            <div className="flex justify-around">
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isMessages = item.href === '/mobile/messages';
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center py-2 px-3 rounded-lg min-w-0 flex-1 relative ${
                      isActive 
                        ? 'text-teal-600 bg-teal-50' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => trackButtonClick('nav_' + item.label.toLowerCase(), item.href)}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                    {isMessages && unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
        
        {/* Analytics Dashboard (dev only) */}
        <AnalyticsDashboard />
        <PerformanceIndicator />
      </div>
    </AnalyticsProvider>
  );
}