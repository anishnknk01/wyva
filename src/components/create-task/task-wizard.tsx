"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";
import {
  ArrowLeft, ArrowRight, MapPin, Navigation, Search,
  Broom, ShoppingCart, Truck, HeartHandshake, Baby, Home,
  BookOpen, Monitor, Leaf, PartyPopper, Utensils, Camera,
  Dumbbell, Compass, Hospital, HelpCircle,
  CalendarDays, CalendarClock, CalendarCheck,
  Sunrise, Sun, Sunset, Moon,
  IndianRupee, FileText, Clock,
  Smartphone, CreditCard, Wallet, Loader2, ShieldCheck,
  ImagePlus, X, Star, Check,
} from "lucide-react";
import { saveTask, generateTaskId } from "@/lib/task-store";
import { taskPlatformFee, type TaskCategory, taskBudgetPresets, type PaymentMethod } from "@/lib/tasks";
import { getCurrentPosition } from "@/lib/location-utils";
import { useUser } from "@/lib/use-user";

// Razorpay global
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const TOTAL_STEPS = 8;
// Matches the server-side limit in /api/tasks/[taskId]/photos, which only
// accepts the first 5 files per request — keeping these in sync avoids
// silently dropping a photo the user thought they'd successfully added.
const MAX_PHOTOS = 5;

type PendingPhoto = { file: File; previewUrl: string };

const CATEGORY_CARDS: { icon: React.ElementType; label: string; value: TaskCategory }[] = [
  { icon: Broom,          label: "Cleaning",    value: "General assistance" },
  { icon: ShoppingCart,   label: "Shopping",    value: "Shopping" },
  { icon: Truck,          label: "Delivery",    value: "Errands" },
  { icon: HeartHandshake, label: "Elder Care",  value: "Elder assistance" },
  { icon: Baby,           label: "Child Care",  value: "Companion" },
  { icon: Home,           label: "Home Help",   value: "Companion" },
  { icon: BookOpen,       label: "Study Help",  value: "Study" },
  { icon: Monitor,        label: "Tech Help",   value: "Tech help" },
  { icon: Leaf,           label: "Gardening",   value: "General assistance" },
  { icon: PartyPopper,    label: "Events",      value: "Events" },
  { icon: Utensils,       label: "Food",        value: "Food" },
  { icon: Camera,         label: "Photography", value: "Photography" },
  { icon: Dumbbell,       label: "Sports",      value: "Sports" },
  { icon: Compass,        label: "Exploration", value: "Local exploration" },
  { icon: Hospital,       label: "Hospital",    value: "Hospital/appointment accompaniment" },
  { icon: HelpCircle,     label: "Other",       value: "General assistance" },
];

const LABEL_TO_CATEGORY: Record<string, TaskCategory> = {
  "Cleaning": "General assistance", "Shopping": "Shopping", "Delivery": "Errands",
  "Elder Care": "Elder assistance", "Child Care": "Companion", "Home Help": "Companion",
  "Study Help": "Study", "Tech Help": "Tech help", "Gardening": "General assistance",
  "Events": "Events", "Food": "Food", "Photography": "Photography",
  "Sports": "Sports", "Exploration": "Local exploration",
  "Hospital": "Hospital/appointment accompaniment", "Other": "General assistance",
};

const DATE_OPTIONS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: "today",    label: "Today",       icon: CalendarCheck },
  { id: "tomorrow", label: "Tomorrow",    icon: CalendarDays  },
  { id: "pick",     label: "Pick a date", icon: CalendarClock },
];

const TIME_OPTIONS: { id: string; label: string; icon: React.ElementType; time: string }[] = [
  { id: "morning",   label: "Morning",   icon: Sunrise, time: "09:00" },
  { id: "afternoon", label: "Afternoon", icon: Sun,     time: "13:00" },
  { id: "evening",   label: "Evening",   icon: Sunset,  time: "17:00" },
  { id: "night",     label: "Night",     icon: Moon,    time: "20:00" },
];

const BUDGET_PRESETS = [...taskBudgetPresets];
const BUDGET_UNSURE  = -1;

function todayStr()    { return new Date().toISOString().split("T")[0]; }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; }

type WizardData = {
  categoryLabel: string; category: TaskCategory | ""; customCategoryText: string;
  description: string; area: string; locationNote: string;
  // Exact location — set by the map picker (search + draggable pin + Confirm Location).
  // area/locationNote above stay as the freeform text fields already used elsewhere
  // (review screen, task list); these carry the precise pin data alongside them.
  locationCoordinates: { lat: number; lng: number } | null;
  locationName: string;
  locationAddress: string;
  dateOption: string; customDate: string; timeOption: string; customTime: string;
  budget: number | ""; paymentMethod: PaymentMethod;
};

