import presentations from "@/data/template-body-presentations.json";
import type { BodyPresentation } from "@/components/templates/TemplateBodyLayout";
import type { TemplateCategory } from "./template-categories";
import { getThemedEventBodyPresentation } from "./event-page-themed-designs";

// Explicit, stable template IDs: changing gallery order never changes a saved design.
const byCategory = presentations as Record<TemplateCategory, Record<string, BodyPresentation>>;

/** No override means the audit retained an already distinct body. */
export function getTemplateBodyPresentation(category: TemplateCategory, id?: string | null) {
  return id ? getThemedEventBodyPresentation(id) || byCategory[category]?.[id] : undefined;
}
