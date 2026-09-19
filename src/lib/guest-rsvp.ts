import { isGenderRevealCategory, isGenderRevealGuessRequired, normalizeGenderRevealGuess, parseGenderRevealConfig, shouldCollectGenderRevealGuess, type GenderRevealConfig } from "./gender-reveal.ts";

/** The event identity survives shared studio visual categories such as Baby Shower. */
export function guestRsvpCategory(details: { category?: string | null; eventKind?: string | null } | null | undefined) {
  return isGenderRevealCategory(details?.eventKind?.replace(/_/g, " ")) ? "Gender Reveal" : details?.category;
}

export function guestRsvpGuessRules(category: string | null | undefined, response: "yes" | "no" | "maybe", config?: GenderRevealConfig, deadline?: string | null) {
  const reveal = isGenderRevealCategory(category?.replace(/_/g, " "));
  const inputs = { config: config || parseGenderRevealConfig({}), response, deadline };
  return { collect: reveal && shouldCollectGenderRevealGuess(inputs), required: reveal && isGenderRevealGuessRequired(inputs) };
}

export function buildGuestRsvpSubmission(input: {
  response: "yes" | "no" | "maybe"; name: string; email: string; category?: string | null;
  genderGuess?: string | null; genderRevealConfig?: GenderRevealConfig; rsvpDeadline?: string | null;
}) {
  if (!input.name.trim()) throw new Error("Enter your name to send your RSVP.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new Error("Enter a valid email to send your RSVP.");
  const rules = guestRsvpGuessRules(input.category, input.response, input.genderRevealConfig, input.rsvpDeadline);
  const guess = normalizeGenderRevealGuess(input.genderGuess);
  if (rules.required && !guess) throw new Error("Choose Team Pink or Team Blue.");
  return {
    response: input.response, name: input.name.trim(), email: input.email.trim(),
    ...(rules.collect && guess ? { answersJson: { genderGuess: guess } } : {}),
  };
}