const INITIAL: WizardData = {
  categoryLabel: "", category: "", customCategoryText: "",
  description: "", area: "", locationNote: "",
  locationCoordinates: null, locationName: "", locationAddress: "",
  dateOption: "", customDate: "", timeOption: "", customTime: "",
  budget: 500, paymentMethod: "upi",
};

// ── Main ──────────────────────────────────────────────────────────────────────
export function TaskWizard() {
  const router       = useRouter();
  const { user }     = useUser();

  const [step,        setStep]        = useState(1);
  const [data,        setData]        = useState<WizardData>(INITIAL);
  const [submitting,  setSubmitting]  = useState(false);
  const [locating,    setLocating]    = useState(false);

  // Photos — held as local File objects with object-URL previews until the
  // task is actually created, then uploaded via the existing
  // /api/tasks/[taskId]/photos route and attached to the saved task.
  const [photos,      setPhotos]      = useState<PendingPhoto[]>([]);
  const [mainPhotoIdx, setMainPhotoIdx] = useState(0);

  useEffect(() => {
    // Read URL params via window.location (client-only) instead of
    // useSearchParams() which crashes Next.js static prerender on Vercel.
    const params = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
    const cat  = params.get("category");
    const area = params.get("area");
    if (cat) {
      const card = CATEGORY_CARDS.find(c => c.value === cat || c.label.toLowerCase() === cat.toLowerCase());
      setData(d => ({ ...d, categoryLabel: card?.label ?? cat, category: (LABEL_TO_CATEGORY[card?.label ?? ""] ?? cat) as TaskCategory }));
      setStep(2);
    }
    if (area) setData(d => ({ ...d, area }));
  }, []);

  function patch(p: Partial<WizardData>) { setData(d => ({ ...d, ...p })); }
  function next() { setStep(s => Math.min(s + 1, TOTAL_STEPS)); window.scrollTo({ top: 0 }); }
  function back() { setStep(s => Math.max(s - 1, 1)); window.scrollTo({ top: 0 }); }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const pos     = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = pos.coords;
      const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      let address   = "";
      if (mapsKey) {
        const res  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsKey}`);
        const json = await res.json();
        if (json.results?.[0]) {
          const parts = json.results[0].address_components as any[];
          const sub   = parts.find((p: any) => p.types.includes("sublocality_level_1") || p.types.includes("neighborhood"))?.long_name;
          const city  = parts.find((p: any) => p.types.includes("locality"))?.long_name;
          address = [sub, city].filter(Boolean).join(", ") || json.results[0].formatted_address;
        }
      } else {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const geo = await res.json();
        const a   = geo.address ?? {};
        address = [[a.suburb, a.road].filter(Boolean).join(", "), a.city ?? a.town ?? a.village].filter(Boolean).join(", ");
      }
      patch({ area: address });
      toast.success("Location detected — pin moved on map.");
    } catch { toast.error("Couldn't detect location. Please type it manually."); }
    setLocating(false);
  }

  async function handleSubmit() {
    if (!user) { toast.error("Please log in to post a task."); router.push("/login"); return; }
    const resolvedDate = data.dateOption === "today" ? todayStr() : data.dateOption === "tomorrow" ? tomorrowStr() : data.customDate || todayStr();
    const resolvedTime = data.timeOption === "pick" ? (data.customTime || "09:00") : TIME_OPTIONS.find(t => t.id === data.timeOption)?.time ?? "09:00";
    const budget = data.budget === BUDGET_UNSURE || data.budget === "" ? 500 : Number(data.budget);
    const title  = data.description.trim().slice(0, 80) || `${data.categoryLabel} task`;
    setSubmitting(true);

    // Step 1: Save the task at payment_pending status
    const taskId = generateTaskId();
    const saved  = await saveTask({
      id: taskId, customerId: user.id, title, description: data.description.trim(),
      category: data.category || "General assistance", area: data.area, locationNote: data.locationNote,
      locationCoordinates: data.locationCoordinates
        ? { latitude: data.locationCoordinates.lat, longitude: data.locationCoordinates.lng }
        : undefined,
      locationName: data.locationName, locationAddress: data.locationAddress,
      date: resolvedDate, time: resolvedTime, durationId: "2", customHours: 2,
      budget, languages: [], interests: [], platformFee: taskPlatformFee, total: budget + taskPlatformFee,
      paymentMethod: null, razorpayOrderId: null, razorpayPaymentId: null,
      status: "payment_pending", interestedCount: 0, acceptedWysaId: null, confirmedWysaId: null,
      dispute: null, userRating: null, wysaRating: null,
    });

    if (!saved) {
      setSubmitting(false);
      toast.error("Couldn't save your task. Please try again.");
      return;
    }

    // Step 1b: Upload photos (if any), main photo first so it's photos[0]
    // and shows up as the task's primary image everywhere it's listed.
    if (photos.length > 0) {
      try {
        const ordered = [photos[mainPhotoIdx], ...photos.filter((_, i) => i !== mainPhotoIdx)];
        const formData = new FormData();
        ordered.forEach(p => formData.append("photos", p.file));
        const photoRes = await fetch(`/api/tasks/${taskId}/photos`, { method: "POST", body: formData });
        if (!photoRes.ok) {
          const photoErr = await photoRes.json().catch(() => null);
          console.error("Photo upload failed", photoErr);
          toast.error("Task saved, but photos couldn't be uploaded.", {
            description: photoErr?.error,
          });
        }
      } catch (err) {
        console.error("Photo upload failed", err);
        toast.error("Task saved, but photos couldn't be uploaded.");
      }
    }

    // Step 2: Create Razorpay order
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error ?? "Could not start payment");

      // Step 3: Open Razorpay checkout
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "WYSA",
        description: title,
        theme: { color: "#0d9488" },
        method: {
          upi: data.paymentMethod === "upi",
          card: data.paymentMethod === "card",
          wallet: data.paymentMethod === "wallet",
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // Step 4: Verify payment server-side
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: data.paymentMethod,
            }),
          });
          const verifyData = await verifyRes.json();
          setSubmitting(false);
          if (!verifyRes.ok) {
            toast.error("Payment could not be verified", { description: verifyData.error });
            return;
          }
          // Payment confirmed — redirect to task posted page
          toast.success("Payment confirmed! Your task is now live.");
          router.replace(`/task-posted/${taskId}`);
        },
        modal: { ondismiss: () => setSubmitting(false) },
      });
      razorpay.open();
    } catch (err) {
      setSubmitting(false);
      toast.error("Payment failed", { description: err instanceof Error ? err.message : "Please try again." });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <ProgressBar step={step} total={TOTAL_STEPS} />
      {step === 1 && <Step1Category    data={data} patch={patch} onNext={next} />}
      {step === 2 && <Step2Description data={data} patch={patch} onNext={next} onBack={back} />}
      {step === 3 && (
        <Step3Photos
          photos={photos} setPhotos={setPhotos}
          mainPhotoIdx={mainPhotoIdx} setMainPhotoIdx={setMainPhotoIdx}
          onNext={next} onBack={back}
        />
      )}
      {step === 4 && <Step4Location    data={data} patch={patch} onNext={next} onBack={back} locating={locating} useCurrentLocation={useCurrentLocation} />}
      {step === 5 && <Step5DateTime    data={data} patch={patch} onNext={next} onBack={back} />}
      {step === 6 && <Step6Budget      data={data} patch={patch} onNext={next} onBack={back} />}
      {step === 7 && <Step7Review      data={data} photoCount={photos.length} onBack={back} onNext={next} />}
      {step === 8 && <Step8Payment     data={data} patch={patch} onBack={back} onSubmit={handleSubmit} submitting={submitting} />}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Step {step} of {total}</span>
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i < step ? "bg-teal-500 w-6" : "bg-gray-200 w-3"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function Step1Category({ data, patch, onNext }: { data: WizardData; patch: (p: Partial<WizardData>) => void; onNext: () => void }) {
  function select(label: string) {
    patch({ categoryLabel: label, category: (LABEL_TO_CATEGORY[label] ?? "General assistance") as TaskCategory });
  }
  return (
    <StepCard title="What do you need help with?" subtitle="Choose the type of task you need done.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORY_CARDS.map(({ icon: Icon, label }) => (
          <button key={label} onClick={() => select(label)}
            className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all ${
              data.categoryLabel === label ? "border-teal-500 bg-teal-50" : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
            }`}>
            <Icon className={`h-6 w-6 ${data.categoryLabel === label ? "text-teal-600" : "text-gray-400"}`} strokeWidth={1.5} />
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
      {data.categoryLabel === "Other" && (
        <div className="mt-4">
          <input value={data.customCategoryText} onChange={e => patch({ customCategoryText: e.target.value })}
            placeholder="Describe what you need…"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none" />
        </div>
      )}
      <ContinueButton onClick={() => {
        if (!data.categoryLabel && !data.customCategoryText) { toast.error("Please choose what you need."); return; }
        onNext();
      }} disabled={!data.categoryLabel && !data.customCategoryText} />
    </StepCard>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
