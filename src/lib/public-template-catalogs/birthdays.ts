import { BIRTHDAY_DESIGN_CATALOG } from "@/data/birthday-design-catalog";
import type { PublicTemplate } from "../public-template-shared";

export function getTemplates(): PublicTemplate[] {
      return BIRTHDAY_DESIGN_CATALOG;
}
