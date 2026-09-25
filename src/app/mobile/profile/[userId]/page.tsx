'use client'

import { MobileLayout } from '@/components/mobile/mobile-layout'
import { UserRatingProfile } from '@/components/mobile/user-rating-profile'
import { withAuth } from '@/lib/auth-guard'

function UserProfilePage({ params }: { params: { userId: string } }) {
  return (
    <MobileLayout title="User Profile">
      <div className="p-4">
        <UserRatingProfile 
          userId={params.userId}
          showReviews={true}
        />
      </div>
    </MobileLayout>
  )
}

export default withAuth(UserProfilePage)