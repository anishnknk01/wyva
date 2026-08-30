import type { Metadata } from "next";
import { ShieldCheck, MessageCircle, ShieldAlert, Flag } from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Safety — WYSA",
  description:
    "How WYSA approaches safety: verified profiles, in-app communication, emergency contacts, and reporting.",
};

const safetyFeatures = [
  {
    title: "Verified profiles",
    description:
      "Wysas go through a profile verification process before they can accept tasks.",
    icon: ShieldCheck,
  },
  {
    title: "In-app communication",
    description:
      "Chat and coordinate without sharing your personal phone number until you're ready.",
    icon: MessageCircle,
  },
  {
    title: "Emergency contact",
    description:
      "Add an emergency contact to any task posted for a parent, grandparent, or friend.",
    icon: ShieldAlert,
  },
  {
    title: "Report or block",
    description:
      "Report a concern or block a profile directly from a chat or task. Our team can review reported activity.",
    icon: Flag,
  },
];

export default function SafetyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal/10 text-teal">
              <ShieldCheck className="size-6" />
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Safety at WYSA
            </h1>
            <p className="mt-2 text-muted-foreground">
              A few of the features and processes WYSA is built around to
              make every task feel a little safer.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {safetyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-teal/10 text-teal">
                    <Icon className="size-5" />
                  </span>
                  <h2 className="mt-4 font-heading text-lg font-semibold">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            This page describes platform features and processes for this
            prototype. It does not guarantee the conduct of any individual
            user, and does not replace contacting local emergency services if
            you are ever in immediate danger.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
