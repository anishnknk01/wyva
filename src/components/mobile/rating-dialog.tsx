'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RatingStars } from './rating-stars'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { User, CheckCircle2, Star } from 'lucide-react'
import type { Task } from '@/lib/task-store'

interface RatingDialogProps {
  isOpen: boolean
  onClose: () => void
  task: Task
  ratedUser: {
    id: string
    name: string
    avatar?: string
  }
  ratingType: 'task_completion' | 'task_posting'
}

export function RatingDialog({
  isOpen,
  onClose,
  task,
  ratedUser,
  ratingType
}: RatingDialogProps) {
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: task.id,
          ratedId: ratedUser.id,
          rating,
          review: review.trim() || null,
          ratingType
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit rating')
      }

      toast.success('Rating submitted successfully!')
      onClose()
      
      // Reset form
      setRating(5)
      setReview('')
      
    } catch (error) {
      console.error('Rating submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }

  const isTaskCompletion = ratingType === 'task_completion'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Rate {isTaskCompletion ? 'Task Completion' : 'Task Posting'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {task.category}
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                ₹{task.budget}
              </Badge>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              {ratedUser.avatar ? (
                <img 
                  src={ratedUser.avatar} 
                  alt={ratedUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {ratedUser.name}
              </div>
              <div className="text-sm text-gray-500">
                {isTaskCompletion ? 'Task completed by' : 'Task posted by'}
              </div>
            </div>
          </div>

          {/* Rating Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">
              How would you rate this {isTaskCompletion ? 'completion' : 'posting'}?
            </label>
            
            <div className="flex items-center justify-center gap-4">
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Leave a review (optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={`Share your experience with this ${isTaskCompletion ? 'task completion' : 'task posting'}...`}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <div className="text-xs text-gray-500 text-right">
              {review.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}