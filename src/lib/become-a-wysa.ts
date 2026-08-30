// Content specific to the "Become a Wysa" application page.
// Kept separate from src/lib/wysas.ts (which powers discovery/booking)
// so this page can evolve independently without touching booking logic.

export const applicationActivities = [
  "Hangout",
  "Walk",
  "Movies",
  "Food",
  "Events",
  "Shopping",
  "Local exploration",
  "Errands",
  "Study",
  "Gaming",
  "Sports",
  "Photography",
  "Tech help",
  "Elder assistance",
  "Hospital/appointment accompaniment",
] as const;

export const applicationLanguages = [
  "Kannada",
  "English",
  "Hindi",
  "Tulu",
  "Malayalam",
  "Tamil",
] as const;

export const applicationInterests = [
  "Movies",
  "Food",
  "Gaming",
  "Sports",
  "Fitness",
  "Photography",
  "Travel",
  "Music",
  "Technology",
  "Shopping",
  "Study",
  "Beaches",
  "Local exploration",
] as const;

export const howItWorksSteps = [
  {
    number: "01",
    title: "Create your profile",
    description:
      "Tell us who you are, what you're into, and where you're based in Mangalore.",
  },
  {
    number: "02",
    title: "Choose what you can help with",
    description:
      "Pick the activities and everyday tasks you're comfortable helping with.",
  },
  {
    number: "03",
    title: "Get bookings and earn",
    description:
      "Once approved, people nearby can find and book you for plans that fit your schedule.",
  },
] as const;

export const whyWysaCards = [
  {
    title: "Flexible",
    description: "Choose when you're available.",
  },
  {
    title: "Local",
    description: "Start by meeting people around Mangalore.",
  },
  {
    title: "Social",
    description: "Meet new people and share experiences.",
  },
  {
    title: "Earn",
    description: "Turn your free time into extra income.",
  },
] as const;

export const whoCanApply = [
  "College students",
  "Young professionals",
  "Freelancers",
  "People with free time",
  "Local guides",
  "Friendly, responsible people",
] as const;
