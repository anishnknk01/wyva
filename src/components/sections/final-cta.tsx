import Link from "next/link";
import { LayoutGrid, RefreshCw, Zap, SmilePlus } from "lucide-react";

import { Button } from "@/components/ui/button";

const perks = [
  {
    icon: LayoutGrid,
    text: "17+ categories, one platform",
  },
  {
    icon: RefreshCw,
    text: "Simple, fast task matching",
  },
  {
    icon: Zap,
    text: "Tasks done on time, within budget",
  },
  {
    icon: SmilePlus,
    text: "Pay only when you're satisfied",
  },
];

export function FinalCta() {
  return (
    <section className="border-t border-gray-200 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* top row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Get more done with Wysa
          </h2>
          <Button
            size="lg"
            className="shrink-0 rounded-md bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800"
            render={<Link href="/signup" />}
          >
            Join now
          </Button>
        </div>

        <hr className="my-8 border-gray-200" />

        {/* perks row */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {perks.map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col gap-3">
              <Icon className="size-8 text-gray-700 stroke-[1.5]" />
              <p className="text-sm text-gray-600 leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
