"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  MessageSquare, 
  Bookmark, 
  CreditCard, 
  User, 
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnreadMessages } from "@/hooks/use-chat";
import { useRole } from "@/hooks/use-role";

interface DashboardSidebarProps {
  // Only meaningful below the lg breakpoint — controls whether the sidebar
  // is shown as an overlay drawer. Ignored on desktop, where the sidebar is
  // always visible in its own column.
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navigationItems = [
  { name: "Dashboard",   href: "/dashboard",     icon: LayoutDashboard },
  { name: "Post a Task", href: "/create-task",   icon: Search },
  { name: "My Tasks",    href: "/my-tasks",      icon: FileText },
  { name: "Messages",    href: "/messages",      icon: MessageSquare },
  { name: "Saved",       href: "/saved",         icon: Bookmark },
  { name: "Payments",    href: "/payments",      icon: CreditCard },
  { name: "Profile",     href: "/profile",       icon: User },
  { name: "Settings",    href: "/settings",      icon: Settings },
];

export function DashboardSidebar({ sidebarOpen, setSidebarOpen }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();
  const role = useRole();
  const onClose = () => setSidebarOpen(false);

  const content = (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Logo Section — matches main site navbar wordmark */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="font-heading text-2xl font-extrabold tracking-tight text-gray-900">
            wysa<span className="text-teal-600">.</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const badge = item.name === "Messages" && unreadCount > 0 ? unreadCount : undefined;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
                    ${isActive 
                      ? 'bg-teal-50 text-teal-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <span className="flex-1">{item.name}</span>
                  {badge && (
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom CTA Card — only for customers */}
      {role !== "worker" && (
        <div className="p-4 mx-4 mb-6">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Make a Difference</h3>
            <p className="text-xs text-teal-100 mb-4">Small help creates big change.</p>
            <Button
              size="sm"
              className="w-full bg-white text-teal-600 hover:bg-gray-50 font-medium"
              render={<Link href="/create-task" onClick={onClose} />}
            >
              Post a Task
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: sidebar sits in its own column, always visible */}
      <div className="hidden h-full w-64 shrink-0 lg:block">{content}</div>

      {/* Mobile: off-canvas drawer + backdrop, only mounted when open so it
          never intercepts clicks/layout space while closed. */}
      {sidebarOpen && (
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