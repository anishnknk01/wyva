"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MyTasksPage } from "@/components/my-tasks/my-tasks-page";
import { withAuth } from "@/lib/auth-guard";

function MyTasksRoute() {
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

export default withAuth(MyTasksRoute);
