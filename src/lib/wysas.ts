import { mangaloreAreas } from "@/lib/content";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type WysaProfileRow = Database["public"]["Tables"]["wysa_profiles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const discoveryActivities = [
  "Hangout",
  "Walk",
  "Food & Restaurants",
  "Movies",
  "Events",
  "Shopping",
  "Local Exploration",
  "Travel",
  "Hospital/Appointment Companion",
  "Elder Assistance",
  "Errands",
  "Study",
  "Gaming",
  "Sports",
  "Photography",
  "Tech Help",
  "General Assistance",
] as const;

export type DiscoveryActivity = (typeof discoveryActivities)[number];

export const discoveryLocations = ["All Mangalore", ...mangaloreAreas] as const;

export const languageOptions = [
  "Kannada",
  "English",
  "Hindi",
  "Tulu",
  "Malayalam",
  "Tamil",
] as const;

export const interestOptions = [
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
  "Local Exploration",
] as const;

export const durationOptions = ["1 hour", "2 hours", "3 hours", "4+ hours"] as const;

export const priceRanges = [
  { id: "200-400", label: "₹200–₹400/hr", min: 200, max: 400 },
  { id: "400-600", label: "₹400–₹600/hr", min: 400, max: 600 },
  { id: "600-1000", label: "₹600–₹1,000/hr", min: 600, max: 1000 },
  { id: "1000-plus", label: "₹1,000+/hr", min: 1000, max: Infinity },
] as const;

export const sortOptions = [
  "Recommended",
  "Rating",
  "Price: Low to High",
  "Price: High to Low",
  "Distance",
  "Most Booked",
] as const;

export type SortOption = (typeof sortOptions)[number];

export const exampleSearches = [
  "Someone to watch a movie with",
  "Go for a beach walk",
  "Explore Mangalore",
  "Need someone for shopping",
  "Companion for an event",
  "Help my parent with an appointment",
];

// Activities offered specifically inside the booking flow (Step 1).
export const bookingActivities = [
  "Hangout",
  "Walk",
  "Food",
  "Movies",
  "Events",
  "Shopping",
  "Local Exploration",
  "Elder Assistance",
  "Hospital/Appointment Companion",
  "Errands",
  "Study",
  "Gaming",
  "Sports",
  "Photography",
  "Tech Help",
  "General Assistance",
] as const;

export type BookingActivity = (typeof bookingActivities)[number];

export const bookingDurations = [
  { id: "1", label: "1 hour", hours: 1 },
  { id: "2", label: "2 hours", hours: 2 },
  { id: "3", label: "3 hours", hours: 3 },
  { id: "4", label: "4 hours", hours: 4 },
  { id: "custom", label: "Custom", hours: null },
] as const;

export const bookingLocations = ["Mangalore", ...mangaloreAreas] as const;

export const whoForOptions = [
  "Me",
  "Parent",
  "Grandparent",
  "Family member",
  "Friend",
] as const;

export type WhoFor = (typeof whoForOptions)[number];

export const platformFee = 50;

export type WeeklyAvailabilitySlot = {
  day: string;
  hours: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
};

export type Wysa = {
  id: string;
  name: string;
  area: string;
  rating: number;
  sessions: number;
  verified: boolean;
  languages: string[];
  interests: string[];
  activities: DiscoveryActivity[];
  skills: string[];
  pricePerHour: number;
  availability: string;
  availabilityNote: string;
  bio: string;
  gradient: string;
  distanceKm: number;
  weeklyAvailability: WeeklyAvailabilitySlot[];
  reviews: Review[];
};

