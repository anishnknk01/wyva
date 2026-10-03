"use client";

import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TaskWizard } from "@/components/create-task/task-wizard";
import { withAuth } from "@/lib/auth-guard";

function CreateTaskPage() {
  // Allow both customers and workers to post tasks
  // Workers might also need help with errands, companionship, etc.
  
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
