import { AVAILABLE_HOLIDAY_TEMPLATE_IDS } from "@/assets/holiday-template-availability";

const available = new Set(AVAILABLE_HOLIDAY_TEMPLATE_IDS);

/** Pending artwork never enters a gallery or a direct template lookup. */
export function isHolidayTemplateAvailable(id: string): boolean {
  return available.has(id);
}
