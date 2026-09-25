"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MobileLayout } from "@/components/mobile/mobile-layout";
import { MobileCreateTask } from "@/components/mobile/mobile-create-task";
import { withAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/client";

function MobileCreateTaskPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).maybeSingle();
      const role = profile?.role ?? user.user_metadata?.role;
      if (role === "worker") {
        toast.error("Workers can't post tasks");
        router.replace("/worker/dashboard");
      }
    })();
  }, [router]);

  return (
    <MobileLayout title="Post a Task" showBack={true} showBottomNav={false}>
      <MobileCreateTask />
    </MobileLayout>
  );
}

export default withAuth(MobileCreateTaskPage);
