"use client";

import Link from "next/link";
import Image from "next/image";
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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Find Tasks", href: "/tasks", icon: Search },
  { name: "My Tasks", href: "/my-tasks", icon: FileText },
  { name: "Messages", href: "/messages", icon: MessageSquare, badge: 2 },
  { name: "Saved", href: "/saved", icon: Bookmark },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardSidebar({ sidebarOpen, setSidebarOpen }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-6 border-b">
            <Link href="/" className="flex items-center">
              <Image
                src="/wysa-logo.png"
                alt="Wysa"
                width={32}
                height={32}
                className="mr-3"
              />
              <span className="text-xl font-bold text-teal-600">Wysa</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-teal-50 text-teal-600 border-r-2 border-teal-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom CTA */}
          <div className="p-6 border-t">
            <div className="bg-teal-50 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-teal-100 rounded-full p-3">
                  <FileText className="h-6 w-6 text-teal-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Make a Difference</h3>
              <p className="text-sm text-gray-600 mb-3">Small help creates big change.</p>
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700" 
                render={<Link href="/create-task" />}
              >
                Post a Task
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}