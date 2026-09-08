import { BABY_SHOWER_DESIGNS, getBabyShowerDesign } from "@/lib/baby-shower-designs";
import { getGenderRevealDesign } from "@/lib/gender-reveal-designs";

export type FamilyTemplateCategory = "baby-showers" | "gender-reveal";

type FamilyTemplateDesign = {
  heroImage: string;
  themeId: string;
  font: string;
};

/** The same starting artwork and styling are used by the gallery and editor. */
export function getFamilyTemplateDesign(
  category: FamilyTemplateCategory,
  templateId: string | null | undefined,
): FamilyTemplateDesign {
  if (category === "gender-reveal") {
    const design = getGenderRevealDesign(templateId);
    return { heroImage: design.heroImage, themeId: design.id, font: design.font };
  }
  const design = getBabyShowerDesign(templateId) ?? BABY_SHOWER_DESIGNS[0];
  return { heroImage: design.heroImage, themeId: design.themeId, font: design.font };
}

export function familyTemplateDate(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10);
}