export const wysas: Wysa[] = [
  {
    id: "arjun",
    name: "Arjun",
    area: "Kadri",
    rating: 4.9,
    sessions: 120,
    verified: true,
    languages: ["Kannada", "English", "Hindi"],
    interests: ["Movies", "Gaming", "Food", "Beaches", "Photography"],
    activities: ["Movies", "Gaming", "Hangout", "Food & Restaurants"],
    skills: [
      "Local navigation",
      "Photography",
      "Basic tech help",
      "Event accompaniment",
    ],
    pricePerHour: 399,
    availability: "Available today",
    availabilityNote: "Usually available evenings",
    bio: "Hey! I'm Arjun. I enjoy exploring Mangalore, movies, gaming and trying new food spots. I like meeting new people and helping them have a good time around the city.",
    gradient: "from-coral to-pink-400",
    distanceKm: 1.2,
    weeklyAvailability: [
      { day: "MON", hours: "5 PM – 9 PM" },
      { day: "TUE", hours: "5 PM – 9 PM" },
      { day: "WED", hours: "Unavailable" },
      { day: "THU", hours: "5 PM – 10 PM" },
      { day: "FRI", hours: "4 PM – 11 PM" },
      { day: "SAT", hours: "10 AM – 11 PM" },
      { day: "SUN", hours: "10 AM – 8 PM" },
    ],
    reviews: [
      {
        id: "arjun-r1",
        author: "Rahul",
        rating: 5,
        text: "Arjun was punctual and really easy to talk to. We explored Panambur and had a great time.",
      },
      {
        id: "arjun-r2",
        author: "Divya",
        rating: 5,
        text: "Great company for a movie night, knew exactly which show to pick and showed up right on time.",
      },
      {
        id: "arjun-r3",
        author: "Meera",
        rating: 4,
        text: "Fun to game with and easy going. Would book again for a casual hangout.",
      },
    ],
  },
  {
    id: "ananya",
    name: "Ananya",
    area: "Bejai",
    rating: 4.8,
    sessions: 86,
    verified: true,
    languages: ["Kannada", "English"],
    interests: ["Shopping", "Food", "Photography"],
    activities: ["Shopping", "Food & Restaurants", "Photography"],
    skills: [
      "Local navigation",
      "Restaurant recommendations",
      "Photography",
      "Shopping assistance",
    ],
    pricePerHour: 449,
    availability: "Available this evening",
    availabilityNote: "Usually available evenings",
    bio: "Hi, I'm Ananya! I know every good cafe and market corner in Bejai. Happy to tag along for a shopping trip, a food crawl, or just a relaxed walk around the neighbourhood.",
    gradient: "from-sun to-coral",
    distanceKm: 2.8,
    weeklyAvailability: [
      { day: "MON", hours: "6 PM – 9 PM" },
      { day: "TUE", hours: "6 PM – 9 PM" },
      { day: "WED", hours: "6 PM – 9 PM" },
      { day: "THU", hours: "Unavailable" },
      { day: "FRI", hours: "5 PM – 10 PM" },
      { day: "SAT", hours: "11 AM – 10 PM" },
      { day: "SUN", hours: "11 AM – 6 PM" },
    ],
    reviews: [
      {
        id: "ananya-r1",
        author: "Priya",
        rating: 5,
        text: "Very helpful during shopping and knew the area really well.",
      },
      {
        id: "ananya-r2",
        author: "Karthik",
        rating: 5,
        text: "Great eye for photos and picked a lovely little cafe I'd never have found on my own.",
      },
    ],
  },
  {
    id: "rahul",
    name: "Rahul",
    area: "Surathkal",
    rating: 4.7,
    sessions: 64,
    verified: true,
    languages: ["Kannada", "English", "Tulu"],
    interests: ["Sports", "Fitness", "Gaming"],
    activities: ["Sports", "Gaming", "Hangout"],
    skills: ["Fitness coaching tips", "Gaming strategy", "Local navigation"],
    pricePerHour: 349,
    availability: "Available weekends",
    availabilityNote: "Usually free on weekends",
    bio: "Into football, badminton, and the occasional gaming marathon. Always up for a casual match or just kicking back with some good conversation.",
    gradient: "from-teal to-emerald-400",
    distanceKm: 5.4,
    weeklyAvailability: [
      { day: "MON", hours: "Unavailable" },
      { day: "TUE", hours: "Unavailable" },
      { day: "WED", hours: "Unavailable" },
      { day: "THU", hours: "Unavailable" },
      { day: "FRI", hours: "6 PM – 9 PM" },
      { day: "SAT", hours: "9 AM – 9 PM" },
      { day: "SUN", hours: "9 AM – 9 PM" },
    ],
    reviews: [
      {
        id: "rahul-r1",
        author: "Suhas",
        rating: 5,
        text: "Solid badminton partner, very punctual and easy to coordinate with.",
      },
      {
        id: "rahul-r2",
        author: "Aditya",
        rating: 4,
        text: "Fun gaming session, good energy throughout.",
      },
    ],
  },
  {
    id: "divya",
    name: "Divya",
    area: "Kankanady",
    rating: 4.9,
    sessions: 145,
    verified: true,
    languages: ["Kannada", "English", "Hindi", "Tulu"],
    interests: ["Study", "Music", "Movies"],
    activities: ["Study", "Movies", "Local Exploration"],
    skills: ["Study support", "Local navigation", "Event accompaniment"],
    pricePerHour: 429,
    availability: "Available today",
    availabilityNote: "Usually available weekday evenings",
    bio: "Focused study partner who also loves discovering new corners of the city between breaks. Patient, punctual, and happy to help you stay on track.",
    gradient: "from-primary to-orange-400",
    distanceKm: 3.1,
    weeklyAvailability: [
      { day: "MON", hours: "4 PM – 8 PM" },
      { day: "TUE", hours: "4 PM – 8 PM" },
      { day: "WED", hours: "4 PM – 8 PM" },
      { day: "THU", hours: "4 PM – 8 PM" },
      { day: "FRI", hours: "Unavailable" },
      { day: "SAT", hours: "10 AM – 6 PM" },
      { day: "SUN", hours: "Unavailable" },
    ],
    reviews: [
      {
        id: "divya-r1",
        author: "Sneha",
        rating: 5,
        text: "Kept me focused before my exam and gave great tips. Would recommend.",
      },
      {
        id: "divya-r2",
        author: "Kavya",
        rating: 5,
        text: "Really friendly and knew a lovely quiet cafe to study in.",
      },
    ],
  },
  {
    id: "karthik",
    name: "Karthik",
    area: "Panambur",
    rating: 4.6,
    sessions: 52,
    verified: true,
    languages: ["Kannada", "English"],
    interests: ["Beaches", "Photography", "Travel"],
    activities: ["Local Exploration", "Photography", "Walk"],
    skills: ["Photography", "Local navigation", "Beach safety awareness"],
    pricePerHour: 379,
    availability: "Available now",
    availabilityNote: "Usually available mornings",
    bio: "Beach mornings and sunset walks are my thing. I can also point out the best photo spots near Panambur and the quieter corners tourists usually miss.",
    gradient: "from-teal to-sky-400",
    distanceKm: 0.8,
    weeklyAvailability: [
      { day: "MON", hours: "6 AM – 9 AM" },
      { day: "TUE", hours: "6 AM – 9 AM" },
      { day: "WED", hours: "6 AM – 9 AM" },
      { day: "THU", hours: "6 AM – 9 AM" },
      { day: "FRI", hours: "6 AM – 9 AM" },
      { day: "SAT", hours: "6 AM – 12 PM" },
      { day: "SUN", hours: "6 AM – 12 PM" },
    ],
    reviews: [
      {
        id: "karthik-r1",
        author: "Nikhita",
        rating: 5,
        text: "Beautiful sunrise walk, Karthik knew all the best photo angles.",
      },
      {
        id: "karthik-r2",
        author: "Vikram",
        rating: 4,
        text: "Relaxed and easy company for an early beach walk.",
      },
    ],
  },
  {
    id: "meera",
    name: "Meera",
    area: "Hampankatta",
    rating: 4.8,
    sessions: 98,
    verified: true,
    languages: ["Kannada", "English", "Hindi", "Malayalam"],
    interests: ["Shopping", "Food", "Movies"],
    activities: ["Shopping", "Food & Restaurants", "Movies", "Events"],
    skills: [
      "Local navigation",
      "Restaurant recommendations",
      "Event accompaniment",
    ],
    pricePerHour: 459,
    availability: "Available today",
    availabilityNote: "Usually available afternoons and evenings",
    bio: "Your go-to companion for shopping trips, movie nights, and city events around Hampankatta. I like keeping plans relaxed and fun.",
    gradient: "from-coral to-purple-400",
    distanceKm: 2.1,
    weeklyAvailability: [
      { day: "MON", hours: "2 PM – 8 PM" },
      { day: "TUE", hours: "2 PM – 8 PM" },
      { day: "WED", hours: "Unavailable" },
      { day: "THU", hours: "2 PM – 8 PM" },
      { day: "FRI", hours: "2 PM – 9 PM" },
      { day: "SAT", hours: "11 AM – 9 PM" },
      { day: "SUN", hours: "11 AM – 7 PM" },
    ],
    reviews: [
      {
        id: "meera-r1",
        author: "Farhan",
        rating: 5,
        text: "Great movie recommendation and easy to talk to before the show.",
      },
      {
        id: "meera-r2",
        author: "Rohan",
        rating: 5,
        text: "Helped me pick out gifts quickly, knew exactly which stores to check.",
      },
    ],
  },
  {
    id: "suhas",
    name: "Suhas",
    area: "Kottara",
    rating: 4.5,
    sessions: 34,
    verified: false,
    languages: ["Kannada", "English"],
    interests: ["Technology", "Gaming"],
    activities: ["Tech Help", "Gaming", "General Assistance"],
    skills: ["Basic tech help", "Gaming strategy"],
    pricePerHour: 299,
    availability: "Available tomorrow",
    availabilityNote: "Usually available weekday evenings",
    bio: "Quick with phone and laptop troubleshooting, and always down for a gaming session. New to WYSA but happy to help however I can.",
    gradient: "from-teal to-cyan-400",
    distanceKm: 4.5,
    weeklyAvailability: [
      { day: "MON", hours: "6 PM – 9 PM" },
      { day: "TUE", hours: "6 PM – 9 PM" },
      { day: "WED", hours: "6 PM – 9 PM" },
      { day: "THU", hours: "Unavailable" },
      { day: "FRI", hours: "6 PM – 9 PM" },
      { day: "SAT", hours: "Unavailable" },
      { day: "SUN", hours: "12 PM – 6 PM" },
    ],
    reviews: [
      {
        id: "suhas-r1",
        author: "Lakshmi",
        rating: 4,
        text: "Sorted out my laptop issue quickly and explained things patiently.",
      },
      {
        id: "suhas-r2",
        author: "Farhan",
        rating: 5,
        text: "Good gaming partner, showed up on time and easy to chat with.",
      },
    ],
  },
  {
    id: "priya",
    name: "Priya",
    area: "Tannirbhavi",
    rating: 4.9,
    sessions: 112,
    verified: true,
    languages: ["Kannada", "English", "Hindi"],
    interests: ["Beaches", "Fitness", "Music"],
    activities: ["Walk", "Local Exploration", "Sports"],
    skills: ["Beach safety awareness", "Fitness coaching tips", "Local navigation"],
    pricePerHour: 419,
    availability: "Available this weekend",
    availabilityNote: "Usually free on weekend mornings",
    bio: "Long shoreline walks, light workouts, and good conversation. Tannirbhavi is my home turf and I love showing people around it.",
    gradient: "from-sun to-orange-400",
    distanceKm: 6.0,
    weeklyAvailability: [
      { day: "MON", hours: "Unavailable" },
      { day: "TUE", hours: "Unavailable" },
      { day: "WED", hours: "6 PM – 8 PM" },
      { day: "THU", hours: "Unavailable" },
      { day: "FRI", hours: "6 PM – 8 PM" },
      { day: "SAT", hours: "7 AM – 12 PM" },
      { day: "SUN", hours: "7 AM – 12 PM" },
    ],
    reviews: [
      {
        id: "priya-r1",
        author: "Ananya",
        rating: 5,
        text: "Lovely calm walk along the beach, Priya was great company.",
      },
      {
        id: "priya-r2",
        author: "Divya",
        rating: 5,
        text: "Motivating for a light morning workout, very friendly.",
      },
    ],
  },
  {
    id: "vikram",
    name: "Vikram",
    area: "Someshwar",
    rating: 4.7,
    sessions: 77,
    verified: true,
    languages: ["Kannada", "English", "Hindi", "Tulu"],
    interests: ["Travel", "Photography", "Beaches"],
    activities: ["Local Exploration", "Photography", "Travel"],
    skills: ["Local navigation", "Photography", "Event accompaniment"],
    pricePerHour: 389,
    availability: "Available today",
    availabilityNote: "Usually available afternoons",
    bio: "I love showing people the rocky coastline and quieter spots around Someshwar that most visitors miss.",
    gradient: "from-primary to-coral",
    distanceKm: 5.7,
    weeklyAvailability: [
      { day: "MON", hours: "1 PM – 6 PM" },
      { day: "TUE", hours: "1 PM – 6 PM" },
      { day: "WED", hours: "1 PM – 6 PM" },
      { day: "THU", hours: "Unavailable" },
      { day: "FRI", hours: "1 PM – 6 PM" },
      { day: "SAT", hours: "9 AM – 6 PM" },
      { day: "SUN", hours: "9 AM – 6 PM" },
    ],
    reviews: [
      {
        id: "vikram-r1",
        author: "Karthik",
        rating: 5,
        text: "Took me to a viewpoint I'd never have found on my own, great host.",
      },
      {
        id: "vikram-r2",
        author: "Meera",
        rating: 4,
        text: "Relaxed pace and very knowledgeable about the coastline.",
      },
    ],
  },
  {
    id: "sneha",
    name: "Sneha",
    area: "Kadri",
    rating: 4.8,
    sessions: 90,
    verified: true,
    languages: ["Kannada", "English", "Hindi"],
    interests: ["Study", "Technology", "Music"],
    activities: ["Study", "Tech Help", "General Assistance"],
    skills: ["Study support", "Basic tech help"],
    pricePerHour: 409,
    availability: "Available now",
    availabilityNote: "Flexible most days",
    bio: "Patient with tech questions and a solid study partner for exam season. Generally flexible on timing.",
    gradient: "from-teal to-emerald-400",
    distanceKm: 1.6,
    weeklyAvailability: [
      { day: "MON", hours: "10 AM – 7 PM" },
      { day: "TUE", hours: "10 AM – 7 PM" },
      { day: "WED", hours: "10 AM – 7 PM" },
      { day: "THU", hours: "10 AM – 7 PM" },
      { day: "FRI", hours: "10 AM – 7 PM" },
      { day: "SAT", hours: "Unavailable" },
      { day: "SUN", hours: "10 AM – 2 PM" },
    ],
    reviews: [
      {
        id: "sneha-r1",
        author: "Divya",
        rating: 5,
        text: "Really patient and explained things clearly, great for exam prep.",
      },
      {
        id: "sneha-r2",
        author: "Suhas",
        rating: 5,
        text: "Helped me set up a new laptop without any fuss.",
      },
    ],
  },
  {
    id: "rohan",
    name: "Rohan",
    area: "Bejai",
    rating: 4.6,
    sessions: 41,
    verified: true,
    languages: ["Kannada", "English"],
    interests: ["Sports", "Gaming", "Fitness"],
    activities: ["Sports", "Gaming", "Hangout"],
    skills: ["Fitness coaching tips", "Gaming strategy"],
    pricePerHour: 339,
    availability: "Available evenings",
    availabilityNote: "Usually available weekday evenings",
    bio: "Casual sports and gaming buddy, mostly free on weekday evenings. Easy going and up for most things.",
    gradient: "from-coral to-red-400",
    distanceKm: 2.4,
    weeklyAvailability: [
      { day: "MON", hours: "6 PM – 9 PM" },
      { day: "TUE", hours: "6 PM – 9 PM" },
      { day: "WED", hours: "6 PM – 9 PM" },
      { day: "THU", hours: "6 PM – 9 PM" },
      { day: "FRI", hours: "6 PM – 10 PM" },
      { day: "SAT", hours: "Unavailable" },
      { day: "SUN", hours: "Unavailable" },
    ],
    reviews: [
      {
        id: "rohan-r1",
        author: "Rahul",
        rating: 5,
        text: "Good football session, showed up on time and easy to play with.",
      },
      {
        id: "rohan-r2",
        author: "Aditya",
        rating: 4,
        text: "Chill gaming evening, would book again.",
      },
    ],
  },
  {
    id: "lakshmi",
    name: "Lakshmi",
    area: "Kankanady",
    rating: 4.9,
    sessions: 168,
    verified: true,
    languages: ["Kannada", "English", "Tamil", "Hindi"],
    interests: ["Food", "Music", "Local Exploration"],
    activities: ["Elder Assistance", "Hospital/Appointment Companion", "Errands"],
    skills: [
      "Elder care assistance",
      "Local navigation",
      "Public transport guidance",
    ],
    pricePerHour: 449,
    availability: "Available today",
    availabilityNote: "Usually available on weekday mornings",
    bio: "I love helping elderly parents with errands, hospital visits, and appointments. Patient, punctual, and easy to reach.",
    gradient: "from-sun to-amber-400",
    distanceKm: 3.4,
    weeklyAvailability: [
      { day: "MON", hours: "9 AM – 2 PM" },
      { day: "TUE", hours: "9 AM – 2 PM" },
      { day: "WED", hours: "9 AM – 2 PM" },
      { day: "THU", hours: "9 AM – 2 PM" },
      { day: "FRI", hours: "9 AM – 2 PM" },
      { day: "SAT", hours: "9 AM – 1 PM" },
      { day: "SUN", hours: "Unavailable" },
    ],
    reviews: [
      {
        id: "lakshmi-r1",
        author: "Nikhita",
        rating: 5,
        text: "Took great care accompanying my mother to her appointment. Very reassuring.",
      },
      {
        id: "lakshmi-r2",
        author: "Kavya",
        rating: 5,
        text: "Punctual and patient, made a stressful errand day much easier.",
      },
    ],
  },
  {
    id: "farhan",
    name: "Farhan",
    area: "Surathkal",
    rating: 4.5,
    sessions: 29,
    verified: false,
    languages: ["Kannada", "English", "Hindi"],
    interests: ["Technology", "Gaming", "Movies"],
    activities: ["Tech Help", "Gaming", "Movies"],
    skills: ["Basic tech help", "Gaming strategy"],
    pricePerHour: 319,
    availability: "Available tomorrow",
    availabilityNote: "Usually available evenings",
    bio: "New to WYSA, but well versed in gadgets, gaming, and a good movie recommendation.",
    gradient: "from-primary to-pink-400",
    distanceKm: 5.9,
    weeklyAvailability: [
      { day: "MON", hours: "6 PM – 9 PM" },
      { day: "TUE", hours: "Unavailable" },
      { day: "WED", hours: "6 PM – 9 PM" },
      { day: "THU", hours: "6 PM – 9 PM" },
      { day: "FRI", hours: "6 PM – 10 PM" },
      { day: "SAT", hours: "2 PM – 10 PM" },
      { day: "SUN", hours: "Unavailable" },
    ],
    reviews: [
      {
        id: "farhan-r1",
        author: "Rohan",
        rating: 4,
        text: "Fixed my phone charging issue in minutes, friendly too.",
      },
      {
        id: "farhan-r2",
        author: "Meera",
        rating: 5,
        text: "Good movie pick and easy company before the show.",
      },
    ],
  },
  {
    id: "nikhita",
    name: "Nikhita",
    area: "Hampankatta",
    rating: 4.8,
    sessions: 103,
    verified: true,
    languages: ["Kannada", "English", "Hindi", "Malayalam"],
    interests: ["Shopping", "Fitness", "Photography"],
    activities: ["Shopping", "Photography", "Walk"],
    skills: ["Shopping assistance", "Photography", "Local navigation"],
    pricePerHour: 439,
    availability: "Available today",
    availabilityNote: "Usually available afternoons",
    bio: "Mall runs, market walks, and photo stops in between. I always know the shortest queues and best value stores.",
    gradient: "from-coral to-sun",
    distanceKm: 1.9,
    weeklyAvailability: [
      { day: "MON", hours: "1 PM – 7 PM" },
      { day: "TUE", hours: "1 PM – 7 PM" },
      { day: "WED", hours: "Unavailable" },
      { day: "THU", hours: "1 PM – 7 PM" },
      { day: "FRI", hours: "1 PM – 8 PM" },
      { day: "SAT", hours: "10 AM – 8 PM" },
      { day: "SUN", hours: "10 AM – 6 PM" },
    ],
    reviews: [
      {
        id: "nikhita-r1",
        author: "Lakshmi",
        rating: 5,
        text: "Knew exactly where to find what I needed, saved me so much time.",
      },
      {
        id: "nikhita-r2",
        author: "Karthik",
        rating: 5,
        text: "Great eye for a good photo spot on our walk.",
      },
    ],
  },
  {
    id: "aditya",
    name: "Aditya",
    area: "Panambur",
    rating: 4.7,
    sessions: 58,
    verified: true,
    languages: ["Kannada", "English"],
    interests: ["Beaches", "Sports", "Music"],
    activities: ["Walk", "Sports", "Local Exploration"],
    skills: ["Beach safety awareness", "Fitness coaching tips"],
    pricePerHour: 359,
    availability: "Available now",
    availabilityNote: "Usually available mornings",
    bio: "Early riser for beach walks, usually followed by a casual game of volleyball. Easy to talk to and always on time.",
    gradient: "from-teal to-blue-400",
    distanceKm: 0.6,
    weeklyAvailability: [
      { day: "MON", hours: "6 AM – 9 AM" },
      { day: "TUE", hours: "6 AM – 9 AM" },
      { day: "WED", hours: "6 AM – 9 AM" },
      { day: "THU", hours: "6 AM – 9 AM" },
      { day: "FRI", hours: "6 AM – 9 AM" },
      { day: "SAT", hours: "6 AM – 11 AM" },
      { day: "SUN", hours: "6 AM – 11 AM" },
    ],
    reviews: [
      {
        id: "aditya-r1",
        author: "Priya",
        rating: 5,
        text: "Great volleyball session, very welcoming to beginners.",
      },
      {
        id: "aditya-r2",
        author: "Vikram",
        rating: 4,
        text: "Good pace for a morning walk and friendly conversation.",
      },
    ],
  },
  {
    id: "kavya",
    name: "Kavya",
    area: "Kottara",
    rating: 4.9,
    sessions: 134,
    verified: true,
    languages: ["Kannada", "English", "Hindi", "Tulu"],
    interests: ["Study", "Technology", "Movies"],
    activities: ["Study", "General Assistance", "Errands"],
    skills: ["Study support", "Basic tech help", "Public transport guidance"],
    pricePerHour: 469,
    availability: "Available this week",
    availabilityNote: "Flexible most weekdays",
    bio: "Reliable for errands and study sessions alike. Happy to help wherever an extra hand is useful.",
    gradient: "from-primary to-teal",
    distanceKm: 4.1,
    weeklyAvailability: [
      { day: "MON", hours: "11 AM – 6 PM" },
      { day: "TUE", hours: "11 AM – 6 PM" },
      { day: "WED", hours: "11 AM – 6 PM" },
      { day: "THU", hours: "11 AM – 6 PM" },
      { day: "FRI", hours: "11 AM – 6 PM" },
      { day: "SAT", hours: "Unavailable" },
      { day: "SUN", hours: "Unavailable" },
    ],
    reviews: [
      {
        id: "kavya-r1",
        author: "Sneha",
        rating: 5,
        text: "Super reliable, helped me get through a long errand list quickly.",
      },
      {
        id: "kavya-r2",
        author: "Lakshmi",
        rating: 5,
        text: "Patient and organised, made study prep a lot less stressful.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Real Wysa profile lookups (Supabase-backed). The `wysas` array above is
// legacy demo/seed data from before real auth existed; once a user signs up
// and becomes a Wysa, their profile lives in the `wysa_profiles` table
// instead. New task flows should use `getWysaProfile` below.
// ---------------------------------------------------------------------------

export type RealWysaProfile = {
  id: string;
  name: string;
  area: string;
  bio: string;
  languages: string[];
  interests: string[];
  verified: boolean;
  rating: number;
  sessionsCount: number;
};

/** Looks up a real Wysa's public profile by their auth user id. */
export async function getWysaProfile(userId: string): Promise<RealWysaProfile | null> {
  const supabase = createClient();
  const [{ data: wysaProfile, error: wysaError }, { data: profile }] = await Promise.all([
    supabase
      .from("wysa_profiles")
      .select("id, area, bio, languages, interests, verified, rating, sessions_count")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);

  if (wysaError || !wysaProfile) return null;

  const typedWysaProfile = wysaProfile as Pick<WysaProfileRow, "id" | "area" | "bio" | "languages" | "interests" | "verified" | "rating" | "sessions_count">;
  const typedProfile = profile as Pick<ProfileRow, "full_name"> | null;

  return {
    id: typedWysaProfile.id,
    name: typedProfile?.full_name || "Wysa",
    area: typedWysaProfile.area,
    bio: typedWysaProfile.bio,
    languages: typedWysaProfile.languages,
    interests: typedWysaProfile.interests,
    verified: typedWysaProfile.verified,
    rating: typedWysaProfile.rating,
    sessionsCount: typedWysaProfile.sessions_count,
  };
}
