"use client";

import { useRef, useState } from "react";
import { Camera, Star, CheckCircle, Circle } from "lucide-react";
import { toast } from "sonner";
import { VerificationBadge } from "./profile-ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Props = { data: any; onRefresh: () => void };

export function ProfileHeader({ data, onRefresh }: Props) {
  const { profile, email, identityVerifications } = data;
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const identityStatus = identityVerifications?.find((v: any) => v.status === "verified")
    ? "verified"
    : identityVerifications?.length > 0
    ? identityVerifications[0].status
    : "unverified";

  const name = profile?.full_name || profile?.display_name || email?.split("@")[0] || "Worker";
  const initial = name.charAt(0).toUpperCase();

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");
      formData.append("path", path);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Upload failed");
      }
      const { url } = await res.json();
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      toast.success("Photo updated");
      onRefresh();
    } catch (err: unknown) {
      toast.error("Upload failed", { description: err instanceof Error ? err.message : String(err) });
    }
    setUploading(false);
  }

  const statusDot = profile?.is_available
    ? <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
    : <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Teal top-bar */}
      <div className="h-24 rounded-t-xl bg-gradient-to-r from-teal-600 to-teal-500" />

      <div className="px-6 pb-6">
        <div className="relative -mt-12 flex items-end gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-teal-600 text-2xl font-bold text-white">{initial}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-teal-600 text-white shadow hover:bg-teal-700"
              aria-label="Change photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div className="mb-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{name}</h1>
              <VerificationBadge status={identityStatus} />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {profile?.worker_id && (
                <span className="font-mono text-xs text-gray-400">{profile.worker_id}</span>
              )}
              <span className="flex items-center gap-1">
                {statusDot}
                {profile?.is_available ? "Available for tasks" : "Not available"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-6 border-t border-gray-100 pt-4 text-center">
          <div>
            <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {profile?.average_rating?.toFixed(1) ?? "—"}
            </div>
            <div className="text-xs text-gray-500">{profile?.total_ratings ?? 0} ratings</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{profile?.total_tasks_completed ?? 0}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          {profile?.on_time_rate != null && (
            <div>
              <div className="text-lg font-bold text-gray-900">{profile.on_time_rate}%</div>
              <div className="text-xs text-gray-500">On-time</div>
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              {new Date(profile?.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            </div>
            <div className="text-xs text-gray-500">Member since</div>
          </div>
        </div>

        {/* Account status */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {profile?.account_status ?? "active"}
          </Badge>
          <Badge variant="outline" className={
            profile?.verification_status === "verified"
              ? "border-green-200 bg-green-50 text-green-700 text-xs"
              : "border-yellow-200 bg-yellow-50 text-yellow-700 text-xs"
          }>
            {profile?.verification_status === "verified" ? "✓ Identity Verified" : "Identity Unverified"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
