export const EVENT_HERO_IMAGE_STYLES = [
  "diagonal-cut",
  "crossing-lines",
  "offset-frame",
  "cut-corners",
  "sliced-bands",
  "diagonal-rise",
  "chevron-edge",
  "wave-edge",
  "scalloped-edge",
  "postage-stamp",
  "torn-edge",
  "filmstrip",
  "corner-brackets",
  "double-rule",
  "triple-stripe",
  "window-grid",
  "diamond-window",
  "hexagon-window",
  "oval-window",
  "soft-arch",
  "corner-ribbon",
  "inset-mat",
  "half-frame",
  "spotlight-ring",
  "stitched-edge",
  "folded-corner",
  "stepped-edge",
  "zigzag-edge",
  "ticket-edge",
  "rounded-ticket",
  "diagonal-window",
  "octagon-window",
  "shield-window",
  "fan-window",
  "pebble-window",
  "clover-window",
  "sunburst-edge",
  "three-panels",
  "slanted-panels",
  "horizon-line",
  "vertical-rule",
  "sweeping-arc",
  "orbit-lines",
  "art-deco",
  "geometric-corner",
  "polaroid-mat",
  "double-oval",
  "floating-border",
] as const;

export type EventHeroLayout = {
  imagePosition: "top" | "left" | "right";
  imageShape: "landscape" | "square" | "portrait" | "circle" | "arch";
  imageFit: "cover" | "contain";
  imagePositionY: number;
  titlePosition: "above" | "below";
  titleAlign: "left" | "center" | "right";
  imageStyle?: (typeof EVENT_HERO_IMAGE_STYLES)[number];
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
  { id: "diagonal-cut", label: "Diagonal cut", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "diagonal-cut" } },
  { id: "crossing-lines", label: "Crossing lines", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "crossing-lines" } },
  { id: "offset-frame", label: "Offset frame", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "square", titleAlign: "left", imageStyle: "offset-frame" } },
  { id: "cut-corners", label: "Cut corners", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "square", titleAlign: "left", imageStyle: "cut-corners" } },
  { id: "sliced-bands", label: "Sliced bands", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "sliced-bands" } },
  { id: "diagonal-rise", label: "Rising diagonal", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "diagonal-rise" } },
  { id: "chevron-edge", label: "Chevron edge", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "chevron-edge" } },
  { id: "wave-edge", label: "Wave edge", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "wave-edge" } },
  { id: "scalloped-edge", label: "Scalloped edge", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "scalloped-edge" } },
  { id: "postage-stamp", label: "Postage stamp", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "portrait", titleAlign: "left", imageStyle: "postage-stamp" } },
  { id: "torn-edge", label: "Torn paper", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "torn-edge" } },
  { id: "filmstrip", label: "Filmstrip", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "filmstrip" } },
  { id: "corner-brackets", label: "Corner brackets", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "square", titleAlign: "left", imageStyle: "corner-brackets" } },
  { id: "double-rule", label: "Double rule", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "double-rule" } },
  { id: "triple-stripe", label: "Triple stripe", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "triple-stripe" } },
  { id: "window-grid", label: "Window panes", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "window-grid" } },
  { id: "diamond-window", label: "Diamond window", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "square", titleAlign: "left", imageStyle: "diamond-window" } },
  { id: "hexagon-window", label: "Hexagon window", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "square", titleAlign: "left", imageStyle: "hexagon-window" } },
  { id: "oval-window", label: "Oval portrait", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "portrait", titleAlign: "left", imageStyle: "oval-window" } },
  { id: "soft-arch", label: "Soft arch", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "portrait", imageStyle: "soft-arch" } },
  { id: "corner-ribbon", label: "Corner ribbon", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "corner-ribbon" } },
  { id: "inset-mat", label: "Gallery mat", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "square", titleAlign: "left", imageStyle: "inset-mat" } },
  { id: "half-frame", label: "Open frame", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "square", titleAlign: "left", imageStyle: "half-frame" } },
  { id: "spotlight-ring", label: "Spotlight ring", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "square", imageStyle: "spotlight-ring" } },
  { id: "stitched-edge", label: "Stitched edge", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "stitched-edge" } },
  { id: "folded-corner", label: "Folded corner", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "folded-corner" } },
  { id: "stepped-edge", label: "Stepped edge", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "stepped-edge" } },
  { id: "zigzag-edge", label: "Zigzag edge", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "zigzag-edge" } },
  { id: "ticket-edge", label: "Ticket cut", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "ticket-edge" } },
  { id: "rounded-ticket", label: "Rounded ticket", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "square", titleAlign: "left", imageStyle: "rounded-ticket" } },
  { id: "diagonal-window", label: "Slanted window", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "portrait", titleAlign: "left", imageStyle: "diagonal-window" } },
  { id: "octagon-window", label: "Octagon window", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "square", titleAlign: "left", imageStyle: "octagon-window" } },
  { id: "shield-window", label: "Shield window", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "portrait", imageStyle: "shield-window" } },
  { id: "fan-window", label: "Fan window", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "fan-window" } },
  { id: "pebble-window", label: "Pebble window", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "square", titleAlign: "left", imageStyle: "pebble-window" } },
  { id: "clover-window", label: "Clover window", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "square", imageStyle: "clover-window" } },
  { id: "sunburst-edge", label: "Sunburst edge", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "square", titleAlign: "left", imageStyle: "sunburst-edge" } },
  { id: "three-panels", label: "Three panels", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "three-panels" } },
  { id: "slanted-panels", label: "Slanted panels", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "slanted-panels" } },
  { id: "horizon-line", label: "Horizon line", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "horizon-line" } },
  { id: "vertical-rule", label: "Vertical rules", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "portrait", titleAlign: "left", imageStyle: "vertical-rule" } },
  { id: "sweeping-arc", label: "Sweeping arc", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "sweeping-arc" } },
  { id: "orbit-lines", label: "Orbit lines", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "square", imageStyle: "orbit-lines" } },
  { id: "art-deco", label: "Art Deco", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageStyle: "art-deco" } },
  { id: "geometric-corner", label: "Geometric corner", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "left", imageShape: "square", titleAlign: "left", imageStyle: "geometric-corner" } },
  { id: "polaroid-mat", label: "Photo mat", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "portrait", titleAlign: "left", imageStyle: "polaroid-mat" } },
  { id: "double-oval", label: "Double oval", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imageShape: "portrait", imageStyle: "double-oval" } },
  { id: "floating-border", label: "Floating border", layout: { ...DEFAULT_EVENT_HERO_LAYOUT, imagePosition: "right", imageShape: "square", titleAlign: "left", imageStyle: "floating-border" } },
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
    ...(EVENT_HERO_IMAGE_STYLES.includes(raw.imageStyle as NonNullable<EventHeroLayout["imageStyle"]>)
      ? { imageStyle: raw.imageStyle as EventHeroLayout["imageStyle"] } : {}),
  };
}
