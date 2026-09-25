"use client";

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const mobileRouteMap: Record<string, string> = {
  '/': '/mobile',
  '/dashboard': '/mobile',
  '/create-task': '/mobile/create-task',
  '/tasks': '/mobile/find-tasks',
  '/my-tasks': '/mobile/my-tasks',
};

const AUTH_ROUTES = ['/login', '/signup', '/auth'];

export function MobileDetector() {
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    // Only run once per mount — avoids repeated redirect attempts
    if (redirected.current) return;

    const isMobileRoute = pathname.startsWith('/mobile');
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));
    if (isMobileRoute || isAuthRoute) return;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;

    if (isMobile) {
      redirected.current = true;
      const target = mobileRouteMap[pathname] ?? '/mobile';
      router.replace(target);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount only

  return null;
}
