"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";
import {
  ArrowLeft, ArrowRight, MapPin, Navigation,
  Broom, ShoppingCart, Truck, HeartHandshake, Baby, Home,
  BookOpen, Monitor, Leaf, PartyPopper, Utensils, Camera,
  Dumbbell, Compass, Hospital, HelpCircle,
  CalendarDays, CalendarClock, CalendarCheck,
  Sunrise, Sun, Sunset, Moon,
  IndianRupee, FileText, Clock,
  Smartphone, CreditCard, Wallet, Loader2, ShieldCheck,
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

const TOTAL_STEPS = 7;

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
  dateOption: string; customDate: string; timeOption: string; customTime: string;
  budget: number | ""; paymentMethod: PaymentMethod;
};

const INITIAL: WizardData = {
  categoryLabel: "", category: "", customCategoryText: "",
  description: "", area: "", locationNote: "",
  dateOption: "", customDate: "", timeOption: "", customTime: "",
  budget: 500, paymentMethod: "upi",
};

// ── Main ──────────────────────────────────────────────────────────────────────
export function TaskWizard() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user }     = useUser();

  const [step,        setStep]        = useState(1);
  const [data,        setData]        = useState<WizardData>(INITIAL);
  const [submitting,  setSubmitting]  = useState(false);
  const [locating,    setLocating]    = useState(false);

  useEffect(() => {
    const cat  = searchParams.get("category");
    const area = searchParams.get("area");
    if (cat) {
      const card = CATEGORY_CARDS.find(c => c.value === cat || c.label.toLowerCase() === cat.toLowerCase());
      setData(d => ({ ...d, categoryLabel: card?.label ?? cat, category: (LABEL_TO_CATEGORY[card?.label ?? ""] ?? cat) as TaskCategory }));
      setStep(2);
    }
    if (area) setData(d => ({ ...d, area }));
  }, [searchParams]);

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
      toast.success("Location detected — you can edit it below.");
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
      {step === 3 && <Step3Location    data={data} patch={patch} onNext={next} onBack={back} locating={locating} useCurrentLocation={useCurrentLocation} />}
      {step === 4 && <Step4DateTime    data={data} patch={patch} onNext={next} onBack={back} />}
      {step === 5 && <Step5Budget      data={data} patch={patch} onNext={next} onBack={back} />}
      {step === 6 && <Step6Review      data={data} onBack={back} onNext={next} />}
      {step === 7 && <Step7Payment     data={data} patch={patch} onBack={back} onSubmit={handleSubmit} submitting={submitting} />}
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

// ── Step 3 ────────────────────────────────────────────────────────────────────
function Step3Location({ data, patch, onNext, onBack, locating, useCurrentLocation }: {
  data: WizardData; patch: (p: Partial<WizardData>) => void;
  onNext: () => void; onBack: () => void; locating: boolean; useCurrentLocation: () => void;
}) {
  return (
    <StepCard title="Where do you need help?" subtitle="Type your location or detect it automatically." onBack={onBack}>
      <button onClick={useCurrentLocation} disabled={locating}
        className="flex w-full items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors mb-4">
        <Navigation className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        {locating ? "Detecting your location…" : "Use my current location"}
      </button>
      <div className="relative mb-3">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={1.5} />
        <input value={data.area} onChange={e => patch({ area: e.target.value })}
          placeholder="e.g. Hampankatta, Mangalore"
          className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-3.5 text-sm focus:border-teal-500 focus:outline-none" />
      </div>
      <input value={data.locationNote} onChange={e => patch({ locationNote: e.target.value })}
        placeholder="Meeting point (optional) — e.g. near the main gate"
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none" />
      <ContinueButton onClick={() => {
        if (!data.area.trim()) { toast.error("Please enter where you need help."); return; }
        onNext();
      }} disabled={!data.area.trim()} />
    </StepCard>
  );
}

// ── Step 4 ────────────────────────────────────────────────────────────────────
function Step4DateTime({ data, patch, onNext, onBack }: { data: WizardData; patch: (p: Partial<WizardData>) => void; onNext: () => void; onBack: () => void }) {
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

// ── Step 5 ────────────────────────────────────────────────────────────────────
function Step5Budget({ data, patch, onNext, onBack }: { data: WizardData; patch: (p: Partial<WizardData>) => void; onNext: () => void; onBack: () => void }) {
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

// ── Step 6 ────────────────────────────────────────────────────────────────────
function Step6Review({ data, onBack, onNext }: {
  data: WizardData; onBack: () => void; onNext: () => void;
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
        <SummaryRow icon={MapPin}       label="Where"  text={data.area} />
        <SummaryRow icon={CalendarDays} label="Date"   text={dateText} />
        <SummaryRow icon={Clock}        label="Time"   text={timeText} />
        <SummaryRow icon={IndianRupee}  label="Budget" text={budgetText} prefix="₹" />
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Total (incl. ₹{taskPlatformFee} fee)</span>
          <span className="text-base font-bold text-teal-600">₹{total}</span>
        </div>
      </div>
      <ContinueButton onClick={onNext} label="Looks good — choose payment" />
    </StepCard>
  );
}

// ── Step 7 ────────────────────────────────────────────────────────────────────
const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "upi",    label: "UPI",         icon: Smartphone, desc: "Pay with any UPI app" },
  { id: "card",   label: "Card",        icon: CreditCard, desc: "Debit or credit card" },
  { id: "wallet", label: "Wallet",      icon: Wallet,     desc: "WYSA wallet balance" },
];

function Step7Payment({ data, patch, onBack, onSubmit, submitting }: {
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
