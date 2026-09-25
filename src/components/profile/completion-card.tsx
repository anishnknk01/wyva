"use client";

import { CheckCircle, Circle } from "lucide-react";

type Step = { label: string; done: boolean; tab: string };

type Props = { data: any; score: number; onNavigate: (tab: string) => void };

export function CompletionCard({ data, score, onNavigate }: Props) {
  const { profile, address, serviceLocation, workerSkills, availability, payout, emergency, identityVerifications, email } = data;

  const identityVerified = identityVerifications?.some((v: any) => v.status === "verified");

  const steps: Step[] = [
    { label: "Phone number added",        done: !!profile?.phone,                               tab: "personal" },
    { label: "Email verified",            done: !!profile?.email_verified,                      tab: "personal" },
    { label: "Profile photo uploaded",    done: !!profile?.avatar_url,                          tab: "personal" },
    { label: "Identity verified",         done: identityVerified,                               tab: "verification" },
    { label: "Address added",             done: !!address,                                      tab: "address" },
    { label: "Service location set",      done: !!serviceLocation,                              tab: "address" },
    { label: "Skills added",              done: workerSkills?.length > 0,                       tab: "skills" },
    { label: "Availability set",          done: availability?.some((a: any) => a.available),    tab: "availability" },
    { label: "Payout details added",      done: !!payout,                                       tab: "payout" },
    { label: "Emergency contact added",   done: !!emergency,                                    tab: "emergency" },
  ];

  const done = steps.filter(s => s.done).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Profile Completion</h2>
        <span className="text-sm font-bold text-teal-600">{score}%</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {steps.map((step) => (
          <button
            key={step.label}
            onClick={() => !step.done && onNavigate(step.tab)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-gray-50"
          >
            {step.done ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-gray-300" />
            )}
            <span className={step.done ? "text-gray-600 line-through" : "font-medium text-gray-800"}>
              {step.label}
            </span>
          </button>
        ))}
      </div>

      {done === steps.length && (
        <div className="mt-4 rounded-lg bg-teal-50 p-3 text-center text-sm font-medium text-teal-700">
          🎉 Profile complete! You can now apply for tasks.
        </div>
      )}
    </div>
  );
}
