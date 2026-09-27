"use client";

import { useState } from "react";
import { Star, BadgeCheck, MessageCircle, CheckCircle2, MapPin, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { RealWysaProfile } from "@/lib/wysas";

/** Formats an ISO timestamp as "X minutes ago", "2 hours ago", etc. */
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export function WysaAcceptedCard({
  wysa,
  taskId,
  acceptedAt,
  onConfirm,
  onChooseAnother,
}: {
  wysa: RealWysaProfile;
  taskId: string;
  /** task.updatedAt — reflects when the task status last changed (i.e. acceptance time) */
  acceptedAt: string;
  onConfirm: () => void;
  onChooseAnother: () => void;
}) {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const initial = wysa.name.charAt(0).toUpperCase();
  const firstName = wysa.name.split(" ")[0];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header strip — who + when */}
      <div className="bg-teal-50 border-b border-teal-100 px-5 py-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-teal-800">
            <span className="font-bold">{firstName}</span> accepted your task
          </p>
        </div>
        <span className="shrink-0 text-xs text-teal-600">{timeAgo(acceptedAt)}</span>
      </div>

      <div className="p-5">
        {/* Profile row */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {wysa.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={wysa.avatarUrl}
                alt={wysa.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-teal-100"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-100 text-xl font-bold text-white">
                {initial}
              </div>
            )}
          </div>

          {/* Name + area + verification + stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-heading text-base font-bold text-gray-900">{wysa.name}</p>
              {wysa.verified && (
                <BadgeCheck className="size-4 text-teal-600 shrink-0" />
              )}
            </div>
            {wysa.area && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="size-3" />
                {wysa.area}, Mangalore
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {wysa.rating > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {wysa.rating.toFixed(1)}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {wysa.sessionsCount} task{wysa.sessionsCount !== 1 ? "s" : ""} completed
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {wysa.bio ? (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{wysa.bio}</p>
        ) : null}

        {/* Skills */}
        {wysa.skills.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <Briefcase className="size-3" />
              Services
            </p>
            <div className="flex flex-wrap gap-1.5">
              {wysa.skills.slice(0, showMore ? undefined : 4).map(skill => (
                <span key={skill} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {skill}
                </span>
              ))}
              {!showMore && wysa.skills.length > 4 && (
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  +{wysa.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Languages / Interests — expandable */}
        {(wysa.languages.length > 0 || wysa.interests.length > 0) && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowMore(v => !v)}
              className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              {showMore ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              {showMore ? "Show less" : "See more details"}
            </button>
            {showMore && (
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                {wysa.languages.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">Languages</p>
                    <p className="text-sm">{wysa.languages.join(" • ")}</p>
                  </div>
                )}
                {wysa.interests.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">Interests</p>
                    <p className="text-sm">{wysa.interests.join(" • ")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Phone privacy notice */}
        <p className="mt-4 text-xs text-muted-foreground">
          📵 Phone number is hidden until after you confirm — use the message button to chat.
        </p>

        {/* Message CTA — prominent, above confirm */}
        <button
          type="button"
          onClick={() => router.push(`/messages/${taskId}?user=${wysa.id}`)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 transition-colors"
        >
          <MessageCircle className="size-4" />
          Message {firstName}
        </button>

        {/* Confirm / choose another */}
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 rounded-full text-sm"
            onClick={onChooseAnother}
          >
            Choose another
          </Button>
          <Button
            className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-sm font-semibold"
            onClick={onConfirm}
          >
            Confirm {firstName}
          </Button>
        </div>
      </div>
    </div>
  );
}
