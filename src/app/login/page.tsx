import type { Metadata } from "next";
import { Suspense } from "react";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in — WYSA",
  description: "Log in to your WYSA account.",
};

function LoginFormFallback() {
  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-12 sm:py-16">
      <div className="font-heading text-2xl font-bold">Log in</div>
      <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
