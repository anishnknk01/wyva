import { ShieldCheck, MessageCircle, Siren, Star, LifeBuoy, Headphones } from "lucide-react";

const trustFeatures = [
  {
    title: "Verified profiles",
    description: "Every Wysa is ID-verified before they can accept a task.",
    icon: ShieldCheck,
    accent: "from-teal-400 to-emerald-500",
    bg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    title: "In-app messaging",
    description: "Coordinate without sharing your phone number until you're ready.",
    icon: MessageCircle,
    accent: "from-blue-400 to-indigo-500",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Secure payments",
    description: "Payment is held until you confirm the task is complete. No risk.",
    icon: LifeBuoy,
    accent: "from-violet-400 to-purple-500",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    title: "Ratings & reviews",
    description: "Both sides rate every task, keeping the community honest.",
    icon: Star,
    accent: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Emergency contact",
    description: "One tap to alert an emergency contact during any task.",
    icon: Siren,
    accent: "from-rose-400 to-red-500",
    bg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    title: "24/7 support",
    description: "Run into an issue? Our team is available to help at any time.",
    icon: Headphones,
    accent: "from-sky-400 to-cyan-500",
    bg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
];

export function Trust() {
  return (
    <section id="safety" className="bg-gray-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* heading */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <span className="inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-400 mb-4">
            Safety first
          </span>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
            People you can{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              trust.
            </span>
          </h2>
        </div>

        {/* cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trustFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:-translate-y-1"
              >
                {/* gradient glow top-left */}
                <div className={`absolute -top-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br ${feature.accent} opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20`} />

                {/* icon */}
                <div className={`relative flex size-12 items-center justify-center rounded-xl ${feature.bg} mb-5`}>
                  <Icon className={`size-6 ${feature.iconColor} stroke-[1.5]`} />
                </div>

                {/* text */}
                <h3 className="relative text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* bottom gradient line */}
                <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${feature.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-60`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
