"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, AlertTriangle } from "lucide-react";

type EligibilityData = {
  canApply: boolean;
  missing: string[];
  missingSoft?: string[];
  completionScore: number;
};

interface ProfileCompletionCardProps {
  compact?: boolean; // smaller version for dashboard widget
}

export function ProfileCompletionCard({ compact = false }: ProfileCompletionCardProps) {
  const router = useRouter();
  const [data, setData]       = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/worker/eligibility", { cache: "no-store" });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Re-fetch every time the page becomes visible (user returns from editing profile)
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  if (loading) return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="h-4 w-32 animate-pulse rounded bg-gray-200 mb-3" />
      <div className="h-2 w-full animate-pulse rounded-full bg-gray-200" />
    </div>
  );

  if (!data) return null;

  const { canApply, missing, completionScore } = data;
  const score = completionScore;

  if (compact) {
    return (
      <div className={`rounded-xl border p-4 ${canApply ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">Profile Completion</span>
          <span className={`text-sm font-bold ${canApply ? "text-green-700" : "text-yellow-700"}`}>{score}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/60 mb-3">
          <div className={`h-2 rounded-full transition-all ${canApply ? "bg-green-500" : "bg-yellow-500"}`} style={{ width: `${score}%` }} />
        </div>
        {canApply ? (
          <p className="text-xs text-green-700 font-medium">✓ Profile ready — you can apply for jobs</p>
        ) : (
          <>
            <p className="text-xs text-yellow-700 font-medium mb-2">{missing.length} item{missing.length !== 1 ? "s" : ""} remaining</p>
            <button
              onClick={() => router.push("/worker/onboarding")}
              className="text-xs font-semibold text-purple-600 hover:underline"
            >
              Complete Profile →
            </button>
          </>
        )}
      </div>
    );
  }

  // Full version
  const allItems = [
    "Add your full name",
    "Add your date of birth",
    "Add your phone number",
    "Verify your phone number",
    "Verify your email address",
    "Add a profile photo",
    "Complete identity verification",
    "Add at least one service category",
    "Set your service location",
    "Set your availability",
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Profile Completion</h2>
          {canApply
            ? <p className="text-xs text-green-600 font-medium mt-0.5">✓ Ready to work</p>
            : <p className="text-xs text-yellow-600 mt-0.5">{missing.length} item{missing.length !== 1 ? "s" : ""} needed to unlock job applications</p>
          }
        </div>
        <span className={`text-2xl font-extrabold ${canApply ? "text-green-600" : "text-purple-600"}`}>{score}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-gray-100 mb-6">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${canApply ? "bg-green-500" : "bg-purple-600"}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {!canApply && missing.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>Complete all required items to unlock job applications.</span>
        </div>
      )}

      <div className="space-y-2 mb-5">
        {allItems.map((item) => {
          const isDone = !missing.includes(item);
          return (
            <div key={item} className="flex items-center gap-2.5 text-sm">
              {isDone
                ? <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                : <Circle className="h-4 w-4 shrink-0 text-gray-300" />}
              <span className={isDone ? "text-gray-500 line-through" : "font-medium text-gray-800"}>{item}</span>
            </div>
          );
        })}
      </div>

      {!canApply && (
        <button
          onClick={() => router.push("/worker/onboarding")}
          className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          Complete Profile
        </button>
      )}

      {canApply && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-semibold text-green-700">
          🎉 You&apos;re ready to apply for jobs!
        </div>
      )}
    </div>
  );
}
