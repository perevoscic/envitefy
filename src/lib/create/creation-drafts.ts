import { CREATION_INTAKE_MAX_AGE, type CreationIntake } from "./creation-intake.ts";

export type CreationDraftItem = {
  id: string;
  intakeId: string;
  title: string;
  href: string;
  eventId: null;
  savedAt: string;
};

/** Project browser recovery into Drafts without creating another saved event. */
export function buildCreationDraftItems({
  intakes,
  ownerId,
  savedEventIds = [],
  now = Date.now(),
}: {
  intakes: CreationIntake[];
  ownerId: string;
  savedEventIds?: Iterable<string>;
  now?: number;
}): CreationDraftItem[] {
  if (!ownerId) return [];
  const saved = new Set(savedEventIds);
  const seen = new Set<string>();
  return intakes
    .filter((intake) => {
      if (
        intake.version !== 1 ||
        intake.ownerId !== ownerId.toLowerCase() ||
        !Number.isFinite(intake.updatedAt) ||
        now - intake.updatedAt > CREATION_INTAKE_MAX_AGE ||
        intake.eventId ||
        (intake.discoveryEventId && saved.has(intake.discoveryEventId)) ||
        seen.has(intake.id)
      ) return false;
      seen.add(intake.id);
      return true;
    })
    .map((intake) => {
      const step = intake.phase === "source" || intake.phase === "recognizing" || !(intake.guess || intake.classification)
        ? "source"
        : "templates";
      return {
        id: `intake:${intake.id}`,
        intakeId: intake.id,
        title: intake.information?.details.title || intake.source.files[0]?.name || "Unfinished event",
        href: `/create?${new URLSearchParams({ intake: intake.id, step })}`,
        eventId: null,
        savedAt: new Date(intake.updatedAt).toISOString(),
      };
    })
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt) || a.title.localeCompare(b.title));
}
