"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RateDialog({
  open,
  onOpenChange,
  subjectName,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectName: string;
  onSubmit: (stars: number, review: string) => void;
}) {
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate {subjectName}</DialogTitle>
          <DialogDescription>
            How was your experience? A review is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStars(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              className="p-0.5"
            >
              <Star
                className={`size-7 ${value <= stars ? "fill-current text-sun" : "text-muted-foreground/30"}`}
              />
            </button>
          ))}
        </div>

        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Optional review"
          className="min-h-20"
        />

        <Button
          className="w-full rounded-full"
          onClick={() => onSubmit(stars, review.trim())}
        >
          Submit rating
        </Button>
      </DialogContent>
    </Dialog>
  );
}
