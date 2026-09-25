"use client";

import { ShieldCheck, Clock, XCircle, AlertCircle } from "lucide-react";
import { SectionCard } from "./profile-ui";

type Props = { data: any };

export function SectionDocuments({ data }: Props) {
  const verifs: any[] = data.identityVerifications ?? [];

  const aadhaar = verifs.find((v: any) => v.verification_type === "aadhaar");
  const pan     = verifs.find((v: any) => v.verification_type === "pan");

  return (
    <SectionCard
      title="Identity Documents"
      subtitle="Verify with Aadhaar or PAN — one is enough."
    >
      <div className="space-y-3">
        <DocRow
          label="Aadhaar Card"
          masked={aadhaar?.masked_identifier}
          status={aadhaar?.status}
        />
        <DocRow
          label="PAN Card"
          masked={pan?.masked_identifier}
          status={pan?.status}
        />
      </div>

      {!aadhaar && !pan && (
        <p className="mt-4 text-sm text-gray-400">
          No documents verified yet. Go to the Verification tab to get started.
        </p>
      )}
    </SectionCard>
  );
}

function DocRow({ label, masked, status }: {
  label: string;
  masked?: string;
  status?: string;
}) {
  const config = {
    verified:     { icon: ShieldCheck, cls: "text-green-600 bg-green-50 border-green-200", text: "Verified" },
    pending:      { icon: Clock,       cls: "text-yellow-600 bg-yellow-50 border-yellow-200", text: "Pending" },
    failed:       { icon: XCircle,     cls: "text-red-600 bg-red-50 border-red-200", text: "Failed" },
  }[status ?? ""] ?? { icon: AlertCircle, cls: "text-gray-400 bg-gray-50 border-gray-200", text: "Not verified" };

  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {masked && (
          <p className="mt-0.5 font-mono text-xs text-gray-400">{masked}</p>
        )}
      </div>
      <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.cls}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.text}
      </span>
    </div>
  );
}
