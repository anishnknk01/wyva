"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { SectionCard, EditButton, SaveRow, FormField, FieldRow, VerificationBadge } from "./profile-ui";

type Props = { data: any; onRefresh: () => void };

export function SectionPayout({ data, onRefresh }: Props) {
  const { payout } = data;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    account_holder_name: payout?.account_holder_name ?? "",
    masked_account: payout?.masked_account ?? "",
    ifsc_code: payout?.ifsc_code ?? "",
    upi_id: payout?.upi_id ?? "",
  });

  function field(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/profile/payout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Save failed"); return; }
    toast.success("Payout details saved");
    setEditing(false);
    onRefresh();
  }

  return (
    <SectionCard
      title="Payout Details"
      subtitle="Your payment information. Never shown publicly."
      action={!editing ? <EditButton onClick={() => setEditing(true)} /> : undefined}
    >
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        Account details are stored encrypted and masked. Full account numbers are never stored here — use your payout provider's portal to manage full details.
      </div>

      {editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Account holder name">
            <input value={form.account_holder_name} onChange={field("account_holder_name")}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
          </FormField>
          <FormField label="Masked account number" >
            <input value={form.masked_account} onChange={field("masked_account")}
              placeholder="XXXX XXXX 1234"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm font-mono focus:border-teal-500 focus:outline-none" />
          </FormField>
          <FormField label="IFSC code">
            <input value={form.ifsc_code} onChange={field("ifsc_code")}
              placeholder="SBIN0001234"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm uppercase focus:border-teal-500 focus:outline-none" />
          </FormField>
          <FormField label="UPI ID">
            <input value={form.upi_id} onChange={field("upi_id")}
              placeholder="name@upi"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
          </FormField>
          <div className="sm:col-span-2">
            <SaveRow saving={saving} onSave={handleSave} onCancel={() => setEditing(false)} />
          </div>
        </div>
      ) : payout ? (
        <div className="divide-y divide-gray-50">
          <FieldRow label="Account holder" value={payout.account_holder_name}
            badge={<VerificationBadge status={payout.verified ? "verified" : "unverified"} />} />
          <FieldRow label="Account"  value={payout.masked_account} />
          <FieldRow label="IFSC"     value={payout.ifsc_code} />
          <FieldRow label="UPI"      value={payout.upi_id} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">No payout details added yet.</p>
      )}
    </SectionCard>
  );
}
