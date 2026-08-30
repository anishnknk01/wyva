import type { Metadata } from "next";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Activities } from "@/components/sections/activities";
import { ExploreMangalore } from "@/components/sections/explore-mangalore";
import { Trust } from "@/components/sections/trust";
import { FinalCta } from "@/components/sections/final-cta";

export const metadata: Metadata = {
  title: "WYSA — Find your vibe.",
  description:
    "WYSA is a Mangalore-based companion and everyday-assistance platform. Find a verified Wysa nearby for hangouts, errands, exploring the city, elder assistance, and more.",
};

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Activities />
        <ExploreMangalore />
        <Trust />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
