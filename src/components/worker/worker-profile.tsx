"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Star, LogOut, Edit2, Check, X, Camera,
  MapPin, Clock, ShieldCheck, ShieldAlert,
  CreditCard, ChevronRight, ArrowRight,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { useWorkerProfile } from "@/hooks/use-worker-profile";
import { SectionPersonal }     from "@/components/profile/section-personal";
import { SectionVerification } from "@/components/profile/section-verification";
import { SectionAddress }      from "@/components/profile/section-address";
import { SectionSkills }       from "@/components/profile/section-skills";
import { SectionAvailability } from "@/components/profile/section-availability";
import { SectionPayout }       from "@/components/profile/section-payout";
import { SectionRatings }      from "@/components/profile/section-ratings";

type Section = "personal" | "skills" | "location" | "verification" | "payout" | "ratings" | null;

// ── Helper ────────────────────────────────────────────────────────────────────
function memberSince(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function formatDays(availability: any[]) {
  const active = availability.filter(a => a.available);
  if (!active.length) return null;
  const first = active[0];
  const last  = active[active.length - 1];
  const days  = active.length === 1
    ? first.day_of_week.charAt(0).toUpperCase() + first.day_of_week.slice(1)
    : `${first.day_of_week.charAt(0).toUpperCase() + first.day_of_week.slice(1)}–${last.day_of_week.charAt(0).toUpperCase() + last.day_of_week.slice(1)}`;
  const time = first.start_time && first.end_time
    ? `, ${first.start_time.slice(0,5)} – ${first.end_time.slice(0,5)}`
    : "";
  return `${days}${time}`;
}

// ── Main component ────────────────────────────────────────────────────────────
export function WorkerProfile() {
  const router  = useRouter();
  const { data, loading, refresh } = useWorkerProfile();
  const [openSection, setOpenSection] = useState<Section>(null);
  const [eligibility, setEligibility] = useState<{ canApply: boolean; missing: string[]; completionScore: number } | null>(null);
  // There's no "average_rating"/"total_ratings"/"total_tasks_completed"
  // column on profiles in the real schema — computed live via the same
  // /api/ratings/[userId] endpoint the mobile profile and reviews screens
  // already use, instead of a second rating system.
  const [ratingData, setRatingData] = useState<{ average_rating: number; total_ratings: number; total_tasks_completed: number } | null>(null);

  useEffect(() => {
    fetch("/api/worker/eligibility", { cache: "no-store" })
      .then(r => r.json()).then(setEligibility);
  }, [data]); // re-fetch whenever profile data refreshes

  useEffect(() => {
    const userId = data?.profile?.id;
    if (!userId) return;
    fetch(`/api/ratings/${userId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(result => {
        if (result?.profile) {
          setRatingData({
            average_rating: result.profile.average_rating ?? 0,
            total_ratings: result.profile.total_ratings ?? 0,
            total_tasks_completed: result.profile.total_tasks_completed ?? 0,
          });
        }
      });
  }, [data?.profile?.id]);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
    </div>
  );
  if (!data) return <div className="p-8 text-center text-sm text-gray-500">Failed to load profile. Please refresh.</div>;

  const { profile, email, workerSkills, availability, serviceLocation, payout, identityVerifications } = data;
  const name = profile?.full_name || profile?.display_name || email?.split("@")[0] || "Worker";
  const initial = name.charAt(0).toUpperCase();
  const identityVerified = identityVerifications?.some((v: any) => v.status === "verified");
  const identityPending  = !identityVerified && identityVerifications?.some((v: any) => v.status === "pending");
  const score = eligibility?.completionScore ?? 0;
  const missing = eligibility?.missing ?? [];
  const canApply = eligibility?.canApply ?? false;

  // Show at most 3 next steps
  const nextSteps = missing.slice(0, 3);

  function toggle(s: Section) {
    setOpenSection(prev => prev === s ? null : s);
  }

  // If a section is open, render it full-width in place
  if (openSection) {
    return (
      <div className="mx-auto max-w-2xl p-6 space-y-4">
        <button onClick={() => { setOpenSection(null); refresh(); }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <X className="h-4 w-4" /> Close
        </button>
        {openSection === "personal"      && <SectionPersonal     data={data} onRefresh={() => { refresh(); setOpenSection(null); }} />}
        {openSection === "skills"        && <SectionSkills       data={data} onRefresh={() => { refresh(); setOpenSection(null); }} />}
        {openSection === "location"      && <SectionAddress      data={data} onRefresh={() => { refresh(); setOpenSection(null); }} />}
        {openSection === "verification"  && <SectionVerification data={data} onRefresh={() => { refresh(); setOpenSection(null); }} />}
        {openSection === "payout"        && <SectionPayout       data={data} onRefresh={() => { refresh(); setOpenSection(null); }} />}
        {openSection === "ratings"       && <SectionRatings      data={data} />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-5">

      {/* ── Profile Header ── */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <AvatarUpload
            avatarUrl={profile?.avatar_url}
            initial={initial}
            userId={profile?.id}
            onUpload={refresh}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{name}</h1>

            {/* Single status badge */}
            {identityVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 mt-1">
                <Check className="h-3.5 w-3.5" /> Verified
              </span>
            ) : identityPending ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 mt-1">
                <Clock className="h-3.5 w-3.5" /> Verification pending
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 mt-1">
                <ShieldAlert className="h-3.5 w-3.5" /> Verification needed
              </span>
            )}

            {/* Availability toggle */}
            <p className={`text-xs mt-0.5 ${profile?.is_available ? "text-green-600" : "text-gray-400"}`}>
              {profile?.is_available ? "● Available" : "● Not available"}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-5 text-sm text-gray-500 border-t border-gray-50 pt-4">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            {ratingData?.average_rating?.toFixed(1) ?? "0"} Ratings
          </span>
          <span>{ratingData?.total_tasks_completed ?? 0} Jobs</span>
          {profile?.created_at && <span>Since {memberSince(profile.created_at)}</span>}
        </div>
      </div>

      {/* ── Profile Completion ── */}
      {!canApply ? (
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">Complete your profile</span>
            <span className="text-sm font-bold text-purple-600">{score}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/70 mb-3">
            <div className="h-2 rounded-full bg-purple-600 transition-all duration-700" style={{ width: `${score}%` }} />
          </div>
          {nextSteps.length > 0 && (
            <ul className="space-y-1 mb-4">
              {nextSteps.map(s => (
                <li key={s} className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => router.push("/worker/onboarding")}
            className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700"
          >
            Continue setup <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Profile ready — 100% complete</p>
            <p className="text-xs text-green-600">You can apply for jobs.</p>
          </div>
        </div>
      )}

      {/* ── Two-column card grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Personal information */}
        <ProfileCard
          title="Personal information"
          onEdit={() => toggle("personal")}
        >
          <InfoRow label="Name"  value={name} />
          <InfoRow label="Phone" value={profile?.phone} verified={profile?.phone_verified} />
          <InfoRow label="Email" value={email} verified={!!data.profile?.email_verified} />
        </ProfileCard>

        {/* Work & Skills */}
        <ProfileCard
          title="Work & Skills"
          onEdit={() => toggle("skills")}
          emptyLabel={workerSkills.length === 0 ? "Add the services you offer" : undefined}
        >
          {workerSkills.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {workerSkills.slice(0, 4).map((s: any) => (
                  <span key={s.id} className="rounded-full bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-xs text-purple-700 font-medium">
                    {s.skills?.name ?? s.custom_skill_name}
                  </span>
                ))}
              </div>
              {data.experience?.years_experience && (
                <p className="text-xs text-gray-500">{data.experience.years_experience} year{data.experience.years_experience !== 1 ? "s" : ""} experience</p>
              )}
            </>
          )}
        </ProfileCard>

        {/* Location & Availability */}
        <ProfileCard
          title="Location & Availability"
          onEdit={() => toggle("location")}
          emptyLabel={!serviceLocation ? "Add your service location" : undefined}
        >
          {serviceLocation && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-sm text-gray-700">
                <MapPin className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                {[serviceLocation.area, serviceLocation.city].filter(Boolean).join(", ") || "—"}
              </p>
              {serviceLocation.service_radius && (
                <p className="text-xs text-gray-500 pl-5">Within {serviceLocation.service_radius} km</p>
              )}
              {availability && availability.length > 0 && formatDays(availability) && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {formatDays(availability)}
                </p>
              )}
              {profile?.available_now && (
                <p className="text-xs font-medium text-green-600 pl-5">Available now</p>
              )}
            </div>
          )}
        </ProfileCard>

        {/* Verification */}
        <ProfileCard
          title="Verification"
          onEdit={() => toggle("verification")}
          editLabel="Verify"
        >
          {identityVerified ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-medium">Identity verified</span>
            </div>
          ) : identityPending ? (
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <Clock className="h-4 w-4" />
              <span>Verification pending — usually 24 hours</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShieldAlert className="h-4 w-4 text-yellow-500" />
                <span>Not verified</span>
              </div>
              <p className="text-xs text-gray-400">Required to apply for jobs.</p>
            </div>
          )}
        </ProfileCard>

        {/* Payout */}
        <ProfileCard
          title="Payout"
          onEdit={() => toggle("payout")}
          editLabel="Manage"
          emptyLabel={!payout ? "Add bank or UPI details" : undefined}
        >
          {payout && (
            <div className="space-y-1">
              {payout.masked_account && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CreditCard className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="font-mono">{payout.masked_account}</span>
                  {payout.verified && <Check className="h-3.5 w-3.5 text-green-500" />}
                </div>
              )}
              {payout.upi_id && (
                <p className="text-xs text-gray-500 pl-5">{payout.upi_id}</p>
              )}
            </div>
          )}
        </ProfileCard>

        {/* Reviews */}
        <ProfileCard
          title="Reviews"
          onEdit={ratingData?.total_ratings ? () => toggle("ratings") : undefined}
          editLabel="View all"
        >
          <div className="flex items-center gap-2">
            <Star className={`h-5 w-5 ${(ratingData?.average_rating ?? 0) > 0 ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
            <span className="text-lg font-bold text-gray-900">
              {(ratingData?.average_rating ?? 0) > 0 ? ratingData!.average_rating.toFixed(1) : "0.0"}
            </span>
            <span className="text-xs text-gray-400">
              {ratingData?.total_ratings ? `${ratingData.total_ratings} review${ratingData.total_ratings !== 1 ? "s" : ""}` : "No reviews yet"}
            </span>
          </div>
        </ProfileCard>
      </div>

      {/* Sign out */}
      <button
        onClick={async () => { await signOut(); router.push("/login"); }}
        className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

// ── ProfileCard ───────────────────────────────────────────────────────────────
function ProfileCard({
  title, children, onEdit, editLabel = "Edit", emptyLabel,
}: {
  title: string;
  children?: React.ReactNode;
  onEdit?: () => void;
  editLabel?: string;
  emptyLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {onEdit && (
          <button onClick={onEdit}
            className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700">
            {editLabel === "Edit" ? <Edit2 className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {editLabel}
          </button>
        )}
      </div>
      {emptyLabel ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{emptyLabel}</p>
          {onEdit && (
            <button onClick={onEdit} className="text-xs font-semibold text-purple-600 hover:underline">
              + Add
            </button>
          )}
        </div>
      ) : children}
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value, verified }: { label: string; value?: string | null; verified?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="flex items-center gap-1 font-medium text-gray-800 text-right max-w-[65%] truncate">
        {value}
        {verified && <Check className="h-3 w-3 text-green-500 shrink-0" />}
      </span>
    </div>
  );
}

// ── Avatar upload ────────────────────────────────────────────────────────────
function AvatarUpload({ avatarUrl, initial, userId, onUpload }: {
  avatarUrl?: string | null;
  initial: string;
  userId?: string;
  onUpload: () => void;
}) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const ext  = file.name.split(".").pop();
      const path = `avatars/${userId}.${ext}`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");
      formData.append("path", path);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error("Upload failed", { description: err?.error });
        return;
      }
      const { url } = await res.json();
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      if (error) {
        toast.error("Photo uploaded, but couldn't save it to your profile", { description: error.message });
        return;
      }
      toast.success("Photo updated");
      onUpload();
    } catch (err) {
      console.error("Avatar upload failed", err);
      toast.error("Upload failed", { description: "Please check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Profile"
          className="h-16 w-16 rounded-full object-cover border-2 border-purple-100" />
      ) : (
        <div className="h-16 w-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-purple-100">
          {initial}
        </div>
      )}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white shadow hover:bg-purple-700 border-2 border-white"
        aria-label="Change photo"
      >
        <Camera className="h-3 w-3" />
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handle} />
    </div>
  );
}
