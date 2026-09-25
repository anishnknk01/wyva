"use client";

import { CheckCircle, Clock, XCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Verification badge ─────────────────────────────────────────────────────
type VerifStatus = "verified" | "pending" | "failed" | "unverified";

const BADGE_CONFIG: Record<VerifStatus, { label: string; icon: typeof CheckCircle; cls: string }> = {
  verified:   { label: "Verified",   icon: CheckCircle, cls: "text-green-600 bg-green-50 border-green-200" },
  pending:    { label: "Pending",    icon: Clock,       cls: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  failed:     { label: "Failed",     icon: XCircle,     cls: "text-red-600 bg-red-50 border-red-200" },
  unverified: { label: "Not verified", icon: ShieldAlert, cls: "text-gray-500 bg-gray-50 border-gray-200" },
};

export function VerificationBadge({ status }: { status?: string | null }) {
  const cfg = BADGE_CONFIG[(status as VerifStatus) ?? "unverified"] ?? BADGE_CONFIG.unverified;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", cfg.cls)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Section card ───────────────────────────────────────────────────────────
export function SectionCard({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Field row ──────────────────────────────────────────────────────────────
export function FieldRow({ label, value, badge }: { label: string; value?: string | null; badge?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2">
      <span className="w-36 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="flex-1 text-sm font-medium text-gray-900">{value ?? "—"}</span>
      {badge}
    </div>
  );
}

// ── Save button row ────────────────────────────────────────────────────────
export function SaveRow({ saving, onSave, onCancel }: { saving: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        onClick={onCancel}
        disabled={saving}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}

// ── Edit toggle button ─────────────────────────────────────────────────────
export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-sm font-medium text-teal-600 hover:text-teal-700">
      Edit
    </button>
  );
}

// ── Form input wrapper ─────────────────────────────────────────────────────
export function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
