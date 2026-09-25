"use client";

import { MobileLayout } from '@/components/mobile/mobile-layout';
import { MobileDashboard } from '@/components/mobile/mobile-dashboard';
import { withAuth } from '@/lib/auth-guard';

function MobileHomePage() {
  return (
    <MobileLayout title="Good morning! 👋">
      <MobileDashboard />
    </MobileLayout>
  );
}

export default withAuth(MobileHomePage);