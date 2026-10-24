// A cheap routing hint; the authored catalog still verifies the complete ID.
// Unknown IDs fall through to the category's original compatibility renderer.
const collections = new Set(["bridal-showers", "graduations", "housewarming", "open-house", "religious-events", "dance", "cheerleading", "basketball", "baseball", "softball", "soccer", "volleyball", "hockey", "lacrosse", "tennis", "track-field", "swimming", "wrestling"]);
export function isPotentialThemedTemplateId(id: string): boolean {
  return collections.has(id.split("--", 1)[0]);
}
