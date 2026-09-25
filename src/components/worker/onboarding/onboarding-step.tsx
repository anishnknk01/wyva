"use client";

import { ArrowLeft } from "lucide-react";

interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onContinue: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  loading?: boolean;
}

export function OnboardingStep({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onContinue,
  onBack,
  onSkip,
  continueLabel = "Continue →",
  continueDisabled = false,
  loading = false,
}: OnboardingStepProps) {
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo + step */}
        <div className="mb-8 text-center">
          <span className="font-heading text-2xl font-extrabold tracking-tight text-gray-900">
            wysa<span className="text-purple-600">.</span>
          </span>
          <p className="mt-1 text-xs font-medium text-gray-400 uppercase tracking-widest">
            Worker Setup
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Step {step} of {totalSteps}
            </span>
            <span className="text-xs font-semibold text-purple-600">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-purple-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={onContinue}
              disabled={continueDisabled || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : continueLabel}
            </button>

            <div className="flex items-center justify-between">
              {onBack ? (
                <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : <span />}
              {onSkip && (
                <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600">
                  Skip for now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
