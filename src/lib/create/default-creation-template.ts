import { schoolTemplateId } from "../school-events";
import type { CreateGuess } from "./create-intent";

/** Retain a deliberate design; a broad holiday alone cannot select a named one. */
export function defaultCreationTemplate<T extends { id: string }>(
  templates: readonly T[],
  guess: CreateGuess,
  selectedTemplateId?: string,
): T | undefined {
  const retained = templates.find(({ id }) => id === selectedTemplateId);
  if (retained) return retained;
  if (guess.category === "school") return guess.schoolTemplate ? templates.find(({ id }) => id.startsWith(`${schoolTemplateId(guess.schoolTemplate!)}--`) || id === schoolTemplateId(guess.schoolTemplate!)) : undefined;
  if (guess.category === "holidays-seasonal" && !guess.occasion) return;
  return templates[0];
}
