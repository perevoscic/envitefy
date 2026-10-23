export type EventHeroLayout = {
  imagePosition: "top" | "left" | "right";
  imageShape: "landscape" | "square" | "portrait" | "circle" | "arch";
  imageFit: "cover" | "contain";
  imagePositionY: number;
  titlePosition: "above" | "below";
  titleAlign: "left" | "center" | "right";
};

export const DEFAULT_EVENT_HERO_LAYOUT: EventHeroLayout = {
  imagePosition: "top",
  imageShape: "landscape",
  imageFit: "cover",
  imagePositionY: 50,
  titlePosition: "below",
  titleAlign: "center",
};

export const EVENT_HERO_LAYOUT_PRESETS: ReadonlyArray<{
  id: string;
  label: string;
  layout: EventHeroLayout;
}> = [
  { id: "banner", label: "Wide banner", layout: { ...DEFAULT_EVENT_HERO_LAYOUT } },
  { id: "title-first", label: "Title first", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, titlePosition: "above" } },
  { id: "image-left", label: "Image left", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "square", titleAlign: "left" } },
  { id: "image-right", label: "Image right", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "square", titleAlign: "left" } },
  { id: "circle", label: "Circle portrait", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "circle", titleAlign: "left" } },
  { id: "arch", label: "Arch portrait", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "arch" } },
  { id: "square-stack", label: "Square portrait", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "square" } },
  { id: "portrait", label: "Tall portrait", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "portrait" } },
  { id: "circle-centered", label: "Centered circle", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "circle" } },
  { id: "circle-right", label: "Circle right", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "circle", titleAlign: "left" } },
  { id: "arch-left", label: "Arch left", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "arch", titleAlign: "left" } },
  { id: "arch-right", label: "Arch right", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "arch", titleAlign: "left" } },
];

/** Optional so existing artwork and template headings retain their authored presentation. */
export function normalizeEventHeroLayout(value: unknown): EventHeroLayout | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  const choice = <K extends keyof EventHeroLayout>(key: K, options: readonly EventHeroLayout[K][]) =>
    options.includes(raw[key] as EventHeroLayout[K])
      ? raw[key] as EventHeroLayout[K]
      : DEFAULT_EVENT_HERO_LAYOUT[key];
  return {
    imagePosition: choice("imagePosition", ["top", "left", "right"]),
    imageShape: choice("imageShape", ["landscape", "square", "portrait", "circle", "arch"]),
    imageFit: choice("imageFit", ["cover", "contain"]),
    imagePositionY: typeof raw.imagePositionY === "number" && Number.isFinite(raw.imagePositionY)
      ? Math.max(0, Math.min(100, raw.imagePositionY)) : 50,
    titlePosition: choice("titlePosition", ["above", "below"]),
    titleAlign: choice("titleAlign", ["left", "center", "right"]),
  };
}
