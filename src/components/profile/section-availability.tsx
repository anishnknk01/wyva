"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SectionCard } from "./profile-ui";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

type DayRow = { day_of_week: string; available: boolean; start_time: string; end_time: string };

function defaultRows(existing: any[]): DayRow[] {
  return DAYS.map(d => {
    const e = existing.find((r: any) => r.day_of_week === d.key);
    return { day_of_week: d.key, available: e?.available ?? false, start_time: e?.start_time ?? "09:00", end_time: e?.end_time ?? "18:00" };
  });
}

type Props = { data: any; onRefresh: () => void };

export function SectionAvailability({ data, onRefresh }: Props) {
  const [rows, setRows] = useState<DayRow[]>(defaultRows(data.availability ?? []));
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [availableNow, setAvailableNow] = useState<boolean>(data.profile?.available_now ?? false);
  const [emergency, setEmergency]       = useState<boolean>(data.profile?.accept_emergency_tasks ?? false);
  const [savingFlags, setSavingFlags]   = useState(false);

  function toggle(key: string) {
    setRows(prev => prev.map(r => r.day_of_week === key ? { ...r, available: !r.available } : r));
  }
  function setTime(key: string, field: "start_time" | "end_time", val: string) {
    setRows(prev => prev.map(r => r.day_of_week === key ? { ...r, [field]: val } : r));
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Save failed"); return; }
    toast.success("Availability updated");
    setEditing(false);
    onRefresh();
  }

  async function saveFlags() {
    setSavingFlags(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available_now: availableNow, accept_emergency_tasks: emergency }),
    });
    setSavingFlags(false);
    toast.success("Status updated");
    onRefresh();
  }

  const activeDays = rows.filter(r => r.available);

  return (
    <SectionCard
      title="Availability"
      subtitle="When can you take tasks?"
      action={!editing ? (
        <button onClick={() => setEditing(true)} className="text-sm font-medium text-teal-600 hover:text-teal-700">Edit</button>
      ) : undefined}
    >
      {/* Status toggles */}
      <div className="mb-5 flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
          <div
            onClick={() => { setAvailableNow(v => !v); }}
            className={`relative h-5 w-9 rounded-full transition-colors ${availableNow ? "bg-teal-500" : "bg-gray-300"}`}
          >
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${availableNow ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">Available now</span>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
          <div
            onClick={() => setEmergency(v => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors ${emergency ? "bg-teal-500" : "bg-gray-300"}`}
          >
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${emergency ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">Accept emergency tasks</span>
        </label>

        <button onClick={saveFlags} disabled={savingFlags}
          className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
          {savingFlags ? "Saving…" : "Save Status"}
        </button>
      </div>

      {/* Schedule */}
      {editing ? (
        <div className="space-y-2">
          {DAYS.map(d => {
            const row = rows.find(r => r.day_of_week === d.key)!;
            return (
              <div key={d.key} className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${row.available ? "border-teal-200 bg-teal-50" : "border-gray-100 bg-gray-50"}`}>
                <button
                  onClick={() => toggle(d.key)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${row.available ? "bg-teal-500" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${row.available ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="w-24 text-sm font-medium text-gray-800">{d.label}</span>
                {row.available && (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" value={row.start_time}
                      onChange={e => setTime(d.key, "start_time", e.target.value)}
                      className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none" />
                    <span className="text-gray-400">to</span>
                    <input type="time" value={row.end_time}
                      onChange={e => setTime(d.key, "end_time", e.target.value)}
                      className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none" />
                  </div>
                )}
                {!row.available && <span className="text-sm text-gray-400">Not available</span>}
              </div>
            );
          })}
          <div className="mt-3 flex gap-2">
            <button onClick={save} disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save Schedule"}
            </button>
            <button onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : activeDays.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {activeDays.map(r => {
            const label = DAYS.find(d => d.key === r.day_of_week)?.label;
            return (
              <div key={r.day_of_week} className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm">
                <span className="font-medium text-teal-800">{label}</span>
                <span className="text-teal-600">{r.start_time} – {r.end_time}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No schedule set yet. Add your available days.</p>
      )}
    </SectionCard>
  );
}
