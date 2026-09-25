"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TaskWizard } from "@/components/create-task/task-wizard";
import { withAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/client";

function CreateTaskPage() {
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
        toast.error("Workers can't post tasks.");
        router.replace("/worker/dashboard");
      }
    })();
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Suspense>
            <TaskWizard />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default withAuth(CreateTaskPage);
