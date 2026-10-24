import { weddingDesignCatalog } from "../wedding-designs";
import type { PublicTemplate } from "../public-template-shared";

export function getTemplates(): PublicTemplate[] {
      return weddingDesignCatalog;
}
