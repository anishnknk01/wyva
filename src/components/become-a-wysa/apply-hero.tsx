import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ApplyHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream via-background to-background">
      <div
        aria-hidden
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-coral/20 blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="absolute top-32 -left-20 h-64 w-64 rounded-full bg-teal/20 blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative mx-auto max-w-3xl px-4 pt-16 pb-14 text-center sm:px-6 sm:pt-20 sm:pb-16">
        <Badge
          variant="secondary"
          className="mx-auto mb-5 h-auto gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium"
        >
          <Compass className="size-3.5 text-coral" />
          For Mangalore locals
        </Badge>

        <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          Become a Wysa
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Meet people, explore Mangalore and earn on your schedule.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="h-12 w-full rounded-full px-7 text-base sm:w-auto"
            render={<Link href="#apply" />}
          >
            Apply now
            <ArrowRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full rounded-full px-7 text-base sm:w-auto"
            render={<Link href="#how-it-works" />}
          >
            How it works
          </Button>
        </div>
      </div>
    </section>
  );
}
