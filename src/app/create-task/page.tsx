"use client";

import { Suspense } from "react";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CreateTaskForm } from "@/components/create-task/create-task-form";
import { withAuth } from "@/lib/auth-guard";

function CreateTaskPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            What do you need help with?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the details below and a Wysa nearby can pick it up.
          </p>
          <div className="mt-6">
            <Suspense>
              <CreateTaskForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default withAuth(CreateTaskPage);
