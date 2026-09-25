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
    title: "Build your profile",
    description: "Tell us who you are, where you're based, and what you're comfortable helping with.",
  },
  {
    number: "02",
    title: "Set your availability",
    description: "Choose the tasks and times that work for you. No fixed schedule required.",
  },
  {
    number: "03",
    title: "Get booked and earn",
    description: "Once approved, people nearby can book you directly. Get paid per task.",
  },
] as const;

export const whyWysaCards = [
  {
    title: "Flexible",
    description: "Work when you want. No fixed hours.",
  },
  {
    title: "Local",
    description: "Meet people in your neighbourhood.",
  },
  {
    title: "Social",
    description: "Build connections while earning.",
  },
  {
    title: "Paid",
    description: "Turn free time into real income.",
  },
] as const;

export const whoCanApply = [
  "College students",
  "Young professionals",
  "Freelancers",
  "Anyone with free time",
  "Local guides",
  "Friendly, responsible adults",
] as const;
