import { Star, BadgeCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RealWysaProfile } from "@/lib/wysas";

export function WysaAcceptedCard({
  wysa,
  onConfirm,
  onChooseAnother,
}: {
  wysa: RealWysaProfile;
  onConfirm: () => void;
  onChooseAnother: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold text-coral">
        {wysa.name} wants to take this task.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-primary font-heading text-lg font-bold text-white/90">
          {wysa.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-heading text-base font-semibold">{wysa.name}</p>
            {wysa.verified && <BadgeCheck className="size-4 text-teal" />}
          </div>
          <p className="text-xs text-muted-foreground">{wysa.area}, Mangalore</p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full bg-sun/20 px-2 py-1 text-xs font-semibold text-sun-foreground">
          <Star className="size-3.5 fill-current" />
          {wysa.rating.toFixed(1)}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {wysa.sessionsCount} tasks completed
      </p>

      <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Languages</p>
          <p className="mt-0.5">{wysa.languages.join(" • ")}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Interests</p>
          <p className="mt-0.5">{wysa.interests.join(" • ")}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          className="flex-1 rounded-full"
          onClick={onChooseAnother}
        >
          Choose another
        </Button>
        <Button className="flex-1 rounded-full" onClick={onConfirm}>
          Confirm Wysa
        </Button>
      </div>
    </div>
  );
}
