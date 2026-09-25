"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

type EligibilityData = {
  canApply: boolean;
  missing: string[];
  completionScore: number;
};

interface EligibilityGuardProps {
  /** Called only when the backend confirms canApply = true */
  onEligible: () => void;
  /** Render trigger (the Apply button) */
  children: (props: { onClick: () => void; loading: boolean }) => React.ReactNode;
}

/**
 * Wraps any "Apply Now" action with a server-side eligibility check.
 * If the backend says canApply = false, shows a blocking modal explaining
 * exactly what's missing. Never trusts client state.
 */
export function EligibilityGuard({ onEligible, children }: EligibilityGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState<EligibilityData | null>(null);

  async function handleClick() {
    setChecking(true);
    try {
      const res = await fetch("/api/worker/eligibility");
      if (!res.ok) throw new Error("Eligibility check failed");
      const result: EligibilityData = await res.json();
      setData(result);
      if (result.canApply) {
        onEligible();
      } else {
        setShowModal(true);
      }
    } catch {
      // Network error — block application conservatively
      setData({ canApply: false, missing: ["Unable to verify eligibility — please try again"], completionScore: 0 });
      setShowModal(true);
    } finally {
      setChecking(false);
    }
  }

  if (!showModal) {
    return <>{children({ onClick: handleClick, loading: checking })}</>;
  }

  return (
    <>
      {children({ onClick: handleClick, loading: checking })}

      {/* Blocking modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Complete your profile first</h2>
            </div>
            <button onClick={() => setShowModal(false)}>
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            Your profile is <span className="font-semibold text-purple-600">{data?.completionScore ?? 0}% complete</span>.
            Complete the following to apply for jobs:
          </p>

          <ul className="mb-5 space-y-2">
            {(data?.missing ?? []).map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">○</span>
                {item}
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/worker/onboarding")}
              className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              Complete Profile
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
