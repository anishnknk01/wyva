"use client";

import { MobileLayout } from '@/components/mobile/mobile-layout';
import { MobileMyTasks } from '@/components/mobile/mobile-my-tasks';
import { withAuth } from '@/lib/auth-guard';

function MobileMyTasksPage() {
  return (
    <MobileLayout title="My Tasks">
      <MobileMyTasks />
    </MobileLayout>
  );
}

export default withAuth(MobileMyTasksPage);