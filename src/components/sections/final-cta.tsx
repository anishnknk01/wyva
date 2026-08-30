import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 sm:py-24">
      <div
        aria-hidden
        className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-sun/20 blur-3xl"
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          Tell us what you need.
        </h2>
        <p className="mt-3 text-primary-foreground/80">
          Post a task and let the right person in Mangalore come to you.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="mt-8 h-12 rounded-full px-8 text-base font-semibold"
          render={<Link href="/create-task" />}
        >
          Post a Task
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}
