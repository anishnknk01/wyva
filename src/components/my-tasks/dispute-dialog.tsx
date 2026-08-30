"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { disputeReasons, type DisputeReason } from "@/lib/tasks";

export function DisputeDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: DisputeReason) => void;
}) {
  const [reason, setReason] = useState<DisputeReason | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setReason(null);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Flag className="size-4 text-coral" />
            What&apos;s wrong?
          </DialogTitle>
          <DialogDescription>
            Let us know what happened so we can look into it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {disputeReasons.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setReason(option)}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                reason === option
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-border bg-background text-foreground hover:border-coral/30"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <Button
          className="w-full rounded-full"
          disabled={!reason}
          onClick={() => reason && onSubmit(reason)}
        >
          Submit issue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
