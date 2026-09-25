"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { SectionCard, EditButton, SaveRow, FormField, FieldRow } from "./profile-ui";

type Props = { data: any; onRefresh: () => void };

export function SectionEmergency({ data, onRefresh }: Props) {
  const { emergency } = data;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: emergency?.name ?? "",
    relationship: emergency?.relationship ?? "",
    phone: emergency?.phone ?? "",
  });

  function field(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required"); return;
    }
    setSaving(true);
    const res = await fetch("/api/profile/emergency-contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Save failed"); return; }
    toast.success("Emergency contact saved");
    setEditing(false);
    onRefresh();
  }

  return (
    <SectionCard
      title="Emergency Contact"
      subtitle="Strictly private. Never shown to task posters or publicly."
      action={!editing ? <EditButton onClick={() => setEditing(true)} /> : undefined}
    >
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        This information is only used in emergencies and is never visible on your public profile.
      </div>

      {editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Contact name" required>
            <input value={form.name} onChange={field("name")}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
          </FormField>
          <FormField label="Relationship">
            <input value={form.relationship} onChange={field("relationship")}
              placeholder="e.g. Parent, Spouse"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
          </FormField>
          <FormField label="Phone number" required>
            <input type="tel" value={form.phone} onChange={field("phone")}
              placeholder="+91"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
          </FormField>
          <div className="sm:col-span-2">
            <SaveRow saving={saving} onSave={handleSave} onCancel={() => setEditing(false)} />
          </div>
        </div>
      ) : emergency ? (
        <div className="divide-y divide-gray-50">
          <FieldRow label="Name"         value={emergency.name} />
          <FieldRow label="Relationship" value={emergency.relationship} />
          <FieldRow label="Phone"        value={emergency.phone} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">No emergency contact added yet.</p>
      )}
    </SectionCard>
  );
}
