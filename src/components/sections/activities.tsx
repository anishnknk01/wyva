import Link from "next/link";

import { activities } from "@/lib/content";

export function Activities() {
  return (
    <section id="activities" className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            What&apos;s the plan?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pick a category and post a task, a Wysa nearby can pick it up.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <Link
                key={activity.title}
                href={`/create-task?category=${encodeURIComponent(activity.title)}`}
                style={{ animationDelay: `${index * 40}ms` }}
                className="group animate-fade-up flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-coral/40 hover:shadow-md sm:p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-coral/10 text-coral transition-colors group-hover:bg-coral group-hover:text-coral-foreground">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-heading text-sm font-semibold sm:text-base">
                    {activity.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground sm:text-sm">
                    {activity.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
