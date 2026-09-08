import catalog from "@/data/baby-shower-templates.json";
import retiredDesigns from "@/data/baby-shower-retired-designs.json";

export type BabyShowerDesign = (typeof catalog)[number];

export const BABY_SHOWER_DESIGNS = catalog;

export function getBabyShowerDesign(id?: string | null): BabyShowerDesign | undefined {
  const replacement = id && id in retiredDesigns ? retiredDesigns[id as keyof typeof retiredDesigns] : id;
  return BABY_SHOWER_DESIGNS.find((design) => design.id === replacement);
}

/** Upgrade retired bundled artwork while preserving uploaded and external images. */
export function resolveBabyShowerHero(image: string | null | undefined, design?: BabyShowerDesign): string {
  if (image) {
    const retiredId = image.match(/^\/templates\/baby-showers\/([^/]+)\.webp$/)?.[1];
    if (retiredId && retiredId in retiredDesigns) return (design ?? getBabyShowerDesign(retiredId) ?? BABY_SHOWER_DESIGNS[0]).heroImage;
    return image;
  }
  return (design ?? BABY_SHOWER_DESIGNS[0]).heroImage;
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
