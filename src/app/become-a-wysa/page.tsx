import type { Metadata } from "next";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ApplyHero } from "@/components/become-a-wysa/apply-hero";
import { HowItWorks } from "@/components/become-a-wysa/how-it-works";
import { WhyWysa } from "@/components/become-a-wysa/why-wysa";
import { WhoCanApply } from "@/components/become-a-wysa/who-can-apply";
import { ApplicationForm } from "@/components/become-a-wysa/application-form";

export const metadata: Metadata = {
  title: "Become a Wysa — WYSA",
  description:
    "Apply to become a Wysa in Mangalore. Meet people, explore the city and earn on your schedule.",
};

export default function BecomeAWysaPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <ApplyHero />
        <HowItWorks />
        <WhyWysa />
        <WhoCanApply />

        <section className="bg-cream py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Apply now
              </h2>
              <p className="mt-2 text-muted-foreground">
                Share a few details so we know who you are and how you can
                help.
              </p>
            </div>

            <div className="mt-8">
              <ApplicationForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
