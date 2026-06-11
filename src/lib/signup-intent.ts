export type SignupIntent =
  | "snap"
  | "weddings"
  | "bridal_showers"
  | "baby_showers"
  | "gymnastics"
  | "sport_events"
  | "signup_forms"
  | "gender_reveal"
  | "birthdays";

export type SignupSource = "snap" | "gymnastics";

export const SIGNUP_INTENTS: SignupIntent[] = [
  "snap",
  "weddings",
  "bridal_showers",
  "baby_showers",
  "gymnastics",
  "sport_events",
  "signup_forms",
  "gender_reveal",
  "birthdays",
];

const SIGNUP_INTENT_SET = new Set<string>(SIGNUP_INTENTS);

const INTENT_BY_MARKETING_PATH: Record<string, SignupIntent> = {
  "/snap": "snap",
  "/weddings": "weddings",
  "/bridal-showers": "bridal_showers",
  "/baby-showers": "baby_showers",
  "/gymnastics": "gymnastics",
  "/sports": "sport_events",
  "/sport-events": "sport_events",
  "/signup-forms": "signup_forms",
  "/gender-reveal": "gender_reveal",
  "/birthdays": "birthdays",
};

const CREATE_ACTION_BY_INTENT: Record<
  SignupIntent,
  {
    label: string;
    ctaLabel: string;
    href: string;
  }
> = {
  snap: {
    label: "Create Event",
    ctaLabel: "+ Create Event",
    href: "/event",
  },
  weddings: {
    label: "Wedding Event",
    ctaLabel: "+ Wedding Event",
    href: "/event/weddings/customize",
  },
  bridal_showers: {
    label: "Bridal Shower",
    ctaLabel: "+ Bridal Shower",
    href: "/event/baby-showers/customize?occasion=bridal-shower",
  },
  baby_showers: {
    label: "Baby Shower",
    ctaLabel: "+ Baby Shower",
    href: "/event/baby-showers/customize",
  },
  gymnastics: {
    label: "Gymnastics Meet",
    ctaLabel: "+ Gymnastics Meet",
    href: "/event/gymnastics",
  },
  sport_events: {
    label: "Sports Event",
    ctaLabel: "+ Sports Event",
    href: "/event/sport-events",
  },
  signup_forms: {
    label: "Sign-up Form",
    ctaLabel: "+ Sign-up Form",
    href: "/templates/signup",
  },
  gender_reveal: {
    label: "Gender Reveal",
    ctaLabel: "+ Gender Reveal",
    href: "/event/gender-reveal/customize",
  },
  birthdays: {
    label: "Birthday Party",
    ctaLabel: "+ Birthday Party",
    href: "/event/birthdays/customize",
  },
};

export function normalizeSignupIntent(value: unknown): SignupIntent | null {
  const normalized = String(value || "").trim().replace(/-/g, "_");
  return SIGNUP_INTENT_SET.has(normalized) ? (normalized as SignupIntent) : null;
}

export function signupIntentForMarketingPath(pathname: string): SignupIntent | null {
  const normalized = (pathname || "").replace(/\/+$/, "") || "/";
  return INTENT_BY_MARKETING_PATH[normalized] || null;
}

export function signupSourceForIntent(intent: SignupIntent | null | undefined): SignupSource {
  return intent === "gymnastics" ? "gymnastics" : "snap";
}

export function getCreateActionForSignupIntent(intent: unknown) {
  const normalized = normalizeSignupIntent(intent);
  if (!normalized) return null;
  return CREATE_ACTION_BY_INTENT[normalized];
}
