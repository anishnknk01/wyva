'use client'

import { useEffect, useState } from 'react'
import { MobileLayout } from '@/components/mobile/mobile-layout'
import { UserRatingProfile } from '@/components/mobile/user-rating-profile'
import { createClient } from '@/lib/supabase/client'
import { withAuth } from '@/lib/auth-guard'
import type { User } from '@supabase/supabase-js'

function MyReviewsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()
  }, [])

  if (loading) {
    return (
      <MobileLayout title="My Reviews">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </MobileLayout>
    )
  }

  if (!user) {
    return (
      <MobileLayout title="My Reviews">
        <div className="p-4">
          <p className="text-center text-gray-600">Please log in to view your reviews</p>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title="My Reviews">
      <div className="p-4">
        <UserRatingProfile 
          userId={user.id}
          showReviews={true}
        />
      </div>
    </MobileLayout>
  )
}

export default withAuth(MyReviewsPage)