import type { ConciergeEventDraft } from "./types.ts";
import { stripArtworkPreservationInstructions } from "./visual-direction.ts";
import { isArtworkDirection } from "./artwork-edit-scope.ts";
import { publicContentForDraft } from "./public-content.ts";

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
  if (isArtworkDirection(visualRequest)) return true;
  const changed = (field: keyof ConciergeEventDraft) =>
    JSON.stringify(before[field] ?? null) !== JSON.stringify(after[field] ?? null);
  if (artworkTextMode !== "none" && JSON.stringify(publicContentForDraft(before).requiredArtworkLines) !== JSON.stringify(publicContentForDraft(after).requiredArtworkLines)) return true;
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
    "publicContent",
  ].some((field) => changed(field as keyof ConciergeEventDraft));
}
