"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SectionCard, FieldRow, EditButton, SaveRow, FormField, VerificationBadge } from "./profile-ui";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

type Props = { data: any; onRefresh: () => void };

export function SectionPersonal({ data, onRefresh }: Props) {
  const { profile, email } = data;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    display_name: profile?.display_name ?? "",
    date_of_birth: profile?.date_of_birth ?? "",
    gender: profile?.gender ?? "",
    bio: profile?.bio ?? "",
    phone: profile?.phone ?? "",
  });

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave() {
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Save failed"); return; }
    toast.success("Personal info updated");
    setEditing(false);
    onRefresh();
  }

  return (
    <SectionCard
      title="Personal Information"
      action={!editing ? <EditButton onClick={() => setEditing(true)} /> : undefined}
    >
      {editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" required>
            <input value={form.full_name} onChange={field("full_name")}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
          </FormField>
          <FormField label="Display name">
            <input value={form.display_name} onChange={field("display_name")}
              placeholder="Shown publicly"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
          </FormField>
          <FormField label="Date of birth">
            <input type="date" value={form.date_of_birth} onChange={field("date_of_birth")}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
          </FormField>
          <FormField label="Gender">
            <select value={form.gender} onChange={field("gender")}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none">
              <option value="">Select</option>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Phone number">
            <input type="tel" value={form.phone} onChange={field("phone")}
              placeholder="+91"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
          </FormField>
          <FormField label="Bio">
            <textarea value={form.bio} onChange={field("bio")} rows={3}
              placeholder="A brief introduction about yourself"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none resize-none sm:col-span-2" />
          </FormField>
          <div className="sm:col-span-2">
            <SaveRow saving={saving} onSave={handleSave} onCancel={() => setEditing(false)} />
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          <FieldRow label="Full name"     value={profile?.full_name} />
          <FieldRow label="Display name"  value={profile?.display_name} />
          <FieldRow label="Date of birth" value={profile?.date_of_birth} />
          <FieldRow label="Gender"        value={profile?.gender} />
          <FieldRow label="Bio"           value={profile?.bio} />
          <FieldRow label="Phone" value={profile?.phone}
            badge={<VerificationBadge status={profile?.phone_verified ? "verified" : "unverified"} />} />
          <FieldRow label="Email" value={email}
            badge={<VerificationBadge status={profile?.email_verified ? "verified" : "unverified"} />} />
        </div>
      )}
    </SectionCard>
  );
}
