"use client";

import { MobileLayout } from '@/components/mobile/mobile-layout';
import { MobilePayTask } from '@/components/mobile/mobile-pay-task';
import { withAuth } from '@/lib/auth-guard';
import { use } from 'react';

interface PageProps {
  params: Promise<{ taskId: string }>;
}

function MobilePayTaskPage({ params }: PageProps) {
  const { taskId } = use(params);
  
  return (
    <MobileLayout title="Payment" showBack={true} showBottomNav={false}>
      <MobilePayTask taskId={taskId} />
    </MobileLayout>
  );
}

export default withAuth(MobilePayTaskPage);