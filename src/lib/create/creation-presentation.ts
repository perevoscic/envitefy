import type { CreateCategory, CreateGuess } from "./create-intent";

/** Display-only examples. These values never become event or editor data. */
export type CreationPresentation = {
  artwork: string | null;
  description: string;
  previewHeading: string;
  previewCategory: string;
  previewTitle: string;
  previewDetails: string;
  previewAction: string;
  previewLinks: readonly string[];
};

type CategoryPresentation = Pick<
  CreationPresentation,
  "artwork" | "description" | "previewHeading" | "previewCategory" | "previewTitle"
>;

const categories: Record<Exclude<CreateCategory, "sports">, CategoryPresentation> = {
  birthdays: {
    artwork: "/images/marketing/use-case-birthday.webp",
    description: "Parties, milestones & birthday celebrations",
    previewHeading: "A beautiful page for their big day.",
    previewCategory: "Birthday · Let's celebrate",
    previewTitle: "A Birthday to Remember",
  },
  weddings: {
    artwork: "/images/landing/hero/galleries/weddings-hero-2.webp",
    description: "Ceremonies, receptions & wedding weekends",
    previewHeading: "Every detail of your day, together.",
    previewCategory: "Wedding · Together with you",
    previewTitle: "Our Wedding Celebration",
  },
  anniversaries: {
    artwork: "/studio/anniversary.webp",
    description: "Milestones, vow renewals & celebrations",
    previewHeading: "A beautiful way to celebrate your story.",
    previewCategory: "Anniversary · Our next chapter",
    previewTitle: "A Lifetime of Love",
  },
  "baby-showers": {
    artwork: "/images/landing/hero/galleries/baby-hero-2.webp",
    description: "Showers, sprinkles & a new arrival",
    previewHeading: "A sweet beginning, beautifully shared.",
    previewCategory: "Baby shower · A little celebration",
    previewTitle: "Oh, Baby!",
  },
  "bridal-showers": {
    artwork: "/images/landing/hero/galleries/bridal-hero-2.webp",
    description: "Bridal brunches, showers & celebrations",
    previewHeading: "Bring everyone together for the bride.",
    previewCategory: "Bridal shower · Love is in bloom",
    previewTitle: "A Toast to the Bride",
  },
  "gender-reveal": {
    artwork: "/images/landing/gender-reveal/gender-reveal-editorial-celebration.webp",
    description: "A joyful reveal with family & friends",
    previewHeading: "Make your big reveal feel special.",
    previewCategory: "Gender reveal · A happy surprise",
    previewTitle: "A Little One, a Big Surprise",
  },
  appointments: {
    artwork: null,
    description: "Personal appointments & calendar reminders",
    previewHeading: "Keep your next appointment organized.",
    previewCategory: "Appointment · Your details together",
    previewTitle: "Your Next Appointment",
  },
  "medical-appointments": {
    artwork: null,
    description: "Care visits, appointment details & reminders",
    previewHeading: "Keep your appointment details together.",
    previewCategory: "Medical appointment · Stay organized",
    previewTitle: "Your Upcoming Visit",
  },
  graduations: {
    artwork: "/templates/signup/photographic/parties-and-events/graduation-party.webp",
    description: "Graduation parties & new beginnings",
    previewHeading: "Celebrate the start of a new chapter.",
    previewCategory: "Graduation · The next chapter",
    previewTitle: "Here's to What's Next",
  },
  housewarming: {
    artwork: "/studio/housewarming.webp",
    description: "New homes, good company & warm welcomes",
    previewHeading: "A warm welcome starts right here.",
    previewCategory: "Housewarming · Make yourself at home",
    previewTitle: "Welcome to Our New Home",
  },
  "open-house": {
    artwork: "/images/landing/template-proof/maple-loft-open-house.webp",
    description: "Open houses, tours & drop-in gatherings",
    previewHeading: "Open the door to your next event.",
    previewCategory: "Open house · Come take a look",
    previewTitle: "You're Invited Inside",
  },
  "religious-events": {
    artwork: "/templates/signup/photographic/church-and-community/church-gathering.webp",
    description: "Meaningful celebrations & community gatherings",
    previewHeading: "Bring your community together.",
    previewCategory: "Religious celebration · Gather together",
    previewTitle: "A Day of Celebration",
  },
  workshops: {
    artwork: "/templates/signup/photographic/business-and-professional/workshop.webp",
    description: "Workshops, classes & creative sessions",
    previewHeading: "Make room for something inspiring.",
    previewCategory: "Workshop · Learn something new",
    previewTitle: "The Creative Workshop",
  },
  "special-events": {
    artwork: "/images/studio/invite-hero-gala.webp",
    description: "Special occasions & memorable gatherings",
    previewHeading: "Give your occasion a place to shine.",
    previewCategory: "Special event · An occasion to remember",
    previewTitle: "An Evening Together",
  },
  "signup-forms": {
    artwork: "/images/landing/signup-forms/signup-editorial-coordination.webp",
    description: "Volunteers, shifts, items & group plans",
    previewHeading: "Bring your plans and people together.",
    previewCategory: "Sign-up form · Everyone has a part",
    previewTitle: "Let's Make It Happen",
  },
  general: {
    artwork: "/templates/signup/photographic/general/monthly-meetup.webp",
    description: "Gatherings, meetups & everything in between",
    previewHeading: "Your next gathering starts here.",
    previewCategory: "General event · Good company",
    previewTitle: "Let's Get Together",
  },
};

