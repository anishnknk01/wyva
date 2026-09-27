"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Hourglass,
  Languages,
  Heart,
  X,
  ClipboardCheck,
  Wallet,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Broom, ShoppingCart, Truck, HeartHandshake, Baby,
  BookOpen, Monitor, PartyPopper, Utensils, Camera,
  Dumbbell, Compass, Hospital, HelpCircle, Images,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AcceptTaskDialog } from "@/components/tasks/accept-task-dialog";
import { RateDialog } from "@/components/my-tasks/rate-dialog";
import { TaskMap } from "@/components/ui/task-map";
import { TaskPhotoGalleryModal } from "@/components/ui/task-photo-gallery-modal";
import { EligibilityGuard } from "@/components/worker/onboarding/eligibility-guard";
import { openInMaps } from "@/lib/location-utils";
import {
  formatCurrency,
  formatDateLong,
  formatTime12h,
  taskDurationLabel,
  resolveTaskDurationHours,
  getEffectiveStatus,
  taskStatusLabels,
  type TaskStatus,
} from "@/lib/tasks";
import { updateTask, acceptTask, applyForTask, getMyApplication, submitRating, type Task, type TaskApplication } from "@/lib/task-store";
import { useUser } from "@/lib/use-user";

// Same category → icon mapping used when the customer posts a task, so the
// icon a worker sees here always matches what was picked in the wizard.
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Shopping": ShoppingCart,
  "Errands": Truck,
  "Elder assistance": HeartHandshake,
  "Companion": Baby,
  "Study": BookOpen,
  "Tech help": Monitor,
  "General assistance": Broom,
  "Events": PartyPopper,
  "Food": Utensils,
  "Photography": Camera,
  "Sports": Dumbbell,
  "Local exploration": Compass,
  "Hospital/appointment accompaniment": Hospital,
};

/** Renders the icon for a task category — kept as its own component (rather
 * than resolving to a variable in render) so the icon type is stable across
 * renders. */
function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? HelpCircle;
  return <Icon className={className} />;
}

