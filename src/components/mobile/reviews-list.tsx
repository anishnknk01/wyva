'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RatingStars, RatingDisplay } from './rating-stars'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { TouchFeedback } from './touch-feedback'
import { User, Star, Calendar, ThumbsUp, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useErrorHandler } from '@/hooks/use-error-handler'

interface Review {
  id: string
  stars: number
  review: string | null
  created_at: string
  rater: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  task: {
    id: string
    title: string
    category: string
  }
}

interface ReviewsListProps {
  userId: string
  className?: string
}

export function ReviewsList({ userId, className }: ReviewsListProps) {
  const { handleAsyncError } = useErrorHandler()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const loadReviews = async (isLoadMore = false) => {
    const currentOffset = isLoadMore ? offset : 0
    
    await handleAsyncError(async () => {
      const response = await fetch(
        `/api/ratings?userId=${userId}&limit=10&offset=${currentOffset}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      const newReviews = data.ratings || []

      if (isLoadMore) {
        setReviews(prev => [...prev, ...newReviews])
      } else {
        setReviews(newReviews)
      }

      setHasMore(newReviews.length === 10)
      setOffset(currentOffset + newReviews.length)
    }, {
      title: 'Failed to load reviews',
      description: 'Please try again'
    })

    if (isLoadMore) {
      setLoadingMore(false)
    } else {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    setLoadingMore(true)
    loadReviews(true)
  }

  useEffect(() => {
    loadReviews()
  }, [userId])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-600 text-sm">
          This user hasn't received any reviews yet.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full"
          >
            {loadingMore ? (
              <>
                <LoadingSpinner className="mr-2" />
                Loading more reviews...
              </>
            ) : (
              'Load More Reviews'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              {review.rater.avatar_url ? (
                <img 
                  src={review.rater.avatar_url} 
                  alt={review.rater.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">
                {review.rater.full_name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <RatingStars rating={review.stars} size="sm" />
                <span className="text-xs text-gray-500">
                  {formatDate(review.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="text-sm font-medium text-gray-900 line-clamp-1">
            {review.task.title}
          </div>
          <Badge variant="outline" className="text-xs mt-1">
            {review.task.category}
          </Badge>
        </div>

        {/* Review Text */}
        {review.review && (
          <div className="mb-3">
            <p className="text-gray-700 text-sm leading-relaxed">
              {review.review}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <TouchFeedback 
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">Helpful</span>
            </TouchFeedback>
            
            <TouchFeedback 
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Reply</span>
            </TouchFeedback>
          </div>
          
          <div className="text-xs text-gray-400">
            Review #{review.id.slice(-6)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}