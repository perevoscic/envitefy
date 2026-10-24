import { GYM_MEET_TEMPLATE_LIBRARY } from "@/components/gym-meet-templates/registry";
import type { PublicTemplate } from "../public-template-shared";

export function getTemplates(): PublicTemplate[] {
      return GYM_MEET_TEMPLATE_LIBRARY.map((design) => ({
        ...design,
        heroImage: design.artwork || "",
      }));
}
