import { genderRevealDesigns } from "../gender-reveal-designs";
import type { PublicTemplate } from "../public-template-shared";

export function getTemplates(): PublicTemplate[] {
      return genderRevealDesigns.map((design) => ({ ...design, style: design.style }));
}
