import Link from "next/link";
import { MapPin } from "lucide-react";

import { localSpots } from "@/lib/content";

// Soft pastel bg per card
const cardBgs = [
  "bg-teal-100",
  "bg-orange-100",
  "bg-pink-100",
  "bg-amber-100",
  "bg-emerald-100",
];

export function ExploreMangalore() {
  return (
    <section id="explore" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* heading */}
        <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Explore Mangalore
        </h2>
        <p className="mt-2 text-muted-foreground">
          From beach evenings to city strolls, someone local always knows the best way to spend it.
        </p>

        {/* horizontal scroll row */}
        <div className="mt-8 flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {localSpots.map((spot, index) => {
            const bg = cardBgs[index % cardBgs.length];
            return (
              <Link
                key={spot.name}
                href={`/create-task?area=${encodeURIComponent(spot.area)}`}
                className="group snap-start shrink-0 w-52 sm:w-60 rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* dark green label */}
                <div className="bg-[#0f172a] px-4 py-3 min-h-[80px] flex flex-col justify-between">
                  <span className="font-semibold text-white text-sm leading-snug">
                    {spot.name}
                  </span>
                  <span className="flex items-center gap-1 text-green-300 text-xs mt-1">
                    <MapPin className="size-3" />
                    {spot.area}
                  </span>
                </div>

                {/* illustration area */}
                <div className={`${bg} flex-1 flex flex-col items-center justify-center py-8 px-4`}>
                  <MapPin className="size-10 text-gray-600 opacity-70 mb-2 transition-transform duration-200 group-hover:scale-110" />
                  <p className="text-xs text-center text-gray-600 leading-snug">
                    {spot.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
