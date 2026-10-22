import { GENERAL_EVENT_DESIGNS, getGeneralEventDesign } from "../general-event-designs";
import { getActiveThemedEventDesigns, getDeliveredThemedEventDesign } from "../event-page-themed-designs";

/** Gallery scope is independent of the shared General editor and its account grant. */
export function getGeneralCreationDesigns(collection?: string | null, occasion?: string | null) {
  if (collection === "holidays-seasonal") {
    return GENERAL_EVENT_DESIGNS.filter((design) => design.occasion && (!occasion || design.occasion === occasion));
  }
  const themed = getActiveThemedEventDesigns(collection);
  return themed.length ? themed : GENERAL_EVENT_DESIGNS;
}

export function resolveGeneralCreationDesign(id?: string | null) {
  return getDeliveredThemedEventDesign(id) || getGeneralEventDesign(id);
}
