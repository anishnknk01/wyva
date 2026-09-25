"use client";

import { MobileLayout } from '@/components/mobile/mobile-layout';
import { MobileFindTasks } from '@/components/mobile/mobile-find-tasks';
import { withAuth } from '@/lib/auth-guard';

function MobileFindTasksPage() {
  return (
    <MobileLayout title="Find Tasks">
      <MobileFindTasks />
    </MobileLayout>
  );
}

export default withAuth(MobileFindTasksPage);