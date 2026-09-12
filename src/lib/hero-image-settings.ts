export type HeroImageSettings = {
  positionY: number;
  fit: "cover" | "contain";
};

export const DEFAULT_HERO_IMAGE_SETTINGS: HeroImageSettings = {
  positionY: 50,
  fit: "cover",
};

/** Appearance is saved explicitly; color is derived from the selected template. */
export function normalizeHeroImageSettings(value: unknown): HeroImageSettings {
  const data = value && typeof value === "object" ? value : {};
  const percentage = (input: unknown, fallback: number, max = 100) =>
    typeof input === "number" && Number.isFinite(input)
      ? Math.max(0, Math.min(max, input))
      : fallback;
  return {
    positionY: percentage("positionY" in data ? data.positionY : undefined, 50),
    fit: "fit" in data && data.fit === "contain" ? "contain" : "cover",
  };
}
