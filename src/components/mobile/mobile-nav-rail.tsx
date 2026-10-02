"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, MessageSquare, User, Menu, X } from "lucide-react";
import { useUnreadMessages } from "@/hooks/use-chat";

const navItems = [
  { icon: Home, label: "Home", href: "/mobile" },
  { icon: Search, label: "Find", href: "/mobile/find-tasks" },
  { icon: Plus, label: "Post Task", href: "/mobile/create-task", primary: true },
  { icon: MessageSquare, label: "Chats", href: "/mobile/messages" },
  { icon: User, label: "Profile", href: "/mobile/profile" },
];

const SESSION_KEY = "wysa-mobile-nav-expanded";

/**
 * Left-side navigation rail for mobile — replaces the old bottom nav bar.
 * Collapsed by default (icon-only, ~64px), expands to an overlay drawer
 * (icon + label, ~232px) when the menu button is tapped. Desktop is
 * completely untouched — this component is only ever rendered from
 * MobileLayout, which itself is only used by /mobile/* pages.
 */
export function MobileNavRail({ onTrackClick }: { onTrackClick?: (item: string, href: string) => void }) {
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();
  const [expanded, setExpanded] = useState(false);

  // Restore expand/collapse state from this session only after mount, to
  // avoid a server/client markup mismatch (sessionStorage isn't available
  // during SSR) and so the very first paint always matches the server.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored === "1") setExpanded(true);
    } catch {
      // sessionStorage can throw in some privacy modes — collapsed is a
      // perfectly fine default to fall back to silently.
    }
  }, []);

  function setExpandedAndPersist(next: boolean) {
    setExpanded(next);
    try {
      sessionStorage.setItem(SESSION_KEY, next ? "1" : "0");
    } catch {
      // Ignore — persistence is a nice-to-have, not required for the rail
      // to function within the current page view.
    }
  }

  function handleNavClick(label: string, href: string) {
    onTrackClick?.(label, href);
    setExpandedAndPersist(false);
  }

  return (
    <>
      {/* Collapsed rail — always rendered and fixed, so it stays visible
          while the page content scrolls. pb-[env(safe-area-inset-bottom)]
          and pt-[env(safe-area-inset-top)] keep it clear of notches/home
          indicators on devices that have them. */}
      <nav
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col items-center border-r border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
      >
        <button
          type="button"
          onClick={() => setExpandedAndPersist(true)}
          aria-label="Open navigation menu"
          aria-expanded={expanded}
          className="mt-2 flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 active:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="mt-2 flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1.5 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isChats = item.href === "/mobile/messages";

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.label, item.href)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-colors ${
                    isActive
                      ? "bg-teal-700 text-white"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item.label, item.href)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex h-12 w-12 flex-col items-center justify-center rounded-xl transition-colors ${
                  isActive ? "bg-teal-50 text-teal-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className="h-5 w-5" />
                {isChats && unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Expanded overlay — only mounted while open, so it never affects
          layout or intercepts taps while collapsed. */}
      {expanded && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setExpandedAndPersist(false)}
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 left-0 flex w-60 max-w-[80vw] flex-col border-r border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-xl animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <span className="font-heading text-xl font-extrabold tracking-tight text-gray-900">
                wysa<span className="text-teal-600">.</span>
              </span>
              <button
                type="button"
                onClick={() => setExpandedAndPersist(false)}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isChats = item.href === "/mobile/messages";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavClick(item.label, item.href)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                      item.primary
                        ? isActive
                          ? "bg-teal-700 text-white"
                          : "bg-teal-600 text-white hover:bg-teal-700"
                        : isActive
                          ? "bg-teal-50 text-teal-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isChats && unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