/** Human-friendly "posted X ago" from an ISO timestamp. */
function postedAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Posted just now";
  if (mins < 60) return `Posted ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return "Posted today";
  const days = Math.floor(hours / 24);
  return days === 1 ? "Posted yesterday" : `Posted ${days}d ago`;
}

// Small, human status pill — subtle background instead of a loud badge.
const STATUS_PILL: Record<TaskStatus, { label: string; icon: React.ElementType; className: string }> = {
  draft:             { label: "Draft",                 icon: Clock,        className: "bg-gray-100 text-gray-600" },
  payment_pending:   { label: "Payment pending",       icon: Clock,        className: "bg-sun/15 text-sun-foreground" },
  waiting_for_wysa:  { label: "Waiting for a worker",  icon: Hourglass,    className: "bg-sun/15 text-sun-foreground" },
  wysa_accepted:     { label: "Worker assigned",       icon: CheckCircle2, className: "bg-teal/10 text-teal" },
  confirmed:         { label: "Confirmed",             icon: CheckCircle2, className: "bg-teal/10 text-teal" },
  in_progress:       { label: "In progress",           icon: Loader2,      className: "bg-purple-100 text-purple-700" },
  completed:         { label: "Completed",             icon: CheckCircle2, className: "bg-teal/10 text-teal" },
  payment_released:  { label: "Payment released",      icon: CheckCircle2, className: "bg-teal/10 text-teal" },
  cancelled:         { label: "Cancelled",              icon: X,            className: "bg-destructive/10 text-destructive" },
  under_review:      { label: "Under review",           icon: Clock,        className: "bg-destructive/10 text-destructive" },
};

function StatusPill({ status }: { status: TaskStatus }) {
  const { label, icon: Icon, className } = STATUS_PILL[status] ?? STATUS_PILL.waiting_for_wysa;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

/** Small info card used for location / date / time / duration. */
function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function TaskDetailPage({ task: initialTask }: { task: Task }) {
  const { user } = useUser();
  const [task, setTask] = useState(initialTask);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [myApplication, setMyApplication] = useState<TaskApplication | null | undefined>(undefined); // undefined = loading
  const [applying, setApplying] = useState(false);

  const isMine = !!user && task.acceptedWysaId === user.id;
  const status = getEffectiveStatus(task.status, task.date, task.time);

  // Load the current worker's application for this task (if any) so the
  // button can reflect their real state: Applied / Pending / Not selected.
  useEffect(() => {
    if (!user || task.status !== "waiting_for_wysa") { setMyApplication(null); return; }
    let active = true;
    getMyApplication(task.id).then(app => { if (active) setMyApplication(app); });
    return () => { active = false; };
  }, [user, task.id, task.status]);

  async function handleApply() {
    if (!user) {
      toast.error("Please log in to apply for a task.");
      return;
    }
    setApplying(true);
    const app = await applyForTask(task.id);
    setApplying(false);
    if (app) {
      setMyApplication(app);
      toast.success("Application sent — the customer has been notified.");
    } else {
      toast.error("Couldn't apply. Please try again.");
    }
  }

  async function handleAccept() {
    if (!user) {
      toast.error("Please log in to accept a task.");
      return;
    }
    // acceptTask calls updateTaskStatusWithMessage which sets accepted_wysa_id,
    // sends a system message, and fires a push notification to the customer.

    const updated = await acceptTask(task.id);
    if (updated) setTask(updated);
    setAcceptOpen(false);
    toast.success("Task accepted — the customer has been notified.");
  }

  async function handleMarkComplete() {
    const updated = await updateTask(task.id, { status: "completed" });
    if (updated) setTask(updated);
    toast.success("Marked as complete", {
      description: "Waiting for the customer to confirm the task is done.",
    });
  }

  async function handleRate(stars: number, review: string) {
    if (!user) return;
    const ok = await submitRating(task.id, user.id, task.customerId, stars, review);
    if (ok) {
      setTask({
        ...task,
        wysaRating: { stars, review, submittedAt: new Date().toISOString() },
      });
      toast.success("Rating submitted");
    } else {
      toast.error("Couldn't submit rating");
    }
    setRateOpen(false);
  }

  if (dismissed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <X className="size-6" />
        </span>
        <h1 className="mt-4 font-heading text-xl font-semibold">
          No worries, this task isn&apos;t for you.
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You can keep browsing for other tasks that fit better.
        </p>
        <Button className="mt-6 rounded-full" render={<Link href="/tasks" />}>
          Find more tasks
        </Button>
      </div>
    );
  }

  // Only compute an hourly rate when duration is actually known — never
  // guess at a rate when the duration is uncertain (e.g. missing custom hours).
  const durationKnown = task.durationId !== "custom" || task.customHours > 0;
  const durationHours = durationKnown ? resolveTaskDurationHours(task.durationId, task.customHours) : null;
  const hourlyRate = durationHours ? Math.round(task.budget / durationHours) : null;

  // Only build "what you'll do" steps from data that actually exists on the
  // task — never invented. Category-specific verbs, then the shared pickup
  // → deliver steps that apply to most task types.
  const whatYoullDo: { icon: React.ElementType; text: string }[] = [];
  if (task.category === "Shopping") {
    whatYoullDo.push({ icon: ShoppingCart, text: "Pick up items from the location" });
  } else if (task.category === "Errands") {
    whatYoullDo.push({ icon: Truck, text: "Complete the errand as described" });
  }
  if (task.area) {
    whatYoullDo.push({ icon: MapPin, text: `Meet at ${task.area}, Mangalore` });
  }
  whatYoullDo.push({ icon: CheckCircle2, text: "Mark the task complete when done" });

  const mapsQuery = encodeURIComponent(`${task.area}, Mangalore`);

  // Primary CTA — one obvious action per state, never competing buttons.
  function renderPrimaryAction() {
    if (!task.acceptedWysaId) {
      // Gated the same way as the task list card: the server checks the
      // worker's profile (required fields — no arbitrary percentage cutoff)
      // before allowing the accept dialog to open. Applying straight from
      // this detail page used to skip that check entirely.
      return (
        <EligibilityGuard
          onEligible={() => {
            if (!user) {
              toast.error("Please log in to accept a task.");
              return;
            }
            setAcceptOpen(true);
          }}
        >
          {({ onClick, loading: checking }) => (
            <Button
              size="lg"
              className="w-full rounded-full bg-purple-600 hover:bg-purple-700"
              disabled={checking}
              onClick={onClick}
            >
              {checking ? "Checking…" : "Apply for this task"}
              {!checking && <ArrowLeft className="size-4 rotate-180" />}
            </Button>
          )}
        </EligibilityGuard>
      );
    }
    if (!isMine) {
      return (
        <Button size="lg" className="w-full rounded-full" disabled variant="outline">
          Already taken by another worker
        </Button>
      );
    }
    if (status === "wysa_accepted" || status === "confirmed") {
      return (
        <Button size="lg" className="w-full rounded-full" variant="outline" disabled>
          {status === "confirmed" ? "Confirmed — view job" : "Application sent"}
        </Button>
      );
    }
    if (status === "in_progress") {
      return (
        <Button size="lg" className="w-full rounded-full bg-purple-600 hover:bg-purple-700" onClick={handleMarkComplete}>
          <ClipboardCheck className="size-4" />
          Mark task complete
        </Button>
      );
    }
    if (status === "completed") {
      return (
        <Button size="lg" className="w-full rounded-full" variant="outline" disabled>
          Waiting for customer confirmation
        </Button>
      );
    }
    if (status === "payment_released" && !task.wysaRating) {
      return (
        <Button size="lg" className="w-full rounded-full" variant="outline" onClick={() => setRateOpen(true)}>
          Rate customer
        </Button>
      );
    }
    return null;
  }

  const showStickyBar = !task.acceptedWysaId || (isMine && status === "in_progress");

  return (
    <div className={`mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10 ${showStickyBar ? "pb-28 sm:pb-10" : ""}`}>
      <Link
        href="/worker/find-tasks"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Find Tasks
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* ---- Main photo — sits outside the overflow-hidden card so the
            gallery portal renders correctly on all browsers/scroll contexts ---- */}
        {task.photos && task.photos.length > 0 && (
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="relative block w-full overflow-hidden"
            aria-label={`View ${task.photos.length} photo${task.photos.length > 1 ? "s" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={task.photos[0]}
              alt={task.title}
              className="w-full object-cover"
              style={{ maxHeight: "280px" }}
            />
            {task.photos.length > 1 && (
              <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                <Images className="size-3.5" />
                {task.photos.length} Photos — tap to view all
              </span>
            )}
          </button>
        )}

        {/* ---- Header: category, id, title, status ---- */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
              <CategoryIcon category={task.category} className="size-3.5" />
              {task.category || "General"}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">#{task.id}</span>
          </div>

          <h1 className="mt-3 font-heading text-xl font-bold leading-snug text-foreground sm:text-2xl">
            {task.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            <span className="text-xs text-muted-foreground">
              {postedAgo(task.createdAt)}
            </span>
          </div>
        </div>

        {/* ---- Quick facts: location / date / time / duration ---- */}
        <div className="grid grid-cols-2 gap-2.5 border-t border-border p-5 sm:p-6">
          <InfoTile icon={MapPin} label="Location" value={`${task.area}, Mangalore`} />
          <InfoTile icon={Calendar} label="Date" value={formatDateLong(task.date)} />
          <InfoTile icon={Clock} label="Time" value={formatTime12h(task.time)} />
          <InfoTile icon={Hourglass} label="Duration" value={taskDurationLabel(task.durationId, task.customHours)} />
        </div>

        {/* ---- What you'll do ---- */}
        <div className="border-t border-border p-5 sm:p-6">
          <p className="text-sm font-semibold text-foreground">What you&apos;ll do</p>
          <ul className="mt-2.5 flex flex-col gap-2">
            {whatYoullDo.map((step, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <step.icon className="size-3.5 shrink-0 text-purple-600" />
                {step.text}
              </li>
            ))}
          </ul>
        </div>

        {/* ---- About this task ---- */}
        {task.description && (
          <div className="border-t border-border p-5 sm:p-6">
            <p className="text-sm font-semibold text-foreground">About this task</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          </div>
        )}

        {/* ---- Location: address, exact-pin map preview, Open in Maps ---- */}
        <div className="border-t border-border p-5 sm:p-6">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MapPin className="size-3.5 text-teal" />
            Pickup location
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {task.locationAddress || `${task.area}, Mangalore`}
            {task.locationNote ? ` · ${task.locationNote}` : ""}
          </p>

          {task.locationCoordinates ? (
            <>
              <TaskMap
                taskCoords={task.locationCoordinates}
                address={task.locationAddress || task.locationName || `${task.area}, Mangalore`}
                className="mt-3"
              />
              <button
                type="button"
                onClick={() => openInMaps({
                  latitude: task.locationCoordinates!.latitude,
                  longitude: task.locationCoordinates!.longitude,
                })}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
              >
                Open in Maps
                <ExternalLink className="size-3" />
              </button>
            </>
          ) : (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
            >
              View on map
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        {(task.languages.length > 0 || task.interests.length > 0) && (
          <div className="flex flex-col gap-3 border-t border-border p-5 text-sm sm:p-6">
            {task.languages.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Languages className="size-3.5" />
                  Preferred languages
                </p>
                <p className="mt-1 text-sm">{task.languages.join(" • ")}</p>
              </div>
            )}
            {task.interests.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Heart className="size-3.5" />
                  Interests
                </p>
                <p className="mt-1 text-sm">{task.interests.join(" • ")}</p>
              </div>
            )}
          </div>
        )}

        {/* ---- Payment — the number that matters most, given its own weight ---- */}
        <div className="border-t border-border bg-purple-50/60 p-5 sm:p-6">
          <p className="text-sm font-semibold text-purple-900">Payment</p>
          <p className="mt-1 font-heading text-3xl font-bold text-purple-700">
            {formatCurrency(task.budget)}
          </p>
          {hourlyRate ? (
            <p className="mt-1 text-xs text-purple-700/80">
              ≈ {formatCurrency(hourlyRate)} / hour for {taskDurationLabel(task.durationId, task.customHours)}
            </p>
          ) : null}
        </div>

        {/* ---- What happens next ---- */}
        <div className="border-t border-border p-5 sm:p-6">
          {!task.acceptedWysaId ? (
            <div className="flex items-start gap-2.5 text-sm">
              <Hourglass className="mt-0.5 size-4 shrink-0 text-sun-foreground" />
              <div>
                <p className="font-medium text-foreground">Waiting for a worker</p>
                <p className="text-muted-foreground">
                  Workers near this location can review this task. Apply now to be considered.
                </p>
              </div>
            </div>
          ) : !isMine ? (
            <div className="flex items-start gap-2.5 text-sm">
              <X className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-muted-foreground">This task has already been accepted by another worker.</p>
            </div>
          ) : status === "wysa_accepted" ? (
            <div className="flex items-start gap-2.5 text-sm">
              <Hourglass className="mt-0.5 size-4 shrink-0 text-teal" />
              <p className="text-muted-foreground">
                You&apos;ve applied. Waiting for the customer to confirm you.
              </p>
            </div>
          ) : status === "confirmed" ? (
            <div className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal" />
              <p className="text-muted-foreground">
                Confirmed. The task starts at {formatTime12h(task.time)} on {formatDateLong(task.date)}.
              </p>
            </div>
          ) : status === "in_progress" ? (
            <div className="flex items-start gap-2.5 text-sm">
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-purple-600" />
              <p className="text-muted-foreground">Task is in progress. Mark it complete when you&apos;re done.</p>
            </div>
          ) : status === "completed" ? (
            <div className="flex items-start gap-2.5 text-sm">
              <Hourglass className="mt-0.5 size-4 shrink-0 text-sun-foreground" />
              <p className="text-muted-foreground">Waiting for the customer to confirm the task is done.</p>
            </div>
          ) : status === "payment_released" ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Wallet className="size-4 shrink-0 text-teal" />
                <p className="font-medium text-foreground">Payment released</p>
              </div>
              <span className="font-heading font-bold text-teal">{formatCurrency(task.budget)}</span>
            </div>
          ) : status === "under_review" ? (
            <div className="flex items-start gap-2.5 text-sm">
              <X className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-muted-foreground">The customer reported an issue. This task is under review.</p>
            </div>
          ) : status === "cancelled" ? (
            <div className="flex items-start gap-2.5 text-sm">
              <X className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-muted-foreground">This task was cancelled.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{taskStatusLabels[status]}</p>
          )}
        </div>

        {/* ---- Not-for-me option — secondary, only while still open ---- */}
        {!task.acceptedWysaId && (
          <div className="border-t border-border p-5 sm:p-6">
            <button
              onClick={() => setDismissed(true)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Not for me — hide this task
            </button>
          </div>
        )}
      </div>

      {/* ---- Primary action ---- */}
      {showStickyBar ? (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="mx-auto flex max-w-2xl items-center gap-4 sm:block">
            <div className="flex-1 sm:hidden">
              <p className="text-xs text-muted-foreground">Payment</p>
              <p className="font-heading text-lg font-bold text-purple-700">{formatCurrency(task.budget)}</p>
            </div>
            <div className="flex-1 sm:w-full">{renderPrimaryAction()}</div>
          </div>
        </div>
      ) : (
        <div className="mt-6">{renderPrimaryAction()}</div>
      )}

      <AcceptTaskDialog
        open={acceptOpen}
        onOpenChange={setAcceptOpen}
        onConfirmAccept={handleAccept}
      />
      <RateDialog
        open={rateOpen}
        onOpenChange={setRateOpen}
        subjectName="the customer"
        onSubmit={handleRate}
      />

      {galleryOpen && task.photos && task.photos.length > 0 && (
        <TaskPhotoGalleryModal photos={task.photos} onClose={() => setGalleryOpen(false)} />
      )}
    </div>
  );
}
