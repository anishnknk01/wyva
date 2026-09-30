"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  CheckSquare,
  MessageSquare,
  User,
  Settings,
  CreditCard,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnreadMessages } from "@/hooks/use-chat";

const navItems = [
  { name: "Dashboard",    href: "/worker/dashboard",    icon: LayoutDashboard },
  { name: "Find Tasks",   href: "/worker/find-tasks",   icon: Search },
  { name: "My Jobs",      href: "/worker/my-jobs",      icon: CheckSquare },
  { name: "Messages",     href: "/messages",            icon: MessageSquare },
  { name: "Earnings",     href: "/worker/earnings",     icon: CreditCard },
  { name: "Reviews",      href: "/worker/reviews",      icon: Star },
  { name: "Profile",      href: "/profile",             icon: User },
  { name: "Settings",     href: "/settings",            icon: Settings },
];

interface WorkerSidebarProps {
  // Only meaningful below the lg breakpoint — controls whether the sidebar
  // is shown as an overlay drawer. Ignored on desktop, where the sidebar is
  // always visible in its own column.
  open?: boolean;
  onClose?: () => void;
}

export function WorkerSidebar({ open = false, onClose }: WorkerSidebarProps) {
  const pathname   = usePathname();
  const { unreadCount } = useUnreadMessages();

  const content = (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-gray-100 p-6">
        <Link href="/worker/dashboard" className="flex items-center gap-2">
          <span className="font-heading text-2xl font-extrabold tracking-tight text-gray-900">
            wysa<span className="text-purple-600">.</span>
          </span>
          <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
            Worker
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const badge  = name === "Messages" && unreadCount > 0 ? unreadCount : undefined;
            return (
              <li key={name}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 shrink-0 ${active ? "text-purple-500" : "text-gray-400 group-hover:text-gray-500"}`} />
                  <span className="flex-1">{name}</span>
                  {badge && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* CTA */}
      <div className="mx-4 mb-6">
        <div className="rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 p-4 text-center text-white">
          <p className="text-sm font-semibold">Ready to earn?</p>
          <p className="mt-0.5 text-xs text-purple-200">New tasks available now.</p>
          <Button
            size="sm"
            className="mt-3 w-full bg-white font-medium text-purple-700 hover:bg-gray-50"
            render={<Link href="/worker/find-tasks" onClick={onClose} />}
          >
            Browse Tasks
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: sidebar sits in its own column, always visible */}
      <div className="hidden h-full w-64 shrink-0 lg:block">{content}</div>

      {/* Mobile: off-canvas drawer + backdrop, only mounted when open so it
          never intercepts clicks/layout space while closed. */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[80vw] shadow-xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
