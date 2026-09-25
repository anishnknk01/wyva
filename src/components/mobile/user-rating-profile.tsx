'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RatingDisplay, RatingBadge } from './rating-stars'
import { ReviewsList } from './reviews-list'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { User, Star, Award, CheckCircle2, Calendar } from 'lucide-react'
import { useErrorHandler } from '@/hooks/use-error-handler'

interface UserRatingData {
  profile: {
    id: string
    full_name: string
    avatar_url: string | null
    average_rating: number
    total_ratings: number
    total_tasks_completed: number
    total_tasks_posted: number
    ratingBadge: string
  }
  ratings: any[]
  ratingDistribution: Array<{
    star: number
    count: number
    percentage: number
  }>
}

interface UserRatingProfileProps {
  userId: string
  showReviews?: boolean
  compact?: boolean
  className?: string
}

export function UserRatingProfile({ 
  userId, 
  showReviews = true, 
  compact = false,
  className 
}: UserRatingProfileProps) {
  const { handleAsyncError } = useErrorHandler()
  const [data, setData] = useState<UserRatingData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserRating = async () => {
    await handleAsyncError(async () => {
      const response = await fetch(`/api/ratings/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user rating data')
      }

      const ratingData = await response.json()
      setData(ratingData)
    }, {
      title: 'Failed to load rating data',
      description: 'Please try again'
    })

    setLoading(false)
  }

  useEffect(() => {
    if (userId) {
      loadUserRating()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { profile, ratingDistribution } = data

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-gray-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {profile.full_name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <RatingDisplay 
                  rating={profile.average_rating} 
                  totalRatings={profile.total_ratings}
                  size="sm"
                />
                <RatingBadge 
                  averageRating={profile.average_rating}
                  totalRatings={profile.total_ratings}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Main Profile Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center">
            {/* Avatar */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-gray-500" />
              )}
            </div>

            {/* Name and Badge */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {profile.full_name}
            </h2>
            
            <div className="flex justify-center mb-4">
              <RatingBadge 
                averageRating={profile.average_rating}
                totalRatings={profile.total_ratings}
                className="text-sm"
              />
            </div>

            {/* Main Rating Display */}
            <div className="mb-6">
              <RatingDisplay 
                rating={profile.average_rating} 
                totalRatings={profile.total_ratings}
                size="lg"
                className="justify-center"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {profile.total_tasks_completed}
                </div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Tasks Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {profile.total_tasks_posted}
                </div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Tasks Posted
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      {profile.total_ratings > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Rating Distribution
            </h3>
            
            <div className="space-y-3">
              {ratingDistribution.reverse().map((distribution) => (
                <div key={distribution.star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{distribution.star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  
                  <div className="flex-1">
                    <Progress 
                      value={distribution.percentage} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600 w-12 text-right">
                    {distribution.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {showReviews && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-teal-600" />
            Recent Reviews
          </h3>
          <ReviewsList userId={userId} />
        </div>
      )}
    </div>
  )
}