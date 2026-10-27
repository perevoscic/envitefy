import { resolveVisibility, type TemplateKey } from "@/config/feature-visibility";
import { normalizeSignupPath, type SignupIntent } from "@/lib/signup-intent";

export type CategoryOnboardingStatus = "pending" | "completed" | "skipped" | null;

export function normalizeCategoryOnboarding(value: unknown): CategoryOnboardingStatus {
  return value === "pending" || value === "completed" || value === "skipped" ? value : null;
}

const templatesByIntent: Partial<Record<SignupIntent, TemplateKey[]>> = {
  gymnastics: ["gymnastics"],
  football: ["football_season"],
  sport_events: ["sport_events"],
  weddings: ["weddings"],
  bridal_showers: ["bridal_showers"],
  baby_showers: ["baby_showers"],
  gender_reveal: ["gender_reveal"],
  birthdays: ["birthdays"],
  anniversaries: ["anniversaries"],
  signup_forms: [],
};

export function buildSignupDefaults(intent: SignupIntent, signupPath?: string | null) {
  const path = normalizeSignupPath(signupPath);
  const categoryOnboarding: CategoryOnboardingStatus =
    intent === "snap" && (path === null || path === "/" || path === "/landing")
      ? "pending"
      : null;
  const sport = intent === "gymnastics" || intent === "football" ? intent : null;
  const sportsStaff = Boolean(sport) || intent === "sport_events";
  const visibility = resolveVisibility({
    persona: sportsStaff ? "sports_staff" : null,
    visibleTemplateKeys: templatesByIntent[intent],
    defaultCreateIntent: intent === "snap" ? null : intent,
    sportPreferences: sport
      ? { primarySport: sport, enabledSports: [sport], setupCompleted: true }
      : undefined,
  });
  return {
    v: 4,
    persona: visibility.persona,
    personas: visibility.personas,
    visibleTemplateKeys: visibility.visibleTemplateKeys,
    defaultCreateIntent: visibility.defaultCreateIntent,
    sportPreferences: visibility.sportPreferences,
    categoryOnboarding,
    signupAttribution: { intent, path },
  };
}
