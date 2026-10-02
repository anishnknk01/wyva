"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, MessageSquare, User, X } from "lucide-react";
import { useUnreadMessages } from "@/hooks/use-chat";

const navItems = [
  { icon: Home, label: "Home", href: "/mobile" },
  { icon: Search, label: "Find", href: "/mobile/find-tasks" },
  { icon: Plus, label: "Post Task", href: "/mobile/create-task", primary: true },
  { icon: MessageSquare, label: "Chats", href: "/mobile/messages" },
  { icon: User, label: "Profile", href: "/mobile/profile" },
];

/**
 * Mobile navigation drawer — hidden by default, opened only via the
 * hamburger button in MobileLayout's header (open/onClose are owned by the
 * parent, not this component, so there's no permanently-reserved rail
 * width anywhere). Slides in from the left over a backdrop; closes on
 * backdrop tap, close button, a nav link click, or the Android back
 * button. Desktop is untouched — only ever rendered from MobileLayout,
 * which is only used by /mobile/* pages.
 */
export function MobileNavRail({
  open,
  onClose,
  onTrackClick,
}: {
  open: boolean;
  onClose: () => void;
  onTrackClick?: (item: string, href: string) => void;
}) {
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();
  // True while we're the ones popping the throwaway history entry below
  // (via an explicit close), so the popstate handler that fires as a
  // result doesn't also call onClose() a second time.
  const closingProgrammatically = useRef(false);

  // Close on the Android/browser back button instead of letting it
  // navigate away while the drawer is still covering the page. Pushes a
  // throwaway history entry the moment the drawer opens, and pops it
  // again whenever the drawer closes for *any* reason — so the back
  // stack never accumulates extra entries across repeated open/close
  // cycles, and the hardware back button always does something sensible.
  useEffect(() => {
    if (!open) return;

    window.history.pushState({ wysaNavDrawer: true }, "");

    const handlePopState = () => {
      if (closingProgrammatically.current) {
        closingProgrammatically.current = false;
        return;
      }
      // A real back-button/gesture while the drawer is open — just close
      // it, don't let the underlying page navigate away too.
      onClose();
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Drawer is closing for some other reason (explicit close call
      // below already popped the entry, or the component unmounted
      // outright) — nothing further to do here.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function closeDrawer() {
    closingProgrammatically.current = true;
    window.history.back();
    onClose();
  }

  function handleNavClick(label: string, href: string) {
    onTrackClick?.(label, href);
    // Deliberately NOT popping the throwaway history entry here — the
    // <Link> below is about to push its own entry for the destination
    // page in this same click, and racing two history operations against
    // each other (this pop + Link's push) isn't guaranteed to resolve in
    // a predictable order across browsers. Just close the drawer state;
    // the stale "drawer was open" entry becomes harmless as soon as the
    // user navigates away from this page — it's never a target you can
    // land back on (MobileNavRail always mounts closed), so a stray back
    // press from the new page would just skip over it.
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 left-0 flex w-64 max-w-[80vw] flex-col border-r border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-xl animate-in slide-in-from-left duration-200"
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
            onClick={closeDrawer}
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
  );
}
