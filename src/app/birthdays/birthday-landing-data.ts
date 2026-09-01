export type BirthdayPromptExample = {
  name: string;
  occasion: string;
  prompt: string;
  resultTitle: string;
  resultNote: string;
  image: string;
  imageAlt: string;
};

export type BirthdaySetupStep = {
  number: string;
  label: string;
  body: string;
  image: string;
  imageAlt: string;
};

export type BirthdayMilestone = {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  href: string;
};

export const birthdayCreateHref = "/event/birthdays";

export const birthdayPromptExamples = [
  {
    name: "Leo",
    occasion: "Turning 7",
    prompt:
      "Create an adventurous dinosaur birthday invitation for Leo’s seventh birthday. Make it cinematic but still playful, with jungle greens, warm sunlight, and room for our park details.",
    resultTitle: "Leo’s Dino Expedition",
    resultNote: "Adventure-forward · warm jungle palette",
    image: "/themes/dino-explorer-main.jpg",
    imageAlt: "Dinosaur explorer invitation generated for Leo's birthday prompt",
  },
  {
    name: "Ava",
    occasion: "Turning 6",
    prompt:
      "A dreamy flower-fairy invitation for Ava. Soft garden light, tiny magical details, lavender and blush colors, and an elegant storybook feeling—not too babyish.",
    resultTitle: "Ava’s Secret Fairy Garden",
    resultNote: "Whimsical · floral storybook direction",
    image: "/themes/flower-fairy-main.jpg",
    imageAlt: "Flower fairy invitation generated for Ava's birthday prompt",
  },
  {
    name: "Mia",
    occasion: "Turning 13",
    prompt:
      "Design a bold glow-party invitation for Mia’s thirteenth birthday. Neon dance-floor energy, dark background, modern type, and something that feels cool to teenagers.",
    resultTitle: "Mia After Dark",
    resultNote: "High-energy · neon editorial direction",
    image: "/themes/glow-disco-main.jpg",
    imageAlt: "Neon glow invitation generated for Mia's birthday prompt",
  },
] as const satisfies readonly BirthdayPromptExample[];

export const birthdaySetupSteps = [
  {
    number: "01",
    label: "Choose the feeling",
    body: "Describe the person and party, SNAP an invitation you already have, or tell Concierge.",
    image: "/images/marketing/birthday-step-theme.png",
    imageAlt: "Parent and child choosing a birthday invitation design together",
  },
  {
    number: "02",
    label: "Add what guests need",
    body: "Confirm the schedule, household RSVP, food notes, directions, pickup, and gifts.",
    image: "/images/marketing/birthday-step-details.png",
    imageAlt: "Parent organizing birthday details on a phone",
  },
  {
    number: "03",
    label: "Share one living link",
    body: "Text it once. Guests can return whenever they need the newest party details.",
    image: "/images/marketing/birthday-step-share.png",
    imageAlt: "Parents sharing a digital birthday invitation at a backyard party",
  },
] as const satisfies readonly BirthdaySetupStep[];

export const birthdayMilestones = [
  {
    eyebrow: "Sweet sixteen",
    title: "Give the next chapter a little red-carpet energy.",
    body: "A polished invitation, photo-ready details, and one place for every reply.",
    image: "/themes/movie-star-main.jpg",
    imageAlt: "Red carpet inspired milestone birthday celebration",
    href: birthdayCreateHref,
  },
  {
    eyebrow: "30th, 50th, 80th",
    title: "Bring the whole family together beautifully.",
    body: "Dinner, cocktails, surprise parties, and landmark birthdays use the same calm guest tools.",
    image: "/images/marketing/use-case-birthday.webp",
    imageAlt: "Elegant multigenerational birthday celebration at golden hour",
    href: birthdayCreateHref,
  },
] as const satisfies readonly BirthdayMilestone[];

export const birthdayHostStats = [
  { value: "16", label: "families" },
  { value: "18", label: "kids" },
  { value: "22", label: "adults" },
  { value: "7", label: "pending" },
] as const;

export const birthdayGuestRows = [
  { family: "The Riveras", count: "2 kids · 2 adults", status: "Going" },
  { family: "The Parkers", count: "1 kid · 1 adult", status: "Going" },
  { family: "The Nguyens", count: "2 kids · 1 adult", status: "Maybe" },
] as const;

export const birthdayFinalImage = "/themes/jungle-safari-main.jpg";
export const birthdayInvitationBackdrop = "/phone-placeholders/birthday-pavilion.jpeg";
