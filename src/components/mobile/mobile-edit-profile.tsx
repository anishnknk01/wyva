"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useWorkerProfile } from "@/hooks/use-worker-profile";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

/**
 * Mobile "Edit Profile" screen. The tap-to-edit pencil on MobileProfile and
 * the "Account" item under Settings both used to be dead ends (no handler /
 * "coming soon" placeholder) — this is the actual editable form, hitting
 * the same PATCH /api/profile endpoint the desktop profile sections use.
 */
export function MobileEditProfile() {
  const { data, loading, refresh } = useWorkerProfile();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  // Rendering the form only once profile data has actually loaded lets its
  // useState initializers read from `data.profile` directly — no effect
  // needed to sync fetched data into form state after the fact.
  return <EditProfileForm profile={data?.profile} email={data?.email} userId={userId} onSaved={refresh} />;
}

function EditProfileForm({
  profile,
  email,
  userId,
  onSaved,
}: {
  profile: { full_name?: string; display_name?: string; date_of_birth?: string; gender?: string; bio?: string; phone?: string; avatar_url?: string } | null | undefined;
  email?: string;
  userId: string | null;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!form.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      toast.error(json?.error ?? "Save failed");
      return;
    }
    toast.success("Profile updated");
    onSaved();
    router.back();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${userId}.${ext}`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");
      formData.append("path", path);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ?? "Photo upload failed");
        return;
      }
      const { url } = await res.json();
      const supabase = createClient();
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      if (error) {
        toast.error("Photo uploaded, but couldn't save it to your profile", { description: error.message });
        return;
      }
      setAvatarUrl(url);
      toast.success("Photo updated");
      onSaved();
    } catch (err) {
      console.error("Photo upload failed", err);
      toast.error("Photo upload failed", { description: "Please check your connection and try again." });
    } finally {
      setUploadingPhoto(false);
    }
  }

  const initial = (form.full_name || email || "U").charAt(0).toUpperCase();

  return (
    <div className="p-4 space-y-6">
      {/* Photo */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-16 w-16 rounded-full object-cover border-2 border-teal-100"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-xl font-bold border-2 border-teal-100">
              {initial}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white shadow hover:bg-teal-700 border-2 border-white disabled:opacity-60"
            aria-label="Change photo"
          >
            {uploadingPhoto ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Profile photo</p>
          <p className="text-xs text-gray-500">Tap the camera icon to change it</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Full name<span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            value={form.full_name}
            onChange={field("full_name")}
            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Display name</label>
          <input
            value={form.display_name}
            onChange={field("display_name")}
            placeholder="Shown publicly"
            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={field("phone")}
            placeholder="+91"
            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Date of birth</label>
          <input
            type="date"
            value={form.date_of_birth}
            onChange={field("date_of_birth")}
            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Gender</label>
          <select
            value={form.gender}
            onChange={field("gender")}
            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Select</option>
            {GENDER_OPTIONS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={form.bio}
            onChange={field("bio")}
            rows={3}
            placeholder="A brief introduction about yourself"
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700">
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} disabled={saving} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}
