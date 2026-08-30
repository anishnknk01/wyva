"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ImagePlus, Sparkles, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { mangaloreAreas } from "@/lib/content";
import {
  applicationActivities,
  applicationLanguages,
  applicationInterests,
} from "@/lib/become-a-wysa";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";

type FormErrors = Partial<{
  fullName: string;
  age: string;
  area: string;
  phone: string;
  languages: string;
  activities: string;
  intro: string;
  agree: string;
}>;

export function ApplicationForm() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [age, setAge] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [intro, setIntro] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [availability, setAvailability] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggle(list: string[], value: string) {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = "Full name is required.";
    if (!age.trim()) next.age = "Age is required.";
    else if (Number(age) < 18) next.age = "Wysas must be 18 or older.";
    if (!area) next.area = "Please select your area.";
    if (!phone.trim()) next.phone = "Phone number is required.";
    if (languages.length === 0) next.languages = "Pick at least one language.";
    if (activities.length === 0)
      next.activities = "Pick at least one activity you can help with.";
    if (!intro.trim()) next.intro = "A short introduction is required.";
    if (!agree) next.agree = "Please agree to the community and safety guidelines.";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userLoading && !user) {
      toast.error("Please log in to submit an application.");
      router.push("/login");
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fill in the required fields");
      return;
    }

    if (!user) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("wysa_applications").insert({
      user_id: user.id,
      full_name: fullName.trim(),
      preferred_name: preferredName.trim() || null,
      age: Number(age),
      area,
      phone: phone.trim(),
      languages,
      interests,
      activities,
      intro: intro.trim(),
      hourly_rate: hourlyRate ? Number(hourlyRate) : null,
      availability: availability.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't submit application", { description: error.message });
      return;
    }

    setSubmitted(true);
    toast.success("Application received!");
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="flex size-14 items-center justify-center rounded-full bg-teal/10 text-teal">
          <CheckCircle2 className="size-6" />
        </span>
        <h2 className="mt-4 font-heading text-xl font-semibold">
          Application received!
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Thanks for applying to Wysa. We&apos;ll review your information
          and contact you about the next step.
        </p>
        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1.5 text-xs font-semibold text-teal">
          <CheckCircle2 className="size-3.5" />
          Application submitted
        </div>
        <Button
          variant="outline"
          className="mt-6 rounded-full"
          render={<Link href="/" />}
        >
          <ArrowLeft className="size-4" />
          Back to Wysa
        </Button>
      </div>
    );
  }

  return (
    <form
      id="apply"
      onSubmit={handleSubmit}
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 className="font-heading text-lg font-semibold">Application form</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Takes about five minutes. Fields marked * are required.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full-name">Full name *</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="h-10"
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="preferred-name">Preferred name</Label>
          <Input
            id="preferred-name"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="What should we call you?"
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            min={18}
            max={70}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="18+"
            className="h-10"
            aria-invalid={!!errors.age}
          />
          {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="area">Mangalore area *</Label>
          <Select value={area} onValueChange={(value) => setArea(value ?? "")}>
            <SelectTrigger id="area" className="w-full" aria-invalid={!!errors.area}>
              <SelectValue placeholder="Select your area" />
            </SelectTrigger>
            <SelectContent>
              {mangaloreAreas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.area && <p className="text-xs text-destructive">{errors.area}</p>}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="phone">Phone number *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91"
            className="h-10"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hourly-rate">Preferred hourly rate (₹)</Label>
          <Input
            id="hourly-rate"
            type="number"
            min={0}
            step={50}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="e.g. 350"
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="availability">Availability</Label>
          <Input
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. Weekday evenings, weekends"
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Profile photo</Label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-coral/40 hover:text-foreground"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
              <ImagePlus className="size-4" />
            </span>
            {photoName ? (
              <span className="truncate font-medium text-foreground">
                {photoName}
              </span>
            ) : (
              <span>Upload a clear photo of yourself</span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? "")}
          />
        </div>
      </div>

      <div className="mt-6">
        <CheckboxGroup
          title="Languages you speak *"
          options={applicationLanguages}
          selected={languages}
          onToggle={(value) => setLanguages((prev) => toggle(prev, value))}
        />
        {errors.languages && (
          <p className="mt-1.5 text-xs text-destructive">{errors.languages}</p>
        )}
      </div>

      <div className="mt-6">
        <CheckboxGroup
          title="Your interests"
          options={applicationInterests}
          selected={interests}
          onToggle={(value) => setInterests((prev) => toggle(prev, value))}
        />
      </div>

      <div className="mt-6">
        <CheckboxGroup
          title="Activities you can help with *"
          options={applicationActivities}
          selected={activities}
          onToggle={(value) => setActivities((prev) => toggle(prev, value))}
        />
        {errors.activities && (
          <p className="mt-1.5 text-xs text-destructive">{errors.activities}</p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
        <Label htmlFor="intro">Short introduction *</Label>
        <Textarea
          id="intro"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="Tell people a bit about yourself and what you enjoy doing."
          className="min-h-24"
          aria-invalid={!!errors.intro}
        />
        {errors.intro && <p className="text-xs text-destructive">{errors.intro}</p>}
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-2.5 rounded-xl bg-muted/40 p-4 text-sm">
        <Checkbox
          checked={agree}
          onCheckedChange={(checked) => setAgree(checked === true)}
          className="mt-0.5"
          aria-invalid={!!errors.agree}
        />
        <span>
          I agree to follow Wysa&apos;s community and safety guidelines.
        </span>
      </label>
      {errors.agree && (
        <p className="mt-1.5 text-xs text-destructive">{errors.agree}</p>
      )}

      <Button
        size="lg"
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full sm:w-auto"
      >
        <Sparkles className="size-4" />
        {submitting ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  );
}
