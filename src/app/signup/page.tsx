import type { Metadata } from "next";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign up — WYSA",
  description: "Create your WYSA account.",
};

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <SignupForm />
      </main>
      <Footer />
    </>
  );
}
