import { GENERAL_EVENT_DESIGNS, getGeneralEventDesign } from "../general-event-designs";
import { getActiveThemedEventDesigns, getDeliveredThemedEventDesign } from "../event-page-themed-designs";

const collectionLabels: Record<string, string> = {
  graduations: "Graduation", housewarming: "Housewarming", "open-house": "Open house",
  "religious-events": "Religious celebration", "holidays-seasonal": "Holidays & seasonal",
};

export function generalCreationCollectionLabel(collection?: string | null) {
  return collection && Object.hasOwn(collectionLabels, collection) ? collectionLabels[collection] : undefined;
}

/** Gallery scope is independent of the shared General editor and its account grant. */
export function getGeneralCreationDesigns(collection?: string | null, occasion?: string | null) {
  if (collection === "holidays-seasonal") {
    return GENERAL_EVENT_DESIGNS.filter((design) => design.occasion && (!occasion || design.occasion === occasion));
  }
  const themed = getActiveThemedEventDesigns(collection);
  // An explicitly scoped collection must never substitute unrelated General designs.
  if (collection && Object.hasOwn(collectionLabels, collection)) return themed;
  return themed.length ? themed : GENERAL_EVENT_DESIGNS;
}

export function resolveGeneralCreationDesign(id?: string | null) {
  return getDeliveredThemedEventDesign(id) || getGeneralEventDesign(id);
}
