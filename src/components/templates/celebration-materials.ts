import type { CSSProperties } from "react";
import directions from "@/data/celebration-art-directions.json";

// These are construction details, not palettes. A design explicitly chooses its
// silhouette, binding and heading composition to carry its artwork into the page.
export const silhouettes = {
  folio: "0",
  arch: "48% 48% 4px 4px / 46px 46px 4px 4px",
  portal: "70px 70px 0 0",
  petal: "48px 4px 48px 4px",
  leaf: "4px 56px 4px 56px",
  lagoon: "45px 22px 70px 18px / 24px 45px 32px 58px",
  cloud: "48px 48px 24px 24px",
  cushion: "18% / 28px",
  capsule: "64px",
  ticket: "4px 24px 24px 4px",
  pennant: "0 0 48px 4px",
  vessel: "6px 6px 60px 60px",
  tablet: "22px 22px 4px 4px",
  shell: "50% 50% 18px 18px / 32px 32px 18px 18px",
  fan: "60px 6px 6px 6px",
  prism: "2px 42px 2px 42px",
  pebble: "44px 66px 38px 58px / 38px 28px 55px 32px",
  crest: "12px 12px 50% 50% / 12px 12px 26px 26px",
  book: "3px 22px 22px 3px",
  scroll: "30px 3px 3px 30px",
  canopy: "36px 36px 0 0 / 14px 14px 0 0",
  step: "0 36px 0 0",
  lozenge: "12px 60px 12px 60px",
  ribbon: "2px 2px 28px 2px",
  sail: "0 65px 30px 0",
  window: "38px 6px 38px 6px / 60px 6px 60px 6px",
  bowl: "0 0 44px 44px",
  marquee: "32px 32px 32px 32px / 10px 10px 10px 10px",
  screen: "8px",
  keepsake: "16px 2px 16px 2px",
} as const;

export const bindings = {
  open: { border: "0", borderBlock: "1px solid var(--celebration-line)" },
  stitched: {
    border: "2px dashed var(--celebration-line)",
    outline: "1px solid var(--celebration-line)",
    outlineOffset: "-8px",
  },
  double: { border: "5px double var(--celebration-line)" },
  spine: {
    border: "1px solid var(--celebration-line)",
    borderInlineStart: "9px solid var(--celebration-line)",
  },
  rails: { border: "0", borderInline: "3px double var(--celebration-line)" },
  plinth: {
    border: "1px solid var(--celebration-line)",
    borderBottom: "8px solid var(--celebration-line)",
  },
  deckle: {
    border: "1px dashed var(--celebration-line)",
    boxShadow: "inset 0 0 0 5px var(--celebration-paper), inset 0 0 0 6px var(--celebration-line)",
  },
  offset: {
    border: "1px solid var(--celebration-line)",
    boxShadow: "6px 6px 0 var(--celebration-wash)",
  },
  inlay: {
    border: "1px solid var(--celebration-line)",
    boxShadow: "inset 0 0 0 7px var(--celebration-paper), inset 0 0 0 8px var(--celebration-line)",
  },
  beaded: { border: "3px dotted var(--celebration-line)" },
  band: {
    border: "0",
    borderBlockStart: "12px solid var(--celebration-wash)",
    borderBlockEnd: "2px solid var(--celebration-line)",
  },
  ruled: {
    border: "0",
    borderBlockStart: "5px double var(--celebration-line)",
    borderBlockEnd: "1px solid var(--celebration-line)",
  },
  seam: {
    border: "1px solid var(--celebration-line)",
    borderInlineEnd: "6px double var(--celebration-line)",
  },
  float: {
    border: "0",
    boxShadow: "0 12px 0 -7px var(--celebration-wash), 0 22px 0 -15px var(--celebration-line)",
  },
  letterpress: {
    border: "1px solid var(--celebration-line)",
    boxShadow: "inset 0 3px 0 var(--celebration-wash), 0 3px 0 var(--celebration-wash)",
  },
  ribbon: {
    border: "0",
    borderInlineStart: "4px solid var(--celebration-line)",
    borderBlockStart: "4px solid var(--celebration-line)",
  },
} satisfies Record<string, CSSProperties>;

const washes = {
  dawn: "linear-gradient(135deg,var(--celebration-wash),transparent 65%)",
  dusk: "linear-gradient(0deg,var(--celebration-wash),transparent 70%)",
  halo: "radial-gradient(ellipse at 50% 0,var(--celebration-wash),transparent 72%)",
  tide: "radial-gradient(ellipse at 100% 100%,var(--celebration-wash),transparent 70%)",
  silk: "linear-gradient(110deg,transparent 10%,var(--celebration-wash) 45%,transparent 80%)",
  stage:
    "radial-gradient(ellipse at 0 0,var(--celebration-wash),transparent 65%),radial-gradient(ellipse at 100% 0,var(--celebration-wash),transparent 65%)",
  paper:
    "linear-gradient(90deg,var(--celebration-wash),transparent 8%,transparent 92%,var(--celebration-wash))",
  horizon: "linear-gradient(180deg,transparent 50%,var(--celebration-wash))",
};

export type CelebrationDirection = {
  silhouette: keyof typeof silhouettes;
  binding: keyof typeof bindings;
  heading: "label" | "masthead" | "ribbon" | "side" | "center" | "folio";
  layout:
    | "editorial"
    | "stagger"
    | "columns"
    | "poster"
    | "mosaic"
    | "ledger"
    | "gallery"
    | "path"
    | "book"
    | "terraces"
    | "rail"
    | "islands";
  wash: keyof typeof washes;
};

const catalog = directions as Record<string, CelebrationDirection>;
export function getCelebrationDirection(category: string, id?: string | null) {
  return id ? catalog[`${category}/${id}`] : undefined;
}

export function celebrationMaterialStyle(direction: CelebrationDirection): CSSProperties {
  return {
    "--celebration-radius": silhouettes[direction.silhouette],
    "--celebration-atmosphere": washes[direction.wash],
    ...Object.fromEntries(
      Object.entries(bindings[direction.binding]).map(([key, value]) => [
        `--celebration-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
        value,
      ]),
    ),
  } as CSSProperties;
}
