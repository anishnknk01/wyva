import { Clock, MapPin, Heart, Wallet } from "lucide-react";

import { whyWysaCards } from "@/lib/become-a-wysa";

const icons = [Clock, MapPin, Heart, Wallet];

export function WhyWysa() {
  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Why Wysa
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {whyWysaCards.map((card, index) => {
            const Icon = icons[index];
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-coral/10 text-coral">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 font-heading text-base font-semibold">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