const EXAMPLES: Partial<Record<string, string>> = {
  "Cleaning": "Clean my 2-bedroom apartment before guests arrive",
  "Shopping": "Pick up groceries from the supermarket near me",
  "Elder Care": "Help my grandmother with her weekly hospital visit",
  "Tech Help": "Set up Wi-Fi on my new laptop",
  "Food": "Recommend and take me to a good restaurant tonight",
  "Study Help": "Study with me for my math exam tomorrow",
};

function Step2Description({ data, patch, onNext, onBack }: { data: WizardData; patch: (p: Partial<WizardData>) => void; onNext: () => void; onBack: () => void }) {
  const example = EXAMPLES[data.categoryLabel] ?? "Describe what you need — write it in your own words.";
  return (
    <StepCard title="Tell us what you need done" subtitle="Write naturally — no need to be formal." onBack={onBack}>
      <textarea rows={4} value={data.description} onChange={e => patch({ description: e.target.value })}
        placeholder={example}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none resize-none" />
      <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
        <FileText className="h-3.5 w-3.5 text-gray-300" strokeWidth={1.5} />
        Be specific so workers know exactly what you need.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[example, ...Object.values(EXAMPLES)].filter((e, i, a) => a.indexOf(e) === i && e !== data.description).slice(0, 3).map(ex => (
          <button key={ex} type="button" onClick={() => patch({ description: ex! })}
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 hover:border-teal-300 hover:text-teal-700 transition-colors">
            &quot;{ex}&quot;
          </button>
        ))}
      </div>
      <ContinueButton onClick={() => {
        if (!data.description.trim()) { toast.error("Please tell us what you need."); return; }
        onNext();
      }} disabled={!data.description.trim()} />
    </StepCard>
  );
}

