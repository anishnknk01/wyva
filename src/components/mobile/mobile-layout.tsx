"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileErrorBoundary } from './error-boundary';
import { NetworkStatus } from './network-status';
import { OfflineBanner } from './offline-banner';
import { LoadingProvider } from './loading-state-manager';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { AnalyticsDashboard, PerformanceIndicator } from './analytics-dashboard';
import { notificationService } from '@/lib/notifications';
import { useSwipeNavigation } from '@/hooks/use-gestures';
import { useUserBehaviorAnalytics } from '@/hooks/use-analytics-tracking';
import { MobileNavRail } from './mobile-nav-rail';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showBottomNav?: boolean;
  onBack?: () => void;
}

// Kept in sync with the items inside MobileNavRail — used here only to
// drive the existing left/right swipe-between-sections gesture.
const navSections = [
  '/mobile',
  '/mobile/find-tasks',
  '/mobile/create-task',
  '/mobile/messages',
  '/mobile/profile',
];

export function MobileLayout({ 
  children, 
  title, 
  showBack = false, 
  showBottomNav = true,
  onBack 
}: MobileLayoutProps) {
  const pathname = usePathname();
  const { trackButtonClick, trackGestureUsage } = useUserBehaviorAnalytics();

  // Handle swipe navigation between main sections with analytics
  const { ref: swipeRef } = useSwipeNavigation<HTMLDivElement>(
    () => {
      // Swipe left - go to next section
      trackGestureUsage('swipe_left', 'navigation');
      const currentIndex = navSections.findIndex(href => href === pathname);
      const nextIndex = (currentIndex + 1) % navSections.length;
      const nextHref = navSections[nextIndex];
      if (nextHref && nextHref !== pathname) {
        window.location.href = nextHref;
      }
    },
    () => {
      // Swipe right - go to previous section  
      trackGestureUsage('swipe_right', 'navigation');
      const currentIndex = navSections.findIndex(href => href === pathname);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : navSections.length - 1;
      const prevHref = navSections[prevIndex];
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
      <div ref={swipeRef} className="flex h-screen bg-white">
        {/* Left navigation rail — fixed, collapsed by default (~64px),
            expands into an overlay drawer on tap. Replaces the old bottom
            nav bar entirely. Rendered unconditionally (not gated by
            showBottomNav) since it's now the only navigation surface this
            layout offers; showBottomNav is kept as a prop for backward
            compatibility with existing callers but no longer changes
            anything structural. */}
        {showBottomNav && (
          <MobileNavRail onTrackClick={(label, href) => trackButtonClick('nav_' + label.toLowerCase(), href)} />
        )}

        {/* Content column — offset to clear the fixed rail's width (64px)
            when the rail is shown; pages that opt out of nav (task
            creation, payment, profile edit — focused single-task flows)
            get the full width back instead of a blank 64px gap. */}
        <div className={`flex min-w-0 flex-1 flex-col ${showBottomNav ? 'pl-16' : ''}`}>
          <NetworkStatus />

          {/* Top Header */}
          <header className="flex items-center border-b border-gray-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
        </div>

        {/* Analytics Dashboard (dev only) */}
        <AnalyticsDashboard />
        <PerformanceIndicator />
      </div>
    </AnalyticsProvider>
  );
}