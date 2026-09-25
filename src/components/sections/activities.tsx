import Link from "next/link";
import { activities } from "@/lib/content";

// Soft pastel background colours per category card (cycles through the list)
const cardBgs = [
  "bg-pink-100",
  "bg-purple-100",
  "bg-emerald-100",
  "bg-rose-100",
  "bg-yellow-100",
  "bg-sky-100",
  "bg-orange-100",
  "bg-teal-100",
  "bg-indigo-100",
  "bg-lime-100",
  "bg-red-100",
  "bg-cyan-100",
  "bg-amber-100",
  "bg-fuchsia-100",
  "bg-green-100",
  "bg-blue-100",
  "bg-violet-100",
];

export function Activities() {
  return (
    <section id="activities" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* heading */}
        <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          What do you need?
        </h2>

        {/* horizontal scroll row */}
        <div className="mt-8 flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            const bg = cardBgs[index % cardBgs.length];
            return (
              <Link
                key={activity.title}
                href={`/create-task?category=${encodeURIComponent(activity.title)}`}
                className="group snap-start shrink-0 w-52 sm:w-64 rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* dark green label */}
                <div className="bg-[#0f172a] px-5 py-4 min-h-[84px] flex items-start">
                  <span className="font-semibold text-white text-base leading-snug">
                    {activity.title}
                  </span>
                </div>

                {/* illustration / icon area */}
                <div className={`${bg} flex-1 flex items-center justify-center py-12`}>
                  <Icon className="size-16 text-gray-700 opacity-80 transition-transform duration-200 group-hover:scale-110" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
