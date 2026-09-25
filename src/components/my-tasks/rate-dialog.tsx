"use client";

import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/mobile/rating-stars";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

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
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(rating, review.trim());
      onOpenChange(false);
      // Reset form
      setRating(5);
      setReview("");
    } catch (error) {
      console.error('Rating submission error:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Rate {subjectName}
          </DialogTitle>
          <DialogDescription>
            How was your experience with the task completion?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rating Selection */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center">
              <RatingStars
                rating={rating}
                size="lg"
                interactive
                onRatingChange={setRating}
              />
            </div>
            
            {rating && (
              <div className="text-center">
                <span className="text-sm font-medium text-gray-700">
                  {ratingLabels[rating]}
                </span>
              </div>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Leave a review (optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with the task completion..."
              className="min-h-20 resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {review.length}/500 characters
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full rounded-full bg-teal-600 hover:bg-teal-700"
            onClick={handleSubmit}
            disabled={isSubmitting || !rating}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
