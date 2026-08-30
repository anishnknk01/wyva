import { howItWorksSteps } from "@/lib/become-a-wysa";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three simple steps to get started as a Wysa.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {howItWorksSteps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="font-heading text-3xl font-extrabold text-coral/40">
                {step.number}
              </span>
              <h3 className="mt-3 font-heading text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
