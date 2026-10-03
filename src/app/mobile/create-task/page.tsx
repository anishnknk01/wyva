"use client";

import { MobileLayout } from "@/components/mobile/mobile-layout";
import { MobileCreateTask } from "@/components/mobile/mobile-create-task";
import { withAuth } from "@/lib/auth-guard";

function MobileCreateTaskPage() {
  // Allow both customers and workers to post tasks
  // Workers might also need help with errands, companionship, etc.
  
  return (
    <MobileLayout title="Post a Task" showBack={true} showBottomNav={false}>
      <MobileCreateTask />
    </MobileLayout>
  );
}

export default withAuth(MobileCreateTaskPage);
