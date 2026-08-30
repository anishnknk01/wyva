import type { Metadata } from "next";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TasksPage } from "@/components/tasks/tasks-page";

export const metadata: Metadata = {
  title: "Find Tasks — WYSA",
  description:
    "Browse open tasks posted by people in Mangalore and pick up ones you can help with.",
};

export default function TasksRoute() {
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
