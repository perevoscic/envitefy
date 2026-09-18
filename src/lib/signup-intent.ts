export type SignupIntent =
  | "snap"
  | "weddings"
  | "bridal_showers"
  | "baby_showers"
  | "gymnastics"
  | "football"
  | "sport_events"
  | "signup_forms"
  | "gender_reveal"
  | "birthdays"
  | "anniversaries";

export type SignupSource = SignupIntent;

export const SIGNUP_INTENTS: SignupIntent[] = [
  "snap",
  "weddings",
  "bridal_showers",
  "baby_showers",
  "gymnastics",
  "football",
  "sport_events",
  "signup_forms",
  "gender_reveal",
  "birthdays",
  "anniversaries",
];

const SIGNUP_INTENT_SET = new Set<string>(SIGNUP_INTENTS);

const INTENT_BY_MARKETING_PATH: Record<string, SignupIntent> = {
  "/invitation-maker": "snap",
  "/snap": "snap",
  "/weddings": "weddings",
  "/bridal-showers": "bridal_showers",
  "/baby-showers": "baby_showers",
  "/gymnastics": "gymnastics",
  "/football": "football",
  "/sports": "sport_events",
  "/sport-events": "sport_events",
  "/signup-forms": "signup_forms",
  "/gender-reveal": "gender_reveal",
  "/birthdays": "birthdays",
  "/anniversaries": "anniversaries",
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
    href: "/event/weddings",
  },
  bridal_showers: {
    label: "Bridal Shower",
    ctaLabel: "+ Bridal Shower",
    href: "/event/baby-showers/customize?occasion=bridal-shower",
  },
  baby_showers: {
    label: "Baby Shower",
    ctaLabel: "+ Baby Shower",
    href: "/event/baby-showers",
  },
  gymnastics: {
    label: "Gymnastics Meet",
    ctaLabel: "+ Gymnastics Meet",
    href: "/event/gymnastics",
  },
  football: {
    label: "Football",
    ctaLabel: "+ Football",
    href: "/event/football",
  },
  sport_events: {
    label: "Sports Event",
    ctaLabel: "+ Sports Event",
    href: "/event/sport-events",
  },
  signup_forms: {
    label: "Sign-up Form",
    ctaLabel: "+ Sign-up Form",
    href: "/signup-forms/templates",
  },
  gender_reveal: {
    label: "Gender Reveal",
    ctaLabel: "+ Gender Reveal",
    href: "/event/gender-reveal",
  },
  anniversaries: { label: "Anniversary", ctaLabel: "+ Anniversary", href: "/event/anniversaries" },
  birthdays: {
    label: "Birthday Party",
    ctaLabel: "+ Birthday Party",
    href: "/event/birthdays",
  },
};

export function normalizeSignupIntent(value: unknown): SignupIntent | null {
  const normalized = typeof value === "string" ? value.trim().toLowerCase().replace(/-/g, "_") : "";
  return SIGNUP_INTENT_SET.has(normalized) ? (normalized as SignupIntent) : null;
}

export function signupIntentForMarketingPath(pathname: string): SignupIntent | null {
  const normalized = normalizeSignupPath(pathname);
  if (!normalized) return null;
  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] === "event") {
    return segments[1] === "football-season"
      ? "football"
      : INTENT_BY_MARKETING_PATH[`/${segments[1]}`] || null;
  }
  if (normalized === "/templates/signup") return "signup_forms";
  return (
    INTENT_BY_MARKETING_PATH[normalized] ||
    (segments[1] === "templates" ? INTENT_BY_MARKETING_PATH[`/${segments[0]}`] : null) ||
    null
  );
}

export function signupSourceForIntent(intent: SignupIntent | null | undefined): SignupSource {
  return intent || "snap";
}

// Store only an app pathname, never query strings, event facts, or external referrers.
export function normalizeSignupPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  const path = value.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  return /^\/[a-zA-Z0-9/_-]*$/.test(path) && path.length <= 250 ? path : null;
}

export function resolveSignupContext(input: {
  intent?: unknown;
  source?: unknown;
  path?: unknown;
  previousIntent?: unknown;
  previousPath?: unknown;
}) {
  const path = normalizeSignupPath(input.path);
  const intent =
    normalizeSignupIntent(input.intent) ||
    signupIntentForMarketingPath(path || "") ||
    normalizeSignupIntent(input.source) ||
    normalizeSignupIntent(input.previousIntent) ||
    "snap";
  const previousPath = normalizeSignupPath(input.previousPath);
  const matchingPreviousPath =
    signupIntentForMarketingPath(previousPath || "") === intent ? previousPath : null;
  return {
    intent,
    source: signupSourceForIntent(intent),
    // Retain the category landing page through its gallery/editor and generic signup.
    path:
      matchingPreviousPath || (signupIntentForMarketingPath(path || "") === intent ? path : null),
  };
}

export function getCreateActionForSignupIntent(intent: unknown) {
  const normalized = normalizeSignupIntent(intent);
  if (!normalized) return null;
  return CREATE_ACTION_BY_INTENT[normalized];
}
