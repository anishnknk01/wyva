"use client";

import type { Metadata } from "next";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TasksPage } from "@/components/tasks/tasks-page";
import { withAuth } from "@/lib/auth-guard";

// Note: metadata export doesn't work with client components
// Consider moving this to layout.tsx or using next/head

function TasksRoute() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <TasksPage />
      </main>
      <Footer />
    </>
  );
}

export default withAuth(TasksRoute);
