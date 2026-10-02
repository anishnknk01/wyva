"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Menu } from 'lucide-react';
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
  // Optional content rendered at the right edge of the header (e.g. a
  // notification bell on the Home screen). Every other page leaves this
  // unset and the header is completely unchanged.
  headerRight?: React.ReactNode;
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
  onBack,
  headerRight,
}: MobileLayoutProps) {
  const pathname = usePathname();
  const { trackButtonClick, trackGestureUsage } = useUserBehaviorAnalytics();
  const [navOpen, setNavOpen] = useState(false);

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
      <div ref={swipeRef} className="flex h-screen flex-col bg-white">
        <NetworkStatus />

        {/* Top Header — the hamburger button here is the ONLY way to open
            the nav drawer. There's no permanently-visible rail anymore:
            the drawer (MobileNavRail) is unmounted entirely while closed,
            so content always gets the full viewport width. */}
        <header className="flex items-center gap-1 border-b border-gray-200 bg-white px-2 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          {showBottomNav && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              onClick={() => {
                trackButtonClick('open_nav', pathname);
                setNavOpen(true);
              }}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                trackButtonClick('back', pathname);
                onBack?.();
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title !== undefined && (
            <h1 className="flex-1 truncate px-2 text-lg font-semibold text-gray-900">
              {title || 'Wysa'}
            </h1>
          )}
          <div className="ml-auto">{headerRight}</div>
        </header>

        {/* Main Content with Error Boundary and Loading Provider — always
            full width, never offset for the drawer. */}
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

        {/* Nav drawer — unmounted while closed (see MobileNavRail), so it
            never reserves layout space or shows a divider. */}
        {showBottomNav && (
          <MobileNavRail
            open={navOpen}
            onClose={() => setNavOpen(false)}
            onTrackClick={(label, href) => trackButtonClick('nav_' + label.toLowerCase(), href)}
          />
        )}

        {/* Analytics Dashboard (dev only) */}
        <AnalyticsDashboard />
        <PerformanceIndicator />
      </div>
    </AnalyticsProvider>
  );
}