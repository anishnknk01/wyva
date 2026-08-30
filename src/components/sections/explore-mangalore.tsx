import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";

import { localSpots } from "@/lib/content";

export function ExploreMangalore() {
  return (
    <section id="explore" className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Explore Mangalore with a Wysa
          </h2>
          <p className="mt-3 text-muted-foreground">
            From beach evenings to city strolls, someone local always knows
            the best way to spend it.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {localSpots.map((spot, index) => (
            <Link
              key={spot.name}
              href={`/create-task?area=${encodeURIComponent(spot.area)}`}
              style={{ animationDelay: `${index * 60}ms` }}
              className="group animate-fade-up relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`relative h-40 w-full bg-gradient-to-br ${spot.gradient} transition-transform duration-500 group-hover:scale-105`}
              >
                <div className="absolute inset-0 bg-black/10" />
                <ArrowUpRight className="absolute right-4 top-4 size-5 text-white/90" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-coral">
                  <MapPin className="size-3.5" />
                  {spot.area}
                </div>
                <h3 className="mt-1.5 font-heading text-lg font-semibold">
                  {spot.name}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {spot.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
