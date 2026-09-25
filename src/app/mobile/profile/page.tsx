"use client";

import { MobileLayout } from '@/components/mobile/mobile-layout';
import { MobileProfile } from '@/components/mobile/mobile-profile';
import { withAuth } from '@/lib/auth-guard';

function MobileProfilePage() {
  return (
    <MobileLayout title="Profile">
      <MobileProfile />
    </MobileLayout>
  );
}

export default withAuth(MobileProfilePage);