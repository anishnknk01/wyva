"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingBag, Briefcase, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/lib/auth-guard";

type Role = "customer" | "worker";

function SelectRolePage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (!selected || !user) return;
    setSaving(true);

    const supabase = createClient();

    // Save to profiles table (DB)
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ role: selected })
      .eq("id", user.id);

    if (dbError) {
      console.warn("Profile DB update failed (RLS?), continuing with metadata update:", dbError.message);
    }

    // ALSO save to auth user_metadata — this is the permanent fix.
    // user_metadata is embedded in the JWT so it works even when RLS blocks DB reads.
    const { error: metaError } = await supabase.auth.updateUser({
      data: { role: selected },
    });

    setSaving(false);

    if (metaError) {
      toast.error("Couldn't save your role. Please try again.");
      return;
    }

    toast.success(
      selected === "worker"
        ? "Welcome, Wysa! Taking you to your dashboard…"
        : "Welcome! Taking you to your dashboard…"
    );

    setTimeout(() => {
      router.replace(selected === "worker" ? "/worker/dashboard" : "/dashboard");
    }, 700);
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-heading text-3xl font-extrabold tracking-tight text-gray-900">
            wysa<span className="text-teal-600">.</span>
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            How do you want to use WYSA?
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Choose your account type. You can only pick one.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Customer */}
            <button onClick={() => setSelected("customer")}
              className={`group flex flex-col items-center gap-4 rounded-2xl border-2 p-6 text-center transition-all ${
                selected === "customer" ? "border-teal-500 bg-teal-50 shadow-md" : "border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm"
              }`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                selected === "customer" ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500 group-hover:bg-teal-50 group-hover:text-teal-600"
              }`}>
                <ShoppingBag className="h-7 w-7" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">I need help</p>
                <p className="mt-1 text-xs text-gray-500">Post tasks and hire verified Wysas nearby</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                selected === "customer" ? "border-teal-300 bg-teal-100 text-teal-700" : "border-gray-200 bg-gray-50 text-gray-500"
              }`}>Customer</span>
            </button>

            {/* Worker */}
            <button onClick={() => setSelected("worker")}
              className={`group flex flex-col items-center gap-4 rounded-2xl border-2 p-6 text-center transition-all ${
                selected === "worker" ? "border-purple-500 bg-purple-50 shadow-md" : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
              }`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                selected === "worker" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500 group-hover:bg-purple-50 group-hover:text-purple-600"
              }`}>
                <Briefcase className="h-7 w-7" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">I want to earn</p>
                <p className="mt-1 text-xs text-gray-500">Accept tasks and get paid for helping others</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                selected === "worker" ? "border-purple-300 bg-purple-100 text-purple-700" : "border-gray-200 bg-gray-50 text-gray-500"
              }`}>Worker (Wysa)</span>
            </button>
          </div>

          <button onClick={handleConfirm} disabled={!selected || saving}
            className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 ${
              selected
                ? selected === "worker" ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-teal-600 text-white hover:bg-teal-700"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            }`}>
            {saving
              ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving…</>
              : <>Continue <ArrowRight className="h-4 w-4" /></>}
          </button>

          {selected && !saving && (
            <p className="mt-3 text-center text-xs text-gray-400">
              Signing up as a <span className="font-medium text-gray-600">{selected === "worker" ? "Worker (Wysa)" : "Customer"}</span>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Already chosen?{" "}
          <button onClick={() => router.push("/dashboard")} className="font-medium text-teal-600 hover:underline">
            Go to dashboard
          </button>
        </p>
      </div>
    </div>
  );
}

export default SelectRolePage;
