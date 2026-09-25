"use client";

import { useRouter } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUnreadMessages } from "@/hooks/use-chat";

type Props = { user: User | null; setSidebarOpen: (v: boolean) => void };

export function WorkerHeader({ user, setSidebarOpen }: Props) {
  const router = useRouter();
  const { unreadCount } = useUnreadMessages();
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Worker";

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-lg">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <form
            className="relative flex-1"
            onSubmit={e => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value; router.push(q ? `/worker/find-tasks?q=${encodeURIComponent(q)}` : "/worker/find-tasks"); }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input name="q" placeholder="Search available tasks…" className="pl-10" />
          </form>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/messages")}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
          <button onClick={() => router.push("/profile")} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 md:block">{name}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