type SportPresentation = {
  label: string;
  artwork: string | null;
  description: string;
  title: string;
  format: "meet" | "game" | "tournament" | "performance";
};

const sports: Record<string, SportPresentation> = {
  gymnastics: {
    label: "Gymnastics",
    artwork: "/images/landing/hero/galleries/gymnastics-hero-1.webp",
    description: "Meets, schedules & team events",
    title: "Spring Invitational",
    format: "meet",
  },
  football: {
    label: "Football",
    artwork: "/images/landing/football/stadium-lights.webp",
    description: "Games, practices & season schedules",
    title: "Friday Night Football",
    format: "game",
  },
  basketball: {
    label: "Basketball",
    artwork: "/images/landing/sports/sports-editorial-basketball.webp",
    description: "Games, tournaments & season schedules",
    title: "Game Night on the Court",
    format: "game",
  },
  baseball: {
    label: "Baseball",
    artwork: "/images/landing/sports/sports-editorial-baseball.webp",
    description: "Games, tournaments & team schedules",
    title: "A Day at the Ballpark",
    format: "game",
  },
  softball: {
    label: "Softball",
    artwork: "/templates/signup/photographic/sports-and-recreation/baseball-team.webp",
    description: "Games, tournaments & team schedules",
    title: "Spring Softball Classic",
    format: "tournament",
  },
  soccer: {
    label: "Soccer",
    artwork: "/templates/signup/photographic/sports-and-recreation/soccer-game.webp",
    description: "Matches, tournaments & team schedules",
    title: "Matchday Together",
    format: "game",
  },
  volleyball: {
    label: "Volleyball",
    artwork: "/templates/signup/photographic/health-and-fitness/volleyball-league.webp",
    description: "Matches, courts & tournament schedules",
    title: "Spring Volleyball Classic",
    format: "tournament",
  },
  hockey: {
    label: "Hockey",
    artwork: null,
    description: "Games, rink details & team schedules",
    title: "Hockey Night Together",
    format: "game",
  },
  lacrosse: {
    label: "Lacrosse",
    artwork: null,
    description: "Games, practices & team schedules",
    title: "Lacrosse Game Day",
    format: "game",
  },
  tennis: {
    label: "Tennis",
    artwork: "/templates/signup/photographic/health-and-fitness/tennis-club.webp",
    description: "Matches, court details & tournaments",
    title: "Spring Tennis Open",
    format: "tournament",
  },
  "track-field": {
    label: "Track & Field",
    artwork: "/templates/signup/photographic/sports-and-recreation/track-meet.webp",
    description: "Meets, heats & event schedules",
    title: "Spring Track Invitational",
    format: "meet",
  },
  swimming: {
    label: "Swimming",
    artwork: "/templates/signup/photographic/sports-and-recreation/swim-team.webp",
    description: "Meets, heats & team information",
    title: "Spring Swim Invitational",
    format: "meet",
  },
  wrestling: {
    label: "Wrestling",
    artwork: null,
    description: "Meets, brackets & team information",
    title: "Spring Wrestling Invitational",
    format: "meet",
  },
  cheerleading: {
    label: "Cheerleading",
    artwork: "/templates/signup/photographic/sports-and-recreation/cheer-squad.webp",
    description: "Competitions, performances & team events",
    title: "Spring Cheer Showcase",
    format: "performance",
  },
  dance: {
    label: "Dance",
    artwork: "/templates/signup/photographic/health-and-fitness/dance-class.webp",
    description: "Recitals, competitions & performances",
    title: "The Spring Dance Showcase",
    format: "performance",
  },
};

/** Call only for an event type already filtered by account access and preferences. */
export function getCreationPresentation(guess: CreateGuess): CreationPresentation {
  if (guess.category === "sports") {
    const sport = guess.sport ? sports[guess.sport] : undefined;
    const label = sport?.label || "Sports";
    const format = sport?.format || "game";
    return {
      artwork: sport?.artwork || null,
      description: sport?.description || "Schedules, venues & team events",
      previewHeading:
        format === "meet"
          ? "A great page for your next meet."
          : format === "performance"
            ? "A beautiful page for your next performance."
            : format === "tournament"
              ? "Every detail of your next tournament."
              : "A great page for your next game.",
      previewCategory: `${label} · ${format === "performance" ? "Showtime" : format === "meet" ? "Meet day" : "Game day"}`,
      previewTitle: sport?.title || "The Next Team Event",
      previewDetails: "Schedules, venue details & arrival information",
      previewAction: format === "meet" ? "View meet details" : "View event details",
      previewLinks: ["Schedule", "Venue", "Info"],
    };
  }

  return {
    ...categories[guess.category],
    previewDetails:
      guess.category === "signup-forms"
        ? "Open spots, helpful details & a place for everyone"
        : "All the details, together in one beautiful place",
    previewAction:
      guess.category === "signup-forms" ? "View available spots" : "View event details",
    previewLinks:
      guess.category === "signup-forms"
        ? ["Sign up", "Details", "Info"]
        : ["Details", "Location", "Info"],
  };
}
