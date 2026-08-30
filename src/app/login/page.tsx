import type { Metadata } from "next";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in — WYSA",
  description: "Log in to your WYSA account.",
};

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <LoginForm />
      </main>
      <Footer />
    </>
  );
}
