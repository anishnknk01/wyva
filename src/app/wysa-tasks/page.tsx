"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WysaTasksPage } from "@/components/wysa-tasks/wysa-tasks-page";
import { withAuth } from "@/lib/auth-guard";

function WysaTasksRoute() {
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

export default withAuth(WysaTasksRoute);
