"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, Camera, MapPin, Navigation } from "lucide-react";
import { OnboardingStep } from "@/components/worker/onboarding/onboarding-step";
import { useAuthGuard } from "@/lib/auth-guard";
import { getCurrentPosition } from "@/lib/location-utils";
import { createClient } from "@/lib/supabase/client";

const TOTAL_STEPS = 11;

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"] as const;
const DAY_LABELS: Record<string, string> = { mon:"Mon", tue:"Tue", wed:"Wed", thu:"Thu", fri:"Fri", sat:"Sat", sun:"Sun" };

const CATEGORIES = [
  "Home Cleaning","Cooking","Laundry","Gardening","House Help",
  "Elder Care","Child Care","Patient Assistance","Companion Care",
  "Grocery Delivery","Parcel Pickup","Shopping","Local Errands",
  "Computer Help","Mobile Help","Wi-Fi Setup","Device Setup",
  "Event Help","Moving Assistance","Photography","Tutoring","Other",
];

const EXPERIENCE_OPTIONS = [
  "No experience","Less than 1 year","1–2 years","3–5 years","5+ years",
];

const RADIUS_OPTIONS = [2, 5, 10, 20];

type Availability = { day_of_week: string; available: boolean; start_time: string; end_time: string };

function defaultAvailability(): Availability[] {
  return DAYS.map(d => ({ day_of_week: d, available: false, start_time: "09:00", end_time: "18:00" }));
}

// ── Find first unanswered step ────────────────────────────────────────────────
function findFirstIncompleteStep(state: {
  full_name?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  phone_verified?: boolean | null;
  email_verified: boolean;
  avatar_url?: string | null;
  has_categories: boolean;
  has_experience: boolean;
  has_location: boolean;
  has_availability: boolean;
}): number {
  if (!state.full_name?.trim())            return 1;
  if (!state.date_of_birth)               return 2;
  if (!state.phone?.trim() || !state.phone_verified) return 3;
  if (!state.email_verified)              return 4;
  if (!state.avatar_url)                  return 5;
  if (!state.has_categories)              return 6;
  if (!state.has_experience)              return 7;
  if (!state.has_location)               return 8;
  // step 9 = radius (minor, skip if location done)
  if (!state.has_availability)            return 10;
  return 11; // identity verification — always show last
}

