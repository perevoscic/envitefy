import { resolveVisibility, type TemplateKey } from "@/config/feature-visibility";
import { normalizeSignupPath, type SignupIntent } from "@/lib/signup-intent";

const templatesByIntent: Partial<Record<SignupIntent, TemplateKey[]>> = {
  gymnastics: ["gymnastics"],
  football: ["football_season"],
  sport_events: ["sport_events"],
  weddings: ["weddings"],
  bridal_showers: ["baby_showers"],
  baby_showers: ["baby_showers"],
  gender_reveal: ["gender_reveal"],
  birthdays: ["birthdays"],
  anniversaries: ["anniversaries"],
  signup_forms: [],
};

export function buildSignupDefaults(intent: SignupIntent, signupPath?: string | null) {
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
    v: 3,
    persona: visibility.persona,
    personas: visibility.personas,
    visibleTemplateKeys: visibility.visibleTemplateKeys,
    defaultCreateIntent: visibility.defaultCreateIntent,
    sportPreferences: visibility.sportPreferences,
    signupAttribution: { intent, path: normalizeSignupPath(signupPath) },
  };
}
