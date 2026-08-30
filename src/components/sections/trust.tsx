import { ShieldCheck, MessageCircle, Siren, Star, LifeBuoy } from "lucide-react";

const trustFeatures = [
  {
    title: "Verified profiles",
    description:
      "Wysas go through an ID and profile verification process before they can accept a task.",
    icon: ShieldCheck,
  },
  {
    title: "In-app communication",
    description:
      "Chat and coordinate without sharing your personal number until you're ready.",
    icon: MessageCircle,
  },
  {
    title: "Simulated escrow",
    description:
      "Your payment is held in the platform and only released to the Wysa once you confirm the task is done.",
    icon: LifeBuoy,
  },
  {
    title: "Ratings & reviews",
    description:
      "Every task can be rated by both sides, so the community stays honest and reliable.",
    icon: Star,
  },
  {
    title: "Emergency contact",
    description:
      "A one-tap emergency contact option is available throughout every task.",
    icon: Siren,
  },
];

export function Trust() {
  return (
    <section id="safety" className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            People you can feel good about meeting.
          </h2>
          <p className="mt-3 text-muted-foreground">
            WYSA is built around a set of platform features and processes
            designed to make every task feel a little safer.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trustFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                style={{ animationDelay: `${index * 60}ms` }}
                className="animate-fade-up rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-teal/10 text-teal">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