export default function WorkerOnboardingPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();

  const [step,        setStep]        = useState(0); // 0 = loading, will be set after profile check
  const [saving,      setSaving]      = useState(false);
  const [locating, setLocating] = useState(false);
  const [done,     setDone]     = useState(false);

  // All answers collected during onboarding
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Individual step state (controlled inputs)
  const [fullName,      setFullName]      = useState("");
  const [dob,           setDob]           = useState("");
  const [phone,         setPhone]         = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent,       setOtpSent]       = useState(false);
  const [otp,           setOtp]           = useState("");
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const [categories,    setCategories]    = useState<string[]>([]);
  const [experience,    setExperience]    = useState("");
  const [expDesc,       setExpDesc]       = useState("");
  const [location, setLocation] = useState({ city: "", area: "", pin_code: "", latitude: null as number|null, longitude: null as number|null });
  const [radius,        setRadius]        = useState(5);
  const [availability,  setAvailability]  = useState<Availability[]>(defaultAvailability());
  const [availableNow,  setAvailableNow]  = useState(false);

  // ── Resume progress from server ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = createClient();

      // Fetch both saved progress and current profile state in parallel
      const [progressRes, profileRes, skillRes, locRes, availRes] = await Promise.all([
        fetch("/api/worker/onboarding"),
        supabase.from("profiles").select("full_name, date_of_birth, phone, phone_verified, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("worker_skills").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("service_locations").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("availability").select("*").eq("user_id", user.id),
      ]);

      if (!progressRes.ok) return;
      const { progress } = await progressRes.json();

      if (progress?.completed_at) {
        // Only skip onboarding if the profile is actually complete.
        // If completed_at is set but eligibility still shows missing items
        // (e.g. a field was added later or got cleared), we fall through and
        // land on the first incomplete step so the user can fix it.
        const eligRes = await fetch("/api/worker/eligibility", { cache: "no-store" });
        if (eligRes.ok) {
          const elig = await eligRes.json();
          if (elig.canApply) {
            router.replace("/worker/dashboard");
            return;
          }
          // Profile marked complete but eligibility says incomplete —
          // fall through to resume at the first missing step below.
        } else {
          // Couldn't check eligibility — safe default is to show the dashboard
          router.replace("/worker/dashboard");
          return;
        }
      }

      // Pre-fill state from existing profile data
      const profile = profileRes.data;
      const skills  = (skillRes.data as any)?.count ?? 0;
      const loc     = locRes.data;
      const avail   = availRes.data ?? [];

      const savedAnswers = progress?.answers ?? {};
      const merged = { ...savedAnswers };
      setAnswers(merged);

      if (profile?.full_name)      { setFullName(profile.full_name);        merged.full_name = profile.full_name; }
      if (profile?.date_of_birth)  { setDob(profile.date_of_birth);         merged.date_of_birth = profile.date_of_birth; }
      if (profile?.phone)          { setPhone(profile.phone);               merged.phone = profile.phone; }
      if (profile?.phone_verified) { setPhoneVerified(true);                merged.phone_verified = true; }
      if (profile?.avatar_url)     { setPhotoUrl(profile.avatar_url);       merged.avatar_url = profile.avatar_url; }
      if (savedAnswers.categories)  setCategories(savedAnswers.categories);
      if (savedAnswers.experience)  setExperience(savedAnswers.experience);
      if (savedAnswers.exp_desc)    setExpDesc(savedAnswers.exp_desc);
      if (loc) {
        setLocation({ city: loc.city ?? "", area: loc.area ?? "", pin_code: loc.pin_code ?? "", latitude: loc.latitude, longitude: loc.longitude });
        setRadius(loc.service_radius ?? 5);
        merged.service_location = { city: loc.city, area: loc.area, pin_code: loc.pin_code, latitude: loc.latitude, longitude: loc.longitude, service_radius: loc.service_radius ?? 5 };
      }
      if (avail.length > 0) {
        setAvailability(DAYS.map(d => {
          const e = avail.find((r: any) => r.day_of_week === d);
          return { day_of_week: d, available: e?.available ?? false, start_time: e?.start_time ?? "09:00", end_time: e?.end_time ?? "18:00" };
        }));
        merged.availability = avail;
      }

      setAnswers(merged);

      // Find the first step that is NOT yet answered and start there
      const firstIncomplete = findFirstIncompleteStep({
        full_name:     profile?.full_name,
        date_of_birth: profile?.date_of_birth,
        phone:         profile?.phone,
        phone_verified: profile?.phone_verified,
        email_verified: !!user.email_confirmed_at,
        avatar_url:    profile?.avatar_url,
        has_categories: skills > 0 || (savedAnswers.categories?.length ?? 0) > 0,
        has_experience: !!savedAnswers.experience,
        has_location:  !!loc,
        has_availability: avail.some((a: any) => a.available),
      });

      setStep(firstIncomplete);
    })();
  }, [user, router]);

  // ── Persist step progress ──────────────────────────────────────────────
  const saveStep = useCallback(async (stepNum: number, patch: Record<string, any>) => {
    const merged = { ...answers, ...patch };
    setAnswers(merged);
    await fetch("/api/worker/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: stepNum, answers: merged }),
    });
  }, [answers]);

  async function next(patch: Record<string, any> = {}) {
    setSaving(true);
    await saveStep(step, patch);
    setSaving(false);
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else await finish();
  }

  async function finish() {
    setSaving(true);
    await fetch("/api/worker/onboarding", { method: "PUT" });
    setSaving(false);
    setDone(true);
  }

  function back() { if (step > 1) setStep(s => s - 1); }

  // ── Phone OTP (provider-ready stub) ──────────────────────────────────
  async function sendOtp() {
    if (!phone.trim()) { toast.error("Enter your phone number"); return; }
    setOtpSent(true);
    toast.info("OTP sent (connect your SMS provider to enable real verification)");
  }

  async function verifyOtp() {
    if (!otp.trim()) { toast.error("Enter the OTP"); return; }
    // TODO: call your OTP provider verification endpoint
    // For now: mark as verified after user enters any 6-digit code
    setPhoneVerified(true);
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) await supabase.from("profiles").update({ phone, phone_verified: true }).eq("id", u.id);
    toast.success("Phone verified");
  }

  // ── Photo upload ──────────────────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "avatars");
    formData.append("path", path);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) { toast.error("Upload failed"); setUploading(false); return; }
    const { url } = await res.json();
    setPhotoUrl(url);
    setUploading(false);
    toast.success("Photo uploaded");
  }

  // ── GPS location ──────────────────────────────────────────────────────
  async function useCurrentLocation() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const geo = await res.json();
      const a   = geo.address ?? {};
      setLocation({ city: a.city ?? a.town ?? a.village ?? "", area: a.suburb ?? a.road ?? "", pin_code: a.postcode ?? "", latitude: lat, longitude: lng });
      toast.success("Location detected — please confirm below");
    } catch { toast.error("Couldn't get location. Please enter manually."); }
    setLocating(false);
  }

  // ── Availability helpers ──────────────────────────────────────────────
  function toggleDay(day: string) {
    setAvailability(prev => prev.map(a => a.day_of_week === day ? { ...a, available: !a.available } : a));
  }
  function setDayTime(day: string, field: "start_time"|"end_time", val: string) {
    setAvailability(prev => prev.map(a => a.day_of_week === day ? { ...a, [field]: val } : a));
  }

  // ── Loading — wait until profile check determines the right first step ────
  if (authLoading || step === 0) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
    </div>
  );

  // ── COMPLETION SCREEN ─────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <span className="font-heading text-2xl font-extrabold tracking-tight text-gray-900">
            wysa<span className="text-purple-600">.</span>
          </span>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">🎉 You&apos;re ready to work!</h1>
            <p className="mt-2 text-sm text-gray-500">
              Your profile has been set up. You can start browsing and applying for tasks.
            </p>
            <button
              onClick={() => router.replace("/worker/dashboard")}
              className="mt-6 w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP RENDERS ──────────────────────────────────────────────────────

  // Step 1 — Full name
  if (step === 1) return (
    <OnboardingStep step={1} totalSteps={TOTAL_STEPS}
      title="What's your full name?"
      subtitle="We'll use this to create your worker profile."
      onContinue={() => { if (!fullName.trim()) { toast.error("Enter your name"); return; } next({ full_name: fullName.trim() }); }}
      continueDisabled={!fullName.trim()} loading={saving}
    >
      <input value={fullName} onChange={e => setFullName(e.target.value)}
        placeholder="Your full name"
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
        onKeyDown={e => e.key === "Enter" && next({ full_name: fullName.trim() })}
      />
    </OnboardingStep>
  );

  // Step 2 — Date of birth
  if (step === 2) return (
    <OnboardingStep step={2} totalSteps={TOTAL_STEPS}
      title="What's your date of birth?"
      subtitle="You must be 18 or older to work as a Wysa."
      onContinue={() => { if (!dob) { toast.error("Select your date of birth"); return; }
        const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25*24*60*60*1000));
        if (age < 18) { toast.error("You must be at least 18 years old"); return; }
        next({ date_of_birth: dob });
      }}
      onBack={back} continueDisabled={!dob} loading={saving}
    >
      <input type="date" value={dob} onChange={e => setDob(e.target.value)}
        max={new Date(Date.now() - 18*365.25*24*60*60*1000).toISOString().split("T")[0]}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
      />
    </OnboardingStep>
  );

  // Step 3 — Phone
  if (step === 3) return (
    <OnboardingStep step={3} totalSteps={TOTAL_STEPS}
      title="What's your phone number?"
      subtitle="We'll send a verification code to confirm it."
      onContinue={() => { if (!phoneVerified) { toast.error("Please verify your phone number"); return; } next({ phone, phone_verified: true }); }}
      onBack={back} continueDisabled={!phoneVerified} loading={saving}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <span className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">🇮🇳 +91</span>
          <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0,10))}
            placeholder="Phone number" type="tel"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
        {!otpSent ? (
          <button onClick={sendOtp} disabled={phone.length < 10}
            className="w-full rounded-xl border border-purple-600 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-40">
            Send OTP
          </button>
        ) : !phoneVerified ? (
          <>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
              placeholder="Enter 6-digit OTP" maxLength={6}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-sm tracking-widest focus:border-purple-500 focus:outline-none"
            />
            <button onClick={verifyOtp} disabled={otp.length < 6}
              className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-40">
              Verify OTP
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" /> Phone verified
          </div>
        )}
      </div>
    </OnboardingStep>
  );

  // Step 4 — Email (display + link to verify)
  if (step === 4) {
    const emailVerified = !!user?.email_confirmed_at;
    return (
      <OnboardingStep step={4} totalSteps={TOTAL_STEPS}
        title="Email verification"
        subtitle="Your email must be verified before you can apply for jobs."
        onContinue={() => next({ email: user?.email, email_verified: emailVerified })}
        onBack={back} loading={saving}
      >
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 mb-3">
          {user?.email}
        </div>
        {emailVerified ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" /> Email verified
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Email not yet verified. Check your inbox for the confirmation link, then come back.
          </div>
        )}
      </OnboardingStep>
    );
  }

  // Step 5 — Profile photo
  if (step === 5) return (
    <OnboardingStep step={5} totalSteps={TOTAL_STEPS}
      title="Add a profile photo"
      subtitle="A clear photo helps customers trust you."
      onContinue={() => next({ avatar_url: photoUrl })}
      onBack={back}
      onSkip={() => next({})}
      loading={saving || uploading}
    >
      <div className="flex flex-col items-center gap-4">
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" className="h-28 w-28 rounded-full object-cover border-4 border-purple-200" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50">
            <Camera className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <label className="cursor-pointer rounded-xl border border-purple-600 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50">
          {photoUrl ? "Change Photo" : "Upload Photo"}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
        </label>
        {uploading && <p className="text-xs text-gray-400">Uploading…</p>}
      </div>
    </OnboardingStep>
  );

  // Step 6 — Work categories
  if (step === 6) return (
    <OnboardingStep step={6} totalSteps={TOTAL_STEPS}
      title="What kind of work do you want to do?"
      subtitle="Select all that apply. You can add more later."
      onContinue={() => { if (categories.length === 0) { toast.error("Select at least one category"); return; } next({ categories }); }}
      onBack={back} continueDisabled={categories.length === 0} loading={saving}
    >
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              categories.includes(cat)
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}>
            {cat}
          </button>
        ))}
      </div>
      {categories.length > 0 && (
        <p className="mt-3 text-xs text-purple-600 font-medium">{categories.length} selected</p>
      )}
    </OnboardingStep>
  );

  // Step 7 — Experience
  if (step === 7) return (
    <OnboardingStep step={7} totalSteps={TOTAL_STEPS}
      title="How much experience do you have?"
      subtitle="Select the option that best describes you."
      onContinue={() => { if (!experience) { toast.error("Select your experience level"); return; } next({ experience, exp_desc: expDesc }); }}
      onBack={back} continueDisabled={!experience} loading={saving}
    >
      <div className="space-y-2 mb-4">
        {EXPERIENCE_OPTIONS.map(opt => (
          <button key={opt} onClick={() => setExperience(opt)}
            className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
              experience === opt
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}>
            {opt}
          </button>
        ))}
      </div>
      <textarea value={expDesc} onChange={e => setExpDesc(e.target.value)} rows={3}
        placeholder="Briefly describe your experience (optional)"
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:border-purple-500 focus:outline-none"
      />
    </OnboardingStep>
  );

  // Step 8 — Location
  if (step === 8) return (
    <OnboardingStep step={8} totalSteps={TOTAL_STEPS}
      title="Where do you want to work?"
      subtitle="This helps us match you with tasks nearby."
      onContinue={() => { if (!location.city.trim()) { toast.error("Enter your city"); return; }
        next({ service_location: { ...location, service_radius: radius } }); }}
      onBack={back} continueDisabled={!location.city.trim()} loading={saving || locating}
    >
      <div className="space-y-3">
        <button onClick={useCurrentLocation} disabled={locating}
          className="flex w-full items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50">
          <Navigation className="h-4 w-4" />{locating ? "Detecting…" : "Use my current location"}
        </button>
        <div className="grid grid-cols-2 gap-3">
          {[["city","City *"],["area","Area / Locality"],["pin_code","PIN Code"]].map(([k, label]) => (
            <input key={k} value={(location as any)[k]} onChange={e => setLocation(p => ({ ...p, [k]: e.target.value }))}
              placeholder={label}
              className={`rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none ${k === "city" ? "col-span-2" : ""}`}
            />
          ))}
        </div>
      </div>
    </OnboardingStep>
  );

  // Step 9 — Service radius
  if (step === 9) return (
    <OnboardingStep step={9} totalSteps={TOTAL_STEPS}
      title="How far can you travel?"
      subtitle="We'll only show tasks within your chosen radius."
      onContinue={() => next({ service_location: { ...location, service_radius: radius } })}
      onBack={back} loading={saving}
    >
      <div className="space-y-3">
        {RADIUS_OPTIONS.map(r => (
          <button key={r} onClick={() => setRadius(r)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              radius === r ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}>
            <span>{r} km</span>
            {radius === r && <CheckCircle className="h-4 w-4 text-purple-600" />}
          </button>
        ))}
        {location.city && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-purple-500" />
            <span>{location.city} · Service radius: <strong>{radius} km</strong></span>
          </div>
        )}
      </div>
    </OnboardingStep>
  );

  // Step 10 — Availability
  if (step === 10) return (
    <OnboardingStep step={10} totalSteps={TOTAL_STEPS}
      title="When are you available to work?"
      subtitle="Set your weekly schedule. You can update this anytime."
      onContinue={() => {
        const hasSome = availability.some(a => a.available) || availableNow;
        if (!hasSome) { toast.error("Set at least one available day or select 'Available now'"); return; }
        next({ availability, available_now: availableNow });
      }}
      onBack={back} loading={saving}
    >
      <div className="space-y-3">
        <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer">
          <div onClick={() => setAvailableNow(v => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors ${availableNow ? "bg-purple-600" : "bg-gray-300"}`}>
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${availableNow ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">Available now</span>
        </label>

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Schedule</p>
        {availability.map(a => {
          const label = DAY_LABELS[a.day_of_week];
          return (
            <div key={a.day_of_week} className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${a.available ? "border-purple-200 bg-purple-50" : "border-gray-100 bg-gray-50"}`}>
              <div onClick={() => toggleDay(a.day_of_week)}
                className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${a.available ? "bg-purple-600" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${a.available ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="w-10 text-sm font-medium text-gray-800">{label}</span>
              {a.available && (
                <div className="flex items-center gap-2 text-xs">
                  <input type="time" value={a.start_time} onChange={e => setDayTime(a.day_of_week, "start_time", e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-purple-500 focus:outline-none" />
                  <span className="text-gray-400">to</span>
                  <input type="time" value={a.end_time} onChange={e => setDayTime(a.day_of_week, "end_time", e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-purple-500 focus:outline-none" />
                </div>
              )}
              {!a.available && <span className="text-xs text-gray-400">Not available</span>}
            </div>
          );
        })}
      </div>
    </OnboardingStep>
  );

  // Step 11 — Identity verification
  if (step === 11) return (
    <OnboardingStep step={11} totalSteps={TOTAL_STEPS}
      title="Verify your identity"
      subtitle="Identity verification is required before you can apply for jobs."
      onContinue={finish}
      onBack={back}
      continueLabel="Complete Setup →"
      loading={saving}
    >
      <div className="space-y-3">
        <p className="text-xs text-gray-500">Choose a verification method:</p>
        <a href="/profile?tab=verification"
          className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4 hover:border-purple-300 hover:bg-purple-50 transition-colors">
          <div>
            <p className="text-sm font-semibold text-gray-900">Aadhaar Verification</p>
            <p className="text-xs text-gray-500 mt-0.5">Verify using your Virtual ID (VID)</p>
          </div>
          <span className="text-xs text-gray-400">→</span>
        </a>
        <a href="/profile?tab=verification"
          className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4 hover:border-purple-300 hover:bg-purple-50 transition-colors">
          <div>
            <p className="text-sm font-semibold text-gray-900">PAN Verification</p>
            <p className="text-xs text-gray-500 mt-0.5">Verify with your PAN card details</p>
          </div>
          <span className="text-xs text-gray-400">→</span>
        </a>
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          You can skip verification now and complete it from your profile. You won&apos;t be able to apply for jobs until verified.
        </div>
      </div>
    </OnboardingStep>
  );

  return null;
}