// ── Step 3: Photos ───────────────────────────────────────────────────────────
function Step3Photos({ photos, setPhotos, mainPhotoIdx, setMainPhotoIdx, onNext, onBack }: {
  photos: PendingPhoto[]; setPhotos: React.Dispatch<React.SetStateAction<PendingPhoto[]>>;
  mainPhotoIdx: number; setMainPhotoIdx: (i: number) => void;
  onNext: () => void; onBack: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { toast.error(`You can add up to ${MAX_PHOTOS} photos.`); return; }
    const picked = Array.from(files).slice(0, room).filter(f => f.type.startsWith("image/"));
    const oversized = picked.some(f => f.size > 5 * 1024 * 1024);
    if (oversized) toast.error("Some photos are over 5MB and were skipped.");
    const valid = picked.filter(f => f.size <= 5 * 1024 * 1024);
    const added: PendingPhoto[] = valid.map(file => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos(prev => [...prev, ...added]);
  }

  function removePhoto(index: number) {
    setPhotos(prev => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    // Keep the main-photo selection valid after removal.
    if (index === mainPhotoIdx) setMainPhotoIdx(0);
    else if (index < mainPhotoIdx) setMainPhotoIdx(mainPhotoIdx - 1);
  }

  return (
    <StepCard title="Add photos" subtitle="Show workers what the task looks like. Optional, but it helps." onBack={onBack}>
      <input
        ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={photos.length >= MAX_PHOTOS}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-8 text-gray-500 hover:border-teal-300 hover:text-teal-600 disabled:opacity-50 transition-colors"
      >
        <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
        <span className="text-sm font-semibold">
          {photos.length === 0 ? "Add photos" : "Add more photos"}
        </span>
        <span className="text-xs text-gray-400">Up to {MAX_PHOTOS} photos, 5MB each</span>
      </button>

      {photos.length > 0 && (
        <>
          <p className="mt-5 mb-2 text-xs font-medium text-gray-500">
            Tap the star to set the main photo — it&apos;s the one workers see first.
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {photos.map((p, i) => (
              <div key={p.previewUrl} className="relative aspect-square overflow-hidden rounded-xl border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={`Task photo ${i + 1}`} className="h-full w-full object-cover" />

                <button
                  type="button"
                  onClick={() => setMainPhotoIdx(i)}
                  title={i === mainPhotoIdx ? "Main photo" : "Set as main photo"}
                  className={`absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full px-1.5 py-1 text-[10px] font-semibold transition-colors ${
                    i === mainPhotoIdx ? "bg-teal-600 text-white" : "bg-black/50 text-white hover:bg-black/70"
                  }`}
                >
                  <Star className={`h-3 w-3 ${i === mainPhotoIdx ? "fill-white" : ""}`} strokeWidth={1.5} />
                  {i === mainPhotoIdx && "Main"}
                </button>

                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  title="Remove photo"
                  className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <ContinueButton onClick={onNext} label={photos.length > 0 ? "Continue" : "Skip for now"} />
    </StepCard>
  );
}

// ── Step 4: Exact location ───────────────────────────────────────────────────
function Step4Location({ data, patch, onNext, onBack, locating, useCurrentLocation }: {
  data: WizardData; patch: (p: Partial<WizardData>) => void;
  onNext: () => void; onBack: () => void; locating: boolean; useCurrentLocation: () => void;
}) {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const defaultCenter = { lat: 12.9141, lng: 74.8560 }; // Mangalore

  const [searchText, setSearchText] = useState(data.area);
  // Draft pin state — only written into wizard data once the user taps
  // "Confirm Location", so an accidental drag/click doesn't silently commit.
  const [draftCoords, setDraftCoords] = useState<{ lat: number; lng: number } | null>(data.locationCoordinates);
  const [draftAddress, setDraftAddress] = useState(data.locationAddress);
  const [draftName, setDraftName] = useState(data.locationName || data.area);
  const [mapReady, setMapReady] = useState(false);
  // Set when Google reports the API key is invalid/unauthorized or billing
  // isn't enabled (window.gm_authFailure — the documented hook for this,
  // rather than guessing from a console error). Falls back to a manual
  // address field so the wizard stays usable without a working map.
  const [mapAuthFailed, setMapAuthFailed] = useState(false);

  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef  = useRef<any>(null);
  const markerRef       = useRef<any>(null);
  const geocoderRef     = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const searchInputRef  = useRef<HTMLInputElement>(null);

  function placeMarker(g: any, map: any, lat: number, lng: number) {
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    } else {
      markerRef.current = new g.Marker({ position: { lat, lng }, map, draggable: true });
      markerRef.current.addListener("dragend", (ev: any) => {
        const la = ev.latLng.lat(), lo = ev.latLng.lng();
        setDraftCoords({ lat: la, lng: lo });
        reverseGeocode(la, lo);
      });
    }
  }

  function reverseGeocode(lat: number, lng: number) {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: { lat, lng } }, (results: any, status: string) => {
      if (status === "OK" && results[0]) {
        const parts = results[0].address_components as any[];
        const sub  = parts.find((p: any) => p.types.includes("sublocality_level_1") || p.types.includes("neighborhood"))?.long_name;
        const city = parts.find((p: any) => p.types.includes("locality"))?.long_name;
        const name = [sub, city].filter(Boolean).join(", ") || results[0].formatted_address;
        setDraftName(name);
        setDraftAddress(results[0].formatted_address);
        setSearchText(name);
      }
    });
  }

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current || !(window as any).google) return;
    const g = (window as any).google.maps;
    // Guard against partially-loaded Maps (e.g. billing disabled) where the
    // script loads but g.Map is undefined/not a constructor. Rather than
    // crashing with "undefined is not a constructor", catch it here and fall
    // back to the manual-text UI — the same path gm_authFailure triggers,
    // but reached synchronously so it doesn't matter which fires first.
    if (typeof g?.Map !== "function") {
      setMapAuthFailed(true);
      return;
    }
    try {
      const center = draftCoords ?? defaultCenter;
      const map = new g.Map(mapRef.current, {
        center, zoom: draftCoords ? 16 : 12,
        disableDefaultUI: true, zoomControl: true,
        styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
      });
      mapInstanceRef.current = map;
      geocoderRef.current = new g.Geocoder();

      if (draftCoords) placeMarker(g, map, draftCoords.lat, draftCoords.lng);

      map.addListener("click", (e: any) => {
        const lat = e.latLng.lat(), lng = e.latLng.lng();
        setDraftCoords({ lat, lng });
        placeMarker(g, map, lat, lng);
        reverseGeocode(lat, lng);
      });

      if (searchInputRef.current && g.places) {
        autocompleteRef.current = new g.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: "in" },
          fields: ["geometry", "formatted_address", "name"],
        });
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          const loc = place?.geometry?.location;
          if (!loc) return;
          const lat = loc.lat(), lng = loc.lng();
          setDraftCoords({ lat, lng });
          setDraftName(place.name || place.formatted_address || searchInputRef.current!.value);
          setDraftAddress(place.formatted_address || "");
          setSearchText(place.name || place.formatted_address || "");
          map.setCenter({ lat, lng });
          map.setZoom(16);
          placeMarker(g, map, lat, lng);
        });
      }

      setMapReady(true);
    } catch {
      // Any other Maps init failure (auth error, quota, etc.) — show the
      // manual-text fallback rather than crashing the wizard entirely.
      setMapAuthFailed(true);
    }
  }

  useEffect(() => {
    if ((window as any).google) initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (window as any).gm_authFailure = () => setMapAuthFailed(true);
    return () => { delete (window as any).gm_authFailure; };
  }, []);

  // When the GPS-detected address lands in data.area (from useCurrentLocation
  // in the parent), pick it up as the search text and re-geocode it for a pin.
  useEffect(() => {
    if (!mapReady || !geocoderRef.current || !data.area || data.area === searchText) return;
    setSearchText(data.area);
    geocoderRef.current.geocode({ address: `${data.area}, Mangalore, India` }, (results: any, status: string) => {
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        const lat = loc.lat(), lng = loc.lng();
        setDraftCoords({ lat, lng });
        setDraftName(data.area);
        setDraftAddress(results[0].formatted_address);
        mapInstanceRef.current?.setCenter({ lat, lng });
        mapInstanceRef.current?.setZoom(16);
        placeMarker((window as any).google.maps, mapInstanceRef.current, lat, lng);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.area, mapReady]);

  function handleConfirmLocation() {
    // Manual fallback path (map unavailable) — just needs typed text.
    if (mapAuthFailed || !mapsKey) {
      if (!searchText.trim()) { toast.error("Please enter where you need help."); return; }
      patch({
        area: searchText.trim(),
        locationCoordinates: null,
        locationName: searchText.trim(),
        locationAddress: "",
      });
      toast.success("Location saved");
      onNext();
      return;
    }
    if (!draftCoords) { toast.error("Drop a pin or search for a location first."); return; }
    patch({
      area: draftName || data.area,
      locationCoordinates: draftCoords,
      locationName: draftName,
      locationAddress: draftAddress,
    });
    toast.success("Location confirmed");
    onNext();
  }

  return (
    <StepCard title="Where do you need help?" subtitle="Search, drop a pin, or use GPS — then confirm the exact spot." onBack={onBack}>
      {/* GPS button */}
      <button onClick={useCurrentLocation} disabled={locating}
        className="flex w-full items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors mb-3">
        <Navigation className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        {locating ? "Detecting your location…" : "Use my current location"}
      </button>

      {/* Search input (Google Places Autocomplete attaches here) */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={1.5} />
        <input
          ref={searchInputRef}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search for a location"
          className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-3.5 text-sm focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* Google Map with draggable pin */}
      {mapsKey && !mapAuthFailed ? (
        <>
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places&loading=async`}
            strategy="lazyOnload"
            onLoad={initMap}
          />
          <div ref={mapRef} className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 mb-2" />
          <p className="mb-3 text-xs text-gray-400">Tap the map or drag the pin to set the exact spot.</p>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 h-40 flex flex-col items-center justify-center gap-1 px-4 text-center mb-3">
          <p className="text-xs text-gray-500">
            {mapAuthFailed
              ? "Map unavailable right now — you can still type the location above."
              : "Map unavailable — add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable"}
          </p>
        </div>
      )}

      {draftCoords && draftAddress && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3.5 py-2.5 text-xs text-teal-700">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
          <span>{draftAddress}</span>
        </div>
      )}

      {/* Meeting point */}
      <input value={data.locationNote} onChange={e => patch({ locationNote: e.target.value })}
        placeholder="Meeting point (optional) — e.g. near the main gate"
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none" />

      <button
        onClick={handleConfirmLocation}
        disabled={mapAuthFailed || !mapsKey ? !searchText.trim() : !draftCoords}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
      >
        <Check className="h-4 w-4" />
        Confirm Location
      </button>
    </StepCard>
  );
}

// ── Step 5 ────────────────────────────────────────────────────────────────────
function Step5DateTime({ data, patch, onNext, onBack }: { data: WizardData; patch: (p: Partial<WizardData>) => void; onNext: () => void; onBack: () => void }) {
  return (
    <StepCard title="When do you need help?" subtitle="Choose a day and time that works for you." onBack={onBack}>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {DATE_OPTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => patch({ dateOption: id })}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 transition-all ${
              data.dateOption === id ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}>
            <Icon className={`h-5 w-5 ${data.dateOption === id ? "text-teal-600" : "text-gray-400"}`} strokeWidth={1.5} />
            <span className="text-xs font-semibold text-gray-700">{label}</span>
          </button>
        ))}
      </div>
      {data.dateOption === "pick" && (
        <input type="date" value={data.customDate} min={todayStr()} onChange={e => patch({ customDate: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm mb-4 focus:border-teal-500 focus:outline-none" />
      )}
      {data.dateOption && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">What time?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-3">
            {TIME_OPTIONS.map(({ id, label, icon: Icon, time }) => (
              <button key={id} onClick={() => patch({ timeOption: id })}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 transition-all ${
                  data.timeOption === id ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}>
                <Icon className={`h-5 w-5 ${data.timeOption === id ? "text-teal-600" : "text-gray-400"}`} strokeWidth={1.5} />
                <span className="text-xs font-semibold text-gray-700">{label}</span>
                <span className="text-[10px] text-gray-400">{time}</span>
              </button>
            ))}
          </div>
          <button onClick={() => patch({ timeOption: "pick" })}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              data.timeOption === "pick" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}>
            <Clock className="h-3 w-3" strokeWidth={1.5} /> Pick exact time
          </button>
          {data.timeOption === "pick" && (
            <input type="time" value={data.customTime} onChange={e => patch({ customTime: e.target.value })}
              className="mt-2 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-teal-500 focus:outline-none" />
          )}
        </>
      )}
      <ContinueButton onClick={() => {
        if (!data.dateOption) { toast.error("Please choose a day."); return; }
        if (!data.timeOption) { toast.error("Please choose a time."); return; }
        onNext();
      }} disabled={!data.dateOption || !data.timeOption} />
    </StepCard>
  );
}

// ── Step 6 ────────────────────────────────────────────────────────────────────
function Step6Budget({ data, patch, onNext, onBack }: { data: WizardData; patch: (p: Partial<WizardData>) => void; onNext: () => void; onBack: () => void }) {
  const isCustom = typeof data.budget === "number" && !BUDGET_PRESETS.includes(data.budget as any) && data.budget !== BUDGET_UNSURE;
  const isUnsure = data.budget === BUDGET_UNSURE;
  return (
    <StepCard title="How much will you pay?" subtitle="Workers will see your budget and decide if they can help." onBack={onBack}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 mb-3">
        {BUDGET_PRESETS.map(p => (
          <button key={p} onClick={() => patch({ budget: p })}
            className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
              data.budget === p ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}>
            ₹{p}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => patch({ budget: "" })}
          className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
            isCustom || data.budget === "" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          }`}>Custom</button>
        <button onClick={() => patch({ budget: BUDGET_UNSURE })}
          className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
            isUnsure ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          }`}>Not sure</button>
      </div>
      {(isCustom || data.budget === "") && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-500">₹</span>
          <input type="number" min={100} step={50} value={data.budget === "" ? "" : data.budget}
            onChange={e => patch({ budget: e.target.value === "" ? "" : Number(e.target.value) })}
            placeholder="Enter amount"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm w-40 focus:border-teal-500 focus:outline-none" />
        </div>
      )}
      {isUnsure && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
          <IndianRupee className="h-3.5 w-3.5 shrink-0 text-teal-500" strokeWidth={1.5} />
          Suggested: <strong className="ml-1">₹500–₹800</strong> for similar tasks. We&apos;ll use ₹500 as a starting point.
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">+ ₹{taskPlatformFee} platform fee added at checkout.</p>
      <ContinueButton onClick={() => {
        if (data.budget === "" && !isUnsure) { toast.error("Please enter a budget."); return; }
        onNext();
      }} disabled={data.budget === "" && !isUnsure} />
    </StepCard>
  );
}

// ── Step 7 ────────────────────────────────────────────────────────────────────
function Step7Review({ data, photoCount, onBack, onNext }: {
  data: WizardData; photoCount: number; onBack: () => void; onNext: () => void;
}) {
  const CatIcon    = CATEGORY_CARDS.find(c => c.label === data.categoryLabel)?.icon ?? FileText;
  const dateText   = data.dateOption === "today" ? "Today" : data.dateOption === "tomorrow" ? "Tomorrow" : data.customDate || "—";
  const timeText   = data.timeOption === "pick" ? data.customTime : TIME_OPTIONS.find(t => t.id === data.timeOption)?.label ?? "—";
  const budgetText = data.budget === BUDGET_UNSURE ? "500 (suggested)" : `${data.budget}`;
  const total      = (data.budget === BUDGET_UNSURE ? 500 : Number(data.budget || 0)) + taskPlatformFee;
  return (
    <StepCard title="Review your task" subtitle="Make sure everything looks right before paying." onBack={onBack}>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3 mb-6">
        <div className="flex items-start gap-3 pb-3 border-b border-gray-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 shrink-0">
            <CatIcon className="h-5 w-5 text-teal-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{data.categoryLabel || data.category}</p>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{data.description}</p>
          </div>
        </div>
        <SummaryRow icon={MapPin}       label="Where"  text={data.locationAddress || data.area} />
        <SummaryRow icon={CalendarDays} label="Date"   text={dateText} />
        <SummaryRow icon={Clock}        label="Time"   text={timeText} />
        <SummaryRow icon={IndianRupee}  label="Budget" text={budgetText} prefix="₹" />
        {photoCount > 0 && <SummaryRow icon={Camera} label="Photos" text={`${photoCount} added`} />}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Total (incl. ₹{taskPlatformFee} fee)</span>
          <span className="text-base font-bold text-teal-600">₹{total}</span>
        </div>
      </div>
      <ContinueButton onClick={onNext} label="Looks good — choose payment" />
    </StepCard>
  );
}

// ── Step 8 ────────────────────────────────────────────────────────────────────
const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "upi",    label: "UPI",         icon: Smartphone, desc: "Pay with any UPI app" },
  { id: "card",   label: "Card",        icon: CreditCard, desc: "Debit or credit card" },
  { id: "wallet", label: "Wallet",      icon: Wallet,     desc: "WYSA wallet balance" },
];

function Step8Payment({ data, patch, onBack, onSubmit, submitting }: {
  data: WizardData; patch: (p: Partial<WizardData>) => void;
  onBack: () => void; onSubmit: () => void; submitting: boolean;
}) {
  const total = (data.budget === BUDGET_UNSURE ? 500 : Number(data.budget || 0)) + taskPlatformFee;
  return (
    <StepCard title="How do you want to pay?" subtitle="Payment is held securely until your task is complete." onBack={onBack}>

      {/* Payment method selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
          <button key={id} onClick={() => patch({ paymentMethod: id })}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              data.paymentMethod === id ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}>
            <Icon className={`h-6 w-6 ${data.paymentMethod === id ? "text-teal-600" : "text-gray-400"}`} strokeWidth={1.5} />
            <span className="text-xs font-bold text-gray-700">{label}</span>
            <span className="text-[10px] text-gray-400 text-center leading-tight">{desc}</span>
          </button>
        ))}
      </div>

      {/* Order summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Task budget</span>
          <span>₹{data.budget === BUDGET_UNSURE ? 500 : data.budget}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Platform fee</span>
          <span>₹{taskPlatformFee}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
          <span>Total</span>
          <span className="text-teal-600">₹{total}</span>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 mb-5 text-xs text-gray-500">
        <ShieldCheck className="h-4 w-4 shrink-0 text-teal-500" strokeWidth={1.5} />
        Payment held securely. Released only when you confirm the task is done.
      </div>

      {/* Pay button */}
      <button onClick={onSubmit} disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-4 text-base font-bold text-white hover:bg-teal-700 disabled:opacity-60 transition-colors">
        {submitting
          ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
          : <><IndianRupee className="h-5 w-5" /> Pay ₹{total} &amp; Post Task</>}
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">
        Your task goes live the moment payment is confirmed.
      </p>
    </StepCard>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function StepCard({ title, subtitle, children, onBack }: {
  title: string; subtitle?: string; children: React.ReactNode; onBack?: () => void;
}) {
  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ContinueButton({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40 transition-colors">
      {label ?? "Continue"} <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function SummaryRow({ icon: Icon, label, text, prefix }: {
  icon: React.ElementType; label?: string; text?: string | null; prefix?: string;
}) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.5} />
      <div className="flex flex-1 items-center justify-between min-w-0">
        {label && <span className="text-gray-500 shrink-0 mr-2">{label}</span>}
        <span className="font-medium text-gray-800 text-right truncate">{prefix}{text}</span>
      </div>
    </div>
  );
}
