import Link from "next/link";
import { MapPin, ArrowRight, Sparkle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream via-background to-background">
      <div
        aria-hidden
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-coral/20 blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="absolute top-40 -left-20 h-64 w-64 rounded-full bg-teal/20 blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        aria-hidden
        className="absolute top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-sun/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center animate-fade-up">
          <Badge
            variant="secondary"
            className="mb-5 h-auto gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium"
          >
            <Sparkle className="size-3.5 text-coral" />
            Now live in Mangalore
          </Badge>

          <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            WYSA
          </h1>
          <p className="mt-3 font-heading text-xl font-semibold text-primary sm:text-2xl">
            Find your vibe.
          </p>

          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Need someone? Post what you need. Tell us what you need, and
            let the right person come to you.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 w-full rounded-full px-7 text-base sm:w-auto"
              render={<Link href="/create-task" />}
            >
              Post a Task
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-full px-7 text-base sm:w-auto"
              render={<Link href="/tasks" />}
            >
              Find Tasks
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
            <MapPin className="size-4 text-coral" />
            Serving Mangalore, Karnataka
          </div>
        </div>
      </div>
    </section>
  );
}
