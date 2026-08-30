import type { Metadata } from "next";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WysaTasksPage } from "@/components/wysa-tasks/wysa-tasks-page";

export const metadata: Metadata = {
  title: "Wysa Dashboard — WYSA",
  description: "Track available tasks, accepted tasks, completed tasks, and your estimated earnings.",
};

export default function WysaTasksRoute() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <WysaTasksPage />
      </main>
      <Footer />
    </>
  );
}
