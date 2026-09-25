import {
  Users,
  Footprints,
  UtensilsCrossed,
  Clapperboard,
  PartyPopper,
  ShoppingBag,
  Compass,
  Plane,
  Accessibility,
  Stethoscope,
  ListChecks,
  BookOpen,
  Gamepad2,
  Dumbbell,
  Camera,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type Activity = {
  title: string;
  icon: LucideIcon;
  description: string;
};

// Titles here match src/lib/tasks.ts `taskCategories` values exactly so
// homepage cards can deep-link into task creation with a preset category.
export const activities: Activity[] = [
  { title: "Companion", icon: Users, description: "Someone to be there with you" },
  { title: "Hangout", icon: Users, description: "Coffee, chai, or just chill" },
  { title: "Walk", icon: Footprints, description: "A walk around the city" },
  { title: "Movies", icon: Clapperboard, description: "Catch a film together" },
  { title: "Food", icon: UtensilsCrossed, description: "Try somewhere new" },
  { title: "Events", icon: PartyPopper, description: "Concerts, meetups & more" },
  { title: "Shopping", icon: ShoppingBag, description: "Malls and local markets" },
  { title: "Local exploration", icon: Compass, description: "Discover hidden spots" },
  { title: "Travel", icon: Plane, description: "Day trips nearby" },
  { title: "Elder assistance", icon: Accessibility, description: "Support for seniors" },
  { title: "Hospital/appointment accompaniment", icon: Stethoscope, description: "Company for appointments" },
  { title: "Errands", icon: ListChecks, description: "Tick things off the list" },
  { title: "Study", icon: BookOpen, description: "Focused study sessions" },
  { title: "Gaming", icon: Gamepad2, description: "Co-op or casual play" },
  { title: "Sports", icon: Dumbbell, description: "Casual games and fitness" },
  { title: "Photography", icon: Camera, description: "Photo walks and shoots" },
  { title: "Tech help", icon: Wrench, description: "Sort out your devices" },
];

export type LocalSpot = {
  name: string;
  area: string;
  description: string;
  gradient: string;
};

export const localSpots: LocalSpot[] = [
  {
    name: "Panambur Beach",
    area: "Panambur",
    description: "Sunset walks, beach volleyball, and kite-flying weekends.",
    gradient: "from-teal to-sky-400",
  },
  {
    name: "Tannirbhavi",
    area: "Tannirbhavi",
    description: "A quieter shoreline for slow evenings and long chats.",
    gradient: "from-sun to-coral",
  },
  {
    name: "Kadri",
    area: "Kadri",
    description: "Temples, parks, and some of the city's best filter coffee.",
    gradient: "from-coral to-pink-400",
  },
  {
    name: "City Centre",
    area: "Hampankatta",
    description: "Malls, multiplexes, and everything in between.",
    gradient: "from-primary to-orange-400",
  },
  {
    name: "Someshwar",
    area: "Someshwar",
    description: "Rocky shores and a laid-back coastal vibe.",
    gradient: "from-teal to-emerald-400",
  },
];

export const mangaloreAreas = [
  "Kadri",
  "Bejai",
  "Kankanady",
  "Hampankatta",
  "Kottara",
  "Surathkal",
  "Panambur",
  "Tannirbhavi",
  "Someshwar",
];

export const navLinks = [
  { label: "Browse Tasks", href: "/tasks" },
  { label: "Become a Wysa", href: "/become-a-wysa" },
  { label: "Safety", href: "/safety" },
  { label: "Help", href: "#help" },
];
