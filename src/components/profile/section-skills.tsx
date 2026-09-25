"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { SectionCard, FormField } from "./profile-ui";

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Expert"];
const EXP_OPTIONS   = [0,1,2,3,5,10];

type CatalogSkill = { id: string; name: string; category: string };
type WorkerSkill  = { id: string; skill_id: string | null; custom_skill_name: string | null;
  experience_years: number | null; skill_level: string | null; description: string | null;
  skills?: { name: string; category: string } };

type Props = { data: any; onRefresh: () => void };

export function SectionSkills({ data, onRefresh }: Props) {
  const [catalog, setCatalog] = useState<CatalogSkill[]>([]);
  const [mySkills, setMySkills] = useState<WorkerSkill[]>(data.workerSkills ?? []);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ skill_id: "", custom_skill_name: "", experience_years: 0, skill_level: "Beginner", description: "" });

  useEffect(() => {
    fetch("/api/profile/skills").then(r => r.json()).then(d => {
      if (d.catalog) setCatalog(d.catalog);
      if (d.mySkills) setMySkills(d.mySkills);
    });
  }, []);

  // Group catalog by category
  const grouped = catalog.reduce((acc: Record<string, CatalogSkill[]>, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  async function addSkill() {
    if (!form.skill_id && !form.custom_skill_name.trim()) {
      toast.error("Select a skill or enter a custom one"); return;
    }
    setSaving(true);
    const res = await fetch("/api/profile/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skill_id: form.skill_id || undefined,
        custom_skill_name: form.custom_skill_name || undefined,
        experience_years: form.experience_years,
        skill_level: form.skill_level,
        description: form.description,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    toast.success("Skill added");
    setMySkills(prev => [...prev, json.skill]);
    setAdding(false);
    setForm({ skill_id: "", custom_skill_name: "", experience_years: 0, skill_level: "Beginner", description: "" });
    onRefresh();
  }

  async function removeSkill(id: string) {
    const res = await fetch("/api/profile/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Remove failed"); return; }
    setMySkills(prev => prev.filter(s => s.id !== id));
    toast.success("Skill removed");
    onRefresh();
  }

  const selectedName = form.skill_id
    ? catalog.find(c => c.id === form.skill_id)?.name ?? ""
    : form.custom_skill_name;

  return (
    <SectionCard
      title="Skills & Services"
      subtitle="Services you can offer to task posters."
      action={
        !adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700">
            <Plus className="h-4 w-4" /> Add Skill
          </button>
        )
      }
    >
      {/* Existing skills */}
      {mySkills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {mySkills.map(s => (
            <div key={s.id}
              className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-800">
              <span>{s.skills?.name ?? s.custom_skill_name}</span>
              {s.skill_level && <span className="text-xs text-teal-500">· {s.skill_level}</span>}
              <button onClick={() => removeSkill(s.id)} className="ml-1 text-teal-400 hover:text-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {mySkills.length === 0 && !adding && (
        <p className="mb-4 text-sm text-gray-500">No skills added yet. Add at least one to apply for tasks.</p>
      )}

      {/* Add skill form */}
      {adding && (
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Category & Skill">
              <select value={form.skill_id}
                onChange={e => setForm(f => ({ ...f, skill_id: e.target.value, custom_skill_name: "" }))}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none">
                <option value="">— Select a skill —</option>
                {Object.entries(grouped).map(([cat, skills]) => (
                  <optgroup key={cat} label={cat}>
                    {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </FormField>

            <FormField label="Or custom skill name">
              <input
                value={form.custom_skill_name}
                onChange={e => setForm(f => ({ ...f, custom_skill_name: e.target.value, skill_id: "" }))}
                placeholder="e.g. Yoga instructor"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none"
              />
            </FormField>

            <FormField label="Skill level">
              <select value={form.skill_level}
                onChange={e => setForm(f => ({ ...f, skill_level: e.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none">
                {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </FormField>

            <FormField label="Years of experience">
              <select value={form.experience_years}
                onChange={e => setForm(f => ({ ...f, experience_years: Number(e.target.value) }))}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none">
                {EXP_OPTIONS.map(y => <option key={y} value={y}>{y === 0 ? "Less than 1 year" : `${y}+ years`}</option>)}
              </select>
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Brief description">
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Describe your experience with this skill"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none resize-none" />
              </FormField>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={addSkill} disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
              {saving ? "Adding…" : "Add Skill"}
            </button>
            <button onClick={() => setAdding(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
