"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ShoppingBag, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Role = "customer" | "worker";

interface RoleSwitcherProps {
  currentRole: Role;
}

export function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState<Role | null>(null);

  async function switchTo(next: Role) {
    if (next === currentRole || switching) return;
    setSwitching(next);

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Couldn't switch account. Please try again.");
      setSwitching(null);
      return;
    }

    // Update both auth metadata and DB profile
    const [metaResult] = await Promise.all([
      supabase.auth.updateUser({ data: { role: next } }),
      supabase.from("profiles").update({ role: next }).eq("id", user.id),
    ]);

    if (metaResult.error) {
      toast.error("Couldn't switch account. Please try again.");
      setSwitching(null);
      return;
    }

    toast.success(
      next === "worker"
        ? "Switched to Worker account"
        : "Switched to Customer account"
    );

    // Hard navigate so all role-dependent components re-render from scratch
    router.replace(next === "worker" ? "/worker/dashboard" : "/dashboard");
    router.refresh();
  }

  const isSwitching = switching !== null;

  return (
    <div
      role="group"
      aria-label="Switch account type"
      className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1"
    >
      <button
        type="button"
        onClick={() => switchTo("customer")}
        disabled={isSwitching}
        aria-pressed={currentRole === "customer"}
        title="Switch to Customer account"
        className={`flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 sm:px-3 ${
          currentRole === "customer"
            ? "bg-teal-100 text-teal-700 shadow-sm"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        {switching === "customer" ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ShoppingBag className="h-3.5 w-3.5" />
        )}
        {/* Labels only show once there's room — icon-only below sm avoids
            this pill forcing the header to overflow on mobile. */}
        <span className="hidden sm:inline">Customer</span>
      </button>
      <button
        type="button"
        onClick={() => switchTo("worker")}
        disabled={isSwitching}
        aria-pressed={currentRole === "worker"}
        title="Switch to Worker account"
        className={`flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 sm:px-3 ${
          currentRole === "worker"
            ? "bg-purple-100 text-purple-700 shadow-sm"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        {switching === "worker" ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Briefcase className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">Worker</span>
      </button>
    </div>
  );
}
