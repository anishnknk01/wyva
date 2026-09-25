'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  className
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starRating = index + 1
        const isFilled = starRating <= rating
        const isPartial = starRating - 0.5 <= rating && rating < starRating

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(starRating)}
            disabled={!interactive}
            className={cn(
              'relative transition-colors',
              interactive && 'hover:scale-110 cursor-pointer',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
                isFilled || isPartial
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              )}
            />
            {isPartial && (
              <Star
                className={cn(
                  sizeClasses[size],
                  'absolute inset-0 fill-yellow-400 text-yellow-400'
                )}
                style={{
                  clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

interface RatingDisplayProps {
  rating: number
  totalRatings?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

export function RatingDisplay({
  rating,
  totalRatings,
  size = 'md',
  showCount = true,
  className
}: RatingDisplayProps) {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <RatingStars rating={rating} size={size} />
      <div className={cn('flex items-center gap-1', textSizeClasses[size])}>
        <span className="font-medium text-gray-900">
          {rating.toFixed(1)}
        </span>
        {showCount && totalRatings !== undefined && (
          <span className="text-gray-500">
            ({totalRatings} review{totalRatings !== 1 ? 's' : ''})
          </span>
        )}
      </div>
    </div>
  )
}

interface RatingBadgeProps {
  averageRating: number
  totalRatings: number
  className?: string
}

export function RatingBadge({ averageRating, totalRatings, className }: RatingBadgeProps) {
  let badgeText = 'New'
  let badgeColor = 'bg-gray-100 text-gray-700'

  if (totalRatings > 0) {
    if (averageRating >= 4.5) {
      badgeText = 'Excellent'
      badgeColor = 'bg-green-100 text-green-800'
    } else if (averageRating >= 4.0) {
      badgeText = 'Very Good'
      badgeColor = 'bg-blue-100 text-blue-800'
    } else if (averageRating >= 3.5) {
      badgeText = 'Good'
      badgeColor = 'bg-teal-100 text-teal-800'
    } else if (averageRating >= 3.0) {
      badgeText = 'Average'
      badgeColor = 'bg-yellow-100 text-yellow-800'
    } else {
      badgeText = 'Below Average'
      badgeColor = 'bg-red-100 text-red-800'
    }
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      badgeColor,
      className
    )}>
      {badgeText}
    </span>
  )
}