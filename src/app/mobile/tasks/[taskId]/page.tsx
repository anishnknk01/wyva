"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { MobileLayout } from "@/components/mobile/mobile-layout";
import { MobileTaskDetail } from "@/components/mobile/mobile-task-detail";
import { withAuth } from "@/lib/auth-guard";

interface PageProps {
  params: Promise<{ taskId: string }>;
}

function MobileTaskDetailPage({ params }: PageProps) {
  const { taskId } = use(params);
  const router = useRouter();

  return (
    <MobileLayout title="Task Details" showBack showBottomNav={false} onBack={() => router.back()}>
      <MobileTaskDetail taskId={taskId} />
    </MobileLayout>
  );
}

export default withAuth(MobileTaskDetailPage);
