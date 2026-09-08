import type { ConciergeEventDraft } from "./types.ts";
import { hasVisualChangeWords, stripArtworkPreservationInstructions } from "./visual-direction.ts";

export type ArtworkTextMode = "headline" | "complete_invitation" | "none";

/** Changes to panels do not redraw art; imported/legacy cards stay conservative. */
export function shouldRegenerateGeneratedDraftImageForEdit(args: {
  userMessage: string;
  previousDraft: ConciergeEventDraft;
  nextDraft: ConciergeEventDraft;
  artworkTextMode?: ArtworkTextMode;
}): boolean {
  const { previousDraft: before, nextDraft: after, artworkTextMode } = args;
  // Explicit requests can target image elements without changing structured facts.
  const visualRequest = stripArtworkPreservationInstructions(args.userMessage);
  if (hasVisualChangeWords(visualRequest)) return true;
  const changed = (field: keyof ConciergeEventDraft) =>
    JSON.stringify(before[field] ?? null) !== JSON.stringify(after[field] ?? null);
  if (["theme", "tone", "eventType"].some((field) => changed(field as keyof ConciergeEventDraft)))
    return true;
  if (
    artworkTextMode !== "none" &&
    ["title", "honoreeName", "ageOrMilestone"].some((field) =>
      changed(field as keyof ConciergeEventDraft),
    )
  )
    return true;
  if (artworkTextMode === "headline" || artworkTextMode === "none") return false;
  return [
    "dateText",
    "timeText",
    "startISO",
    "endISO",
    "timezone",
    "venue",
    "location",
    "additionalLocations",
    "rsvpEnabled",
    "rsvpName",
    "rsvpContact",
    "rsvpDeadline",
    "giftNote",
    "giftPreferenceNote",
    "registryLink",
    "giftRegistryLink",
    "previewCopy",
  ].some((field) => changed(field as keyof ConciergeEventDraft));
}
