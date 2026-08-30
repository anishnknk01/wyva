"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ClipboardList,
  MapPin,
  CalendarDays,
  Clock,
  Hourglass,
  IndianRupee,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { CategoryPicker } from "@/components/create-task/category-picker";
import { DurationPicker } from "@/components/create-task/duration-picker";
import { BudgetPicker } from "@/components/create-task/budget-picker";
import { TaskReview } from "@/components/create-task/task-review";
import { SafetyNotice } from "@/components/ui/safety-notice";
import {
  taskAreas,
  taskLanguageOptions,
  taskInterestOptions,
  taskPlatformFee,
  taskTitleExamples,
  todayDateString,
  resolveTaskDurationHours,
  type TaskCategory,
} from "@/lib/tasks";
import { generateTaskId, saveTask } from "@/lib/task-store";
import { useUser } from "@/lib/use-user";

export function CreateTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [area, setArea] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [date, setDate] = useState(todayDateString());
  const [time, setTime] = useState("17:00");
  const [durationId, setDurationId] = useState("2");
  const [customHours, setCustomHours] = useState(1);
  const [budget, setBudget] = useState<number | "">(800);
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const presetCategory = searchParams.get("category");
    const presetArea = searchParams.get("area");
    if (presetCategory) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill from query params on mount
      setCategory(presetCategory as TaskCategory);
    }
    if (presetArea) {
      setArea(presetArea);
    }
  }, [searchParams]);

  function toggle(list: string[], value: string) {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  function validate(): string | null {
    if (!title.trim()) return "Give your task a title.";
    if (!description.trim()) return "Describe what you need.";
    if (!category) return "Pick a category.";
    if (!area) return "Select an area in Mangalore.";
    if (!date) return "Pick a date.";
    if (!time) return "Please select a time before continuing.";
    if (budget === "" || budget <= 0) return "Set a budget for your task.";
    return null;
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!userLoading && !user) {
      toast.error("Please log in to post a task.");
      router.push("/login");
      return;
    }
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setReviewing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleContinueToPayment() {
    if (!user) {
      toast.error("Please log in to post a task.");
      router.push("/login");
      return;
    }

    const hours = resolveTaskDurationHours(durationId, customHours);
    const numericBudget = typeof budget === "number" ? budget : 0;
    const taskId = generateTaskId();

    setSubmitting(true);
    const saved = await saveTask({
      id: taskId,
      customerId: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      area,
      locationNote: locationNote.trim(),
      date,
      time,
      durationId,
      customHours: durationId === "custom" ? customHours : hours,
      budget: numericBudget,
      languages,
      interests,
      platformFee: taskPlatformFee,
      total: numericBudget + taskPlatformFee,
      paymentMethod: null,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      status: "payment_pending",
      interestedCount: 0,
      acceptedWysaId: null,
      confirmedWysaId: null,
      dispute: null,
      userRating: null,
      wysaRating: null,
    });
    setSubmitting(false);

    if (!saved) {
      toast.error("Couldn't post your task. Please try again.");
      return;
    }
    router.push(`/pay-task/${taskId}`);
  }

  if (reviewing) {
    const numericBudget = typeof budget === "number" ? budget : 0;
    return (
      <div className="flex flex-col gap-6">
        <TaskReview
          title={title}
          description={description}
          category={category}
          area={area}
          locationNote={locationNote}
          date={date}
          time={time}
          durationId={durationId}
          customHours={customHours}
          budget={numericBudget}
          platformFee={taskPlatformFee}
        />
        <SafetyNotice />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full sm:flex-1"
            onClick={() => setReviewing(false)}
          >
            Edit task
          </Button>
          <Button
            size="lg"
            className="rounded-full sm:flex-1"
            onClick={handleContinueToPayment}
            disabled={submitting || userLoading}
          >
            {submitting ? "Posting task..." : "Continue to payment"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleReview} className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-1.5 font-heading text-lg font-semibold">
          <ClipboardList className="size-4 text-coral" />
          Give your task a title
        </h2>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={taskTitleExamples[0]}
          className="mt-3 h-11"
        />
        <div className="mt-2.5 flex flex-wrap gap-2">
          {taskTitleExamples.slice(1).map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setTitle(example)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-coral/40 hover:text-coral"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Describe what you need</h2>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the Wysa exactly what you need, where you need it, when you need it and anything important they should know."
          className="mt-3 min-h-32"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Example: &ldquo;I need someone to accompany me to a movie at City
          Centre on Saturday evening. I don&apos;t want to go alone. We can
          meet at the entrance.&rdquo;
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Category</h2>
        <div className="mt-3">
          <CategoryPicker value={category} onChange={setCategory} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-1.5 font-heading text-lg font-semibold">
          <MapPin className="size-4 text-coral" />
          Location
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="area">Area in Mangalore</Label>
            <Select value={area} onValueChange={(value) => setArea(value ?? "")}>
              <SelectTrigger id="area" className="w-full">
                <SelectValue placeholder="Select an area" />
              </SelectTrigger>
              <SelectContent>
                {taskAreas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location-note">Meeting point (optional)</Label>
            <Input
              id="location-note"
              value={locationNote}
              onChange={(e) => setLocationNote(e.target.value)}
              placeholder="e.g. City Centre main entrance"
              className="h-10"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Your exact home address is never shown publicly.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <CalendarDays className="size-4 text-coral" />
              Date
            </h3>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2.5 h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock className="size-4 text-coral" />
              Start time
            </h3>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2.5 h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
        </div>

        <Separator className="my-5" />

        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Hourglass className="size-4 text-coral" />
          Expected duration
        </h3>
        <div className="mt-2.5">
          <DurationPicker
            durationId={durationId}
            customHours={customHours}
            onChangeDuration={setDurationId}
            onChangeCustomHours={setCustomHours}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-1.5 font-heading text-lg font-semibold">
          <IndianRupee className="size-4 text-coral" />
          What&apos;s your budget?
        </h2>
        <div className="mt-3">
          <BudgetPicker budget={budget} onChangeBudget={setBudget} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Optional preferences</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          These are preferences, not requirements. They just help the right
          Wysa find your task.
        </p>

        <div className="mt-4">
          <CheckboxGroup
            title={"Languages preferred"}
            options={taskLanguageOptions}
            selected={languages}
            onToggle={(value) => setLanguages((prev) => toggle(prev, value))}
          />
        </div>

        <div className="mt-4">
          <CheckboxGroup
            title={"Interests"}
            options={taskInterestOptions}
            selected={interests}
            onToggle={(value) => setInterests((prev) => toggle(prev, value))}
          />
        </div>
      </div>

      <Button size="lg" type="submit" className="h-12 w-full rounded-full text-base">
        Review your task
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
