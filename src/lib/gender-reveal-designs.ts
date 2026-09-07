import designs from "@/data/gender-reveal-templates.json";

export type GenderRevealDesign = (typeof designs)[number];
export const genderRevealDesigns: GenderRevealDesign[] = designs;

export function getGenderRevealDesign(id?: string | null): GenderRevealDesign {
  return genderRevealDesigns.find((design) => design.id === id) ?? genderRevealDesigns[0];
}

export function genderRevealFont(design: GenderRevealDesign): string {
  return design.font === "allura" ? "var(--font-allura)" : `"Reveal ${design.font}", Georgia, serif`;
}
