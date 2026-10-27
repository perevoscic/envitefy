import { landingCategoryMedia } from "@/lib/landing-category-media";

export type EditorialCategory =
  | "weddings"
  | "birthdays"
  | "baby-showers"
  | "bridal-showers"
  | "gender-reveal"
  | "signup-forms"
  | "anniversaries"
  | "sports"
  | "football";

type CategoryTheme = {
  photo: { src: string; alt: string; objectPosition?: string };
  lead: string;
  details: readonly [string, string, string];
  previewLabel: string;
  previewTitle: string;
  previewDescription: string;
  artwork?: { src: string; alt: string };
};

/** Original category photography and artwork; no stock requests or carousel downloads. */
export const categoryLandingThemes: Record<EditorialCategory, CategoryTheme> = {
  weddings: {
    photo: landingCategoryMedia.weddings,
    lead: "Every detail. Beautifully together.",
    details: ["The invitation", "The guest list", "The whole day"],
    previewLabel: "A place for your people",
    previewTitle: "From the first yes to the last dance.",
    previewDescription:
      "Give your guests one place for the celebration, their reply, and the details that make arriving a little easier.",
  },
  birthdays: {
    photo: landingCategoryMedia.birthdays,
    lead: "Big wishes. Little details, sorted.",
    details: ["Party invitations", "Household RSVPs", "Directions & details"],
    previewLabel: "The party, in one place",
    previewTitle: "More candles. Fewer loose ends.",
    previewDescription:
      "A party page brings the invitation, guest replies and arrival details together, so the celebration gets your attention.",
  },
  "baby-showers": {
    photo: landingCategoryMedia["baby-showers"],
    lead: "A little welcome. A lot of love.",
    details: ["Shower invitations", "Registry links", "Guest replies"],
    previewLabel: "A thoughtful little welcome",
    previewTitle: "All the love. All the details.",
    previewDescription:
      "Keep the shower invitation, registry and guest replies together in a welcoming page for your newest chapter.",
  },
  "bridal-showers": {
    photo: landingCategoryMedia["bridal-showers"],
    lead: "Gather your favorite people.",
    details: ["Brunch & afternoon tea", "RSVPs & registries", "One lovely link"],
    previewLabel: "A toast to the bride",
    previewTitle: "The welcome before the wedding.",
    previewDescription:
      "Give your guests the invitation, their RSVP, registry links and arrival details in one thoughtful place.",
  },
  "gender-reveal": {
    photo: landingCategoryMedia["gender-reveal"],
    lead: "One sweet secret. Everyone together.",
    details: ["Reveal invitations", "Guest replies", "Team Pink or Blue"],
    previewLabel: "Bring everyone into the moment",
    previewTitle: "The surprise is yours. The plan is shared.",
    previewDescription:
      "Gather guest replies and Team Pink or Team Blue guesses beside the time, place and details for your reveal.",
  },
  "signup-forms": {
    photo: landingCategoryMedia["signup-forms"],
    lead: "Good people. A clear place to help.",
    details: ["Potlucks & supplies", "Volunteer shifts", "Places & quantities"],
    previewLabel: "A little coordination goes a long way",
    previewTitle: "Turn “I can help” into a plan.",
    previewDescription:
      "Give every dish, shift and helping hand a place. Guests choose their spot from the same shared signup page.",
    artwork: {
      src: "/templates/signup/fundraising-and-food/potluck-dinner.webp",
      alt: "Illustrated neighborhood potluck sign-up artwork",
    },
  },
  anniversaries: {
    photo: {
      src: "/images/landing/template-proof/generated/anniversary-party.webp",
      alt: "A candlelit garden dinner set for an anniversary celebration",
      objectPosition: "65% center",
    },
    lead: "Another chapter. The same favorite people.",
    details: ["Milestones & memories", "Celebration details", "Guest replies"],
    previewLabel: "A story worth gathering for",
    previewTitle: "Make room for another memory.",
    previewDescription:
      "Bring your names, favorite memories and celebration details together with a place for your guests to reply.",
  },
  sports: {
    photo: landingCategoryMedia.sports,
    lead: "Less organizing. More game time.",
    details: ["Every matchup", "Fields & venues", "Team attendance"],
    previewLabel: "The plan before the game",
    previewTitle: "Everyone knows where to be.",
    previewDescription:
      "Bring the start time, venue and team notes into one page that families can check before heading out.",
    artwork: {
      src: "/images/landing/sports/sports-editorial-basketball.webp",
      alt: "Basketball players on an indoor court",
    },
  },
  football: {
    photo: {
      src: "/images/landing/football/friday-night-team.webp",
      alt: "A football team gathered on the sideline beneath stadium lights",
      objectPosition: "center",
    },
    lead: "Every Friday. Everyone together.",
    details: ["Season schedules", "Home & away venues", "Players & families"],
    previewLabel: "Your season at a glance",
    previewTitle: "From kickoff to the road home.",
    previewDescription:
      "Give your team a familiar place for matchups, stadiums and the current plan, at home and on the road.",
    artwork: {
      src: "/images/football/templates/varsity-classic.webp",
      alt: "Varsity football invitation artwork",
    },
  },
};
