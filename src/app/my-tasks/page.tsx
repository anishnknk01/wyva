import type { Metadata } from "next";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MyTasksPage } from "@/components/my-tasks/my-tasks-page";

export const metadata: Metadata = {
  title: "My Tasks — WYSA",
  description: "Track the tasks you've posted and their current status.",
};

export default function MyTasksRoute() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <MyTasksPage />
      </main>
      <Footer />
    </>
  );
}
