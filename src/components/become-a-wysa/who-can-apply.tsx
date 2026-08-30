import { Check, Info } from "lucide-react";

import { whoCanApply } from "@/lib/become-a-wysa";

export function WhoCanApply() {
  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Who can become a Wysa
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {whoCanApply.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
            >
              <Check className="size-4 shrink-0 text-teal" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0 text-coral" />
          Wysas must be adults (18 years or older).
        </div>
      </div>
    </section>
  );
}
