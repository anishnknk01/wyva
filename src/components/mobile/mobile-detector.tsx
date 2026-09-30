"use client";

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const mobileRouteMap: Record<string, string> = {
  '/': '/mobile',
  '/dashboard': '/mobile',
  '/create-task': '/mobile/create-task',
  '/tasks': '/mobile/find-tasks',
  '/my-tasks': '/mobile/my-tasks',
  '/profile': '/mobile/profile',
  '/settings': '/mobile/settings',
  '/messages': '/mobile/messages',
};

// Prefix-based fallbacks for dynamic routes the exact-match map above can't
// express (e.g. /pay-task/abc123 → /mobile/pay-task/abc123). Checked in
// order; first match wins. Falls back to the bare '/mobile' home for
// anything with no real mobile equivalent (e.g. the entire /worker/* tree
// has no mobile UI yet) rather than leaving the user on a desktop-only page.
const mobilePrefixMap: Array<[string, (pathname: string) => string]> = [
  ['/pay-task/', (p) => `/mobile${p}`],
  ['/messages/', (p) => `/mobile${p}`],
];

const AUTH_ROUTES = ['/login', '/signup', '/auth'];

export function MobileDetector() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Re-run on every navigation, not just once on initial mount. This used
    // to only fire once (empty dependency array + a `redirected` ref) which
    // meant it caught the very first page load correctly, but any later
    // client-side navigation to a desktop route — e.g. the main Navbar's
    // "Post a Task" link, which points at /create-task regardless of
    // viewport — was never re-checked, landing mobile users on the desktop
    // UI for every route except the handful they reached on first load.
    const isMobileRoute = pathname.startsWith('/mobile');
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));
    if (isMobileRoute || isAuthRoute) return;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;

    if (isMobile) {
      let target = mobileRouteMap[pathname];
      if (!target) {
        const prefixMatch = mobilePrefixMap.find(([prefix]) => pathname.startsWith(prefix));
        target = prefixMatch ? prefixMatch[1](pathname) : '/mobile';
      }
      if (target !== pathname) {
        router.replace(target);
      }
    }
  }, [pathname, router]);

  return null;
}
