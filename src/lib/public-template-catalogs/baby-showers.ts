import babyTemplates from "@/data/baby-shower-templates.json";
import { getFamilyTemplateDesign } from "../family-template-designs";
import type { PublicTemplate } from "../public-template-shared";

export function getTemplates(): PublicTemplate[] {
      return babyTemplates.map((template) => ({
        id: template.templateId,
        name: template.name,
        description: template.description,
        style: template.style,
        heroImage: getFamilyTemplateDesign("baby-showers", template.templateId).heroImage,
      }));
}
