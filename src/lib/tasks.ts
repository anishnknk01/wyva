import { mangaloreAreas } from "@/lib/content";

// Categories a customer can pick when posting a task. No romantic/sexual
// categories per product requirements.
export const taskCategories = [
  "Companion",
  "Hangout",
  "Walk",
  "Movies",
  "Food",
  "Events",
  "Shopping",
  "Local exploration",
  "Travel",
  "Elder assistance",
  "Hospital/appointment accompaniment",
  "Errands",
  "Study",
  "Gaming",
  "Sports",
  "Photography",
  "Tech help",
  "General assistance",
] as const;

export type TaskCategory = (typeof taskCategories)[number];

export const taskAreas = [...mangaloreAreas, "Other"] as const;

export const taskLanguageOptions = [
  "Kannada",
  "English",
  "Hindi",
  "Tulu",
  "Malayalam",
  "Tamil",
] as const;

export const taskInterestOptions = [
  "Movies",
  "Food",
  "Gaming",
  "Sports",
  "Photography",
  "Travel",
  "Music",
  "Technology",
  "Shopping",
  "Study",
] as const;

export const taskDurations = [
  { id: "1", label: "1 hour", hours: 1 },
  { id: "2", label: "2 hours", hours: 2 },
  { id: "3", label: "3 hours", hours: 3 },
  { id: "4", label: "4 hours", hours: 4 },
  { id: "custom", label: "Custom", hours: null },
] as const;

export const taskBudgetPresets = [300, 500, 800, 1000, 1500] as const;

export const taskPlatformFee = 50;

export const taskTitleExamples = [
  "Need someone to accompany me to a movie",
  "Need help taking my grandmother to the hospital",
  "Need someone to explore Mangalore with",
  "Need help carrying things while shopping",
  "Need a study companion for 2 hours",
];

// Statuses shown on the customer's "My Tasks" dashboard, in lifecycle order.
export const taskStatuses = [
  "draft",
  "payment_pending",
  "waiting_for_wysa",
  "wysa_accepted",
  "confirmed",
  "in_progress",
  "completed",
  "payment_released",
  "cancelled",
  "under_review",
] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const taskStatusLabels: Record<TaskStatus, string> = {
  draft: "Draft",
  payment_pending: "Payment pending",
  waiting_for_wysa: "Waiting for Wysa",
  wysa_accepted: "Wysa accepted",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  payment_released: "Payment released",
  cancelled: "Cancelled",
  under_review: "Under review",
};

export type PaymentMethod = "upi" | "card" | "wallet";

export const disputeReasons = [
  "Task not completed",
  "Wysa did not arrive",
  "Task was different from description",
  "Safety concern",
  "Other",
] as const;

export type DisputeReason = (typeof disputeReasons)[number];

function resolveDurationHours(durationId: string, customHours: number): number {
  if (durationId === "custom") {
    return Number.isFinite(customHours) && customHours > 0 ? customHours : 1;
  }
  const match = taskDurations.find((d) => d.id === durationId);
  return match?.hours ?? 1;
}

export function taskDurationLabel(durationId: string, customHours: number): string {
  if (durationId === "custom") {
    const hours = resolveDurationHours(durationId, customHours);
    return `${hours} hour${hours === 1 ? "" : "s"} (custom)`;
  }
  return taskDurations.find((d) => d.id === durationId)?.label ?? "";
}

export { resolveDurationHours as resolveTaskDurationHours };

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Formats a yyyy-mm-dd date string as "29 August 2026". */
export function formatDateLong(dateStr: string): string {
  if (!dateStr) return "Select a date";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return "Select a date";
  return `${day} ${monthNames[month - 1]} ${year}`;
}

/** Formats a 24-hour "HH:mm" time string as "5:00 PM". */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return "Select a time";
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "Select a time";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

/** True once the task's scheduled date/time has arrived (used to show "Task in progress"). */
export function hasTaskStarted(date: string, time: string): boolean {
  if (!date || !time) return false;
  const scheduled = new Date(`${date}T${time}`);
  if (Number.isNaN(scheduled.getTime())) return false;
  return Date.now() >= scheduled.getTime();
}

/**
 * The status to display: once a confirmed task's scheduled time has passed,
 * it's shown as "in progress" even though the underlying stored status is
 * still "confirmed" until the Wysa marks it complete.
 */
export function getEffectiveStatus(
  status: TaskStatus,
  date: string,
  time: string
): TaskStatus {
  if (status === "confirmed" && hasTaskStarted(date, time)) {
    return "in_progress";
  }
  return status;
}

export function todayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
