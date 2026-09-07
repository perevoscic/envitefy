import catalog from "@/data/baby-shower-templates.json";

export type BabyShowerDesign = (typeof catalog)[number];

export const BABY_SHOWER_DESIGNS = catalog;

export function getBabyShowerDesign(id?: string | null): BabyShowerDesign | undefined {
  return BABY_SHOWER_DESIGNS.find((design) => design.id === id);
}

export function getBabyShowerTheme(design: BabyShowerDesign) {
  return {
    id: design.themeId,
    name: design.name,
    category: design.style,
    bg: "",
    bgStyle: { backgroundColor: design.colors.background, color: design.colors.text },
    text: "text-inherit",
    accent: "text-inherit",
    previewColor: "",
    previewStyle: { backgroundColor: design.colors.background },
    fontFamily: `"${design.displayFont}", Georgia, serif`,
  };
}

export function isBabyShowerDesignDark(design: BabyShowerDesign): boolean {
  const color = design.colors.background.slice(1);
  return [0, 2, 4].reduce((sum, start, index) => sum + Number.parseInt(color.slice(start, start + 2), 16) * [0.299, 0.587, 0.114][index], 0) < 128;
}
