"use client";

import React from "react";
import styles from "./WeddingTemplateGallery.module.css";

export type WeddingTitleFont =
  | "auto"
  | "montserrat"
  | "pacifico"
  | "geist"
  | "mono"
  | "serif"
  | "system"
  | "poppins"
  | "raleway"
  | "playfair"
  | "dancing";

type TitleWeight = "normal" | "semibold" | "bold";
type TitleAlign = "left" | "center" | "right";

export type TemplateVariation = {
  id: string;
  label: string;
  tagline: string;
  palette: string[];
  background: string;
  titleColor: string;
  titleFont: WeddingTitleFont;
  titleWeight?: TitleWeight;
  titleAlign?: TitleAlign;
};

const variationLibrary: Record<string, TemplateVariation> = {
  blushChampagne: {
    id: "blush-champagne",
    label: "Blush & Champagne",
    tagline: "Soft rose-gold warmth",
    palette: ["#FDF3EF", "#F5D6CA", "#E0B8A9", "#AC7F73", "#4A1E19"],
    background: "linear-gradient(145deg, #FDF3EF, #E0B8A9)",
    titleColor: "#3C1511",
    titleFont: "playfair",
    titleWeight: "semibold",
    titleAlign: "center",
  },
  midnightNoir: {
    id: "midnight-noir",
    label: "Midnight Noir",
    tagline: "Candlelit drama",
    palette: ["#0F0D17", "#1F142E", "#30404F", "#7E5A8A", "#C7B5D4"],
    background: "linear-gradient(160deg, #0F0D17, #30404F)",
    titleColor: "#ECD7E7",
    titleFont: "playfair",
    titleWeight: "bold",
    titleAlign: "center",
  },
  gardenEmerald: {
    id: "garden-emerald",
    label: "Garden Emerald",
    tagline: "Botanical atelier",
    palette: ["#F4F5F0", "#C6D8D1", "#93B4A9", "#577864", "#24382D"],
    background: "linear-gradient(150deg, #F4F5F0, #93B4A9)",
    titleColor: "#24382D",
    titleFont: "raleway",
    titleWeight: "semibold",
    titleAlign: "center",
  },
  opalSand: {
    id: "opal-sand",
    label: "Opal Sand",
    tagline: "Marble fresh neutrals",
    palette: ["#FFF9F6", "#F3E2D7", "#D7B9A9", "#93756A", "#4B3A34"],
    background: "linear-gradient(145deg, #FFF9F6, #D7B9A9)",
    titleColor: "#4B3A34",
    titleFont: "montserrat",
    titleWeight: "normal",
    titleAlign: "left",
  },
  moonlitLavender: {
    id: "moonlit-lavender",
    label: "Moonlit Lavender",
    tagline: "Twilight whispers",
    palette: ["#F0F2F7", "#D8D7E5", "#9FA6C8", "#676C95", "#1E1F3D"],
    background: "linear-gradient(160deg, #F0F2F7, #9FA6C8)",
    titleColor: "#1E1F3D",
    titleFont: "playfair",
    titleWeight: "semibold",
    titleAlign: "center",
  },
  sunsetCoral: {
    id: "sunset-coral",
    label: "Sunset Coral",
    tagline: "Bougainvillea glow",
    palette: ["#FFF3EE", "#FFD1C1", "#FF9C8D", "#C75B40", "#481E16"],
    background: "linear-gradient(145deg, #FFF3EE, #FF9C8D)",
    titleColor: "#481E16",
    titleFont: "dancing",
    titleWeight: "bold",
    titleAlign: "center",
  },
  goldenIvy: {
    id: "golden-ivy",
    label: "Golden Ivy",
    tagline: "Gilded heirlooms",
    palette: ["#F8F6EF", "#E4D4AF", "#C6B07E", "#6B5A3B", "#2E2518"],
    background: "linear-gradient(135deg, #F8F6EF, #C6B07E)",
    titleColor: "#2E2518",
    titleFont: "poppins",
    titleWeight: "semibold",
    titleAlign: "center",
  },
  crimsonVelvet: {
    id: "crimson-velvet",
    label: "Crimson Velvet",
    tagline: "Deep luxe hints",
    palette: ["#F9F1EF", "#E9D7D4", "#CF4D53", "#7B1C26", "#2F0A0F"],
    background: "linear-gradient(145deg, #F9F1EF, #CF4D53)",
    titleColor: "#2F0A0F",
    titleFont: "geist",
    titleWeight: "bold",
    titleAlign: "center",
  },
  seaGlass: {
    id: "sea-glass",
    label: "Sea Glass",
    tagline: "Coastal shimmer",
    palette: ["#F1FBFA", "#D0E5E3", "#9BC6C6", "#4B7E7F", "#1A3B3A"],
    background: "linear-gradient(150deg, #F1FBFA, #9BC6C6)",
    titleColor: "#1A3B3A",
    titleFont: "montserrat",
    titleWeight: "semibold",
    titleAlign: "center",
  },
  desertAmber: {
    id: "desert-amber",
    label: "Desert Amber",
    tagline: "Warm adobe glow",
    palette: ["#FFF6ED", "#FAD4A5", "#CE8E5A", "#8A582F", "#35251D"],
    background: "linear-gradient(150deg, #FFF6ED, #CE8E5A)",
    titleColor: "#35251D",
    titleFont: "raleway",
    titleWeight: "normal",
    titleAlign: "left",
  },
};

const baseMenu = [
  "Home",
  "Our Story",
  "Travel",
  "Things To Do",
  "Photos",
  "Wedding Party",
  "Registry",
  "RSVP",
];

export type WeddingTemplateDefinition = {
  id: string;
  name: string;
  description: string;
  heroImageName: string;
  heroMood: string;
  menu: string[];
  variations: TemplateVariation[];
};

export const weddingTemplateCatalog: WeddingTemplateDefinition[] = [
  {
    id: "midnight-bloom",
    name: "Midnight Bloom",
    description:
      "Candlelit florals and contrasting serif lettering for after-dark celebrations.",
    heroImageName: "midnight-bloom-hero.jpg",
    heroMood: "Velvet florals",
    menu: [...baseMenu],
    variations: [
      variationLibrary.midnightNoir,
      variationLibrary.blushChampagne,
      variationLibrary.moonlitLavender,
      variationLibrary.crimsonVelvet,
      variationLibrary.goldenIvy,
    ],
  },
  {
    id: "ivory-ink",
    name: "Ivory & Ink",
    description:
      "Editorial black-and-white with bespoke typography revealing every detail.",
    heroImageName: "ivory-ink-hero.jpg",
    heroMood: "Studio portrait",
    menu: [...baseMenu, "Dress Code"],
    variations: [
      variationLibrary.opalSand,
      variationLibrary.moonlitLavender,
      variationLibrary.midnightNoir,
      variationLibrary.gardenEmerald,
      variationLibrary.seaGlass,
    ],
  },
  {
    id: "garden-atelier",
    name: "Garden Atelier",
    description:
      "Painterly leaves, hand-lettered cues, and lush directional layouts.",
    heroImageName: "garden-atelier-hero.jpg",
    heroMood: "Botanical canopy",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.gardenEmerald,
      variationLibrary.seaGlass,
      variationLibrary.goldenIvy,
      variationLibrary.blushChampagne,
      variationLibrary.opalSand,
    ],
  },
  {
    id: "desert-lumiere",
    name: "Desert Lumière",
    description:
      "Warm adobe hues with luxury metallic lines overlaid on sweeping dunes.",
    heroImageName: "desert-lumiere-hero.jpg",
    heroMood: "Sun-bleached stone",
    menu: [...baseMenu, "Weekend"],
    variations: [
      variationLibrary.desertAmber,
      variationLibrary.blushChampagne,
      variationLibrary.sunsetCoral,
      variationLibrary.goldenIvy,
      variationLibrary.opalSand,
    ],
  },
  {
    id: "coastal-pearl",
    name: "Coastal Pearl",
    description:
      "Soft ocean breezes, glassy gradients, and an airy serif for seaside vows.",
    heroImageName: "coastal-pearl-hero.jpg",
    heroMood: "Ocean shimmer",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.seaGlass,
      variationLibrary.moonlitLavender,
      variationLibrary.opalSand,
      variationLibrary.midnightNoir,
      variationLibrary.blushChampagne,
    ],
  },
  {
    id: "gilded-twilight",
    name: "Gilded Twilight",
    description:
      "Artful gold foils on charcoal backdrops with luxe art-deco flourishes.",
    heroImageName: "gilded-twilight-hero.jpg",
    heroMood: "Gilded archway",
    menu: [...baseMenu],
    variations: [
      variationLibrary.goldenIvy,
      variationLibrary.midnightNoir,
      variationLibrary.crimsonVelvet,
      variationLibrary.moonlitLavender,
      variationLibrary.blushChampagne,
    ],
  },
  {
    id: "marble-whisper",
    name: "Marble Whisper",
    description:
      "Textured stone, minimalist borders, and calm serif headings for grand halls.",
    heroImageName: "marble-whisper-hero.jpg",
    heroMood: "Marble detail",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.opalSand,
      variationLibrary.gardenEmerald,
      variationLibrary.moonlitLavender,
      variationLibrary.goldenIvy,
      variationLibrary.seaGlass,
    ],
  },
  {
    id: "velvet-noir",
    name: "Velvet Noir",
    description:
      "Dark luxury tinted with jewel-bright florals and a confident serif stack.",
    heroImageName: "velvet-noir-hero.jpg",
    heroMood: "Noir petals",
    menu: [...baseMenu, "Dress Code"],
    variations: [
      variationLibrary.midnightNoir,
      variationLibrary.crimsonVelvet,
      variationLibrary.moonlitLavender,
      variationLibrary.goldenIvy,
      variationLibrary.blushChampagne,
    ],
  },
  {
    id: "moonlit-terrace",
    name: "Moonlit Terrace",
    description:
      "Crescent moons, soft gradients, and lyrical scripts for rooftop celebrations.",
    heroImageName: "moonlit-terrace-hero.jpg",
    heroMood: "Moonlit terrace",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.moonlitLavender,
      variationLibrary.seaGlass,
      variationLibrary.midnightNoir,
      variationLibrary.opalSand,
      variationLibrary.goldenIvy,
    ],
  },
  {
    id: "champagne-skyline",
    name: "Champagne Skyline",
    description:
      "City views, glass sparkle, and wide‐lettered tallcaps that echo skyline bars.",
    heroImageName: "champagne-skyline-hero.jpg",
    heroMood: "City sparkle",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.blushChampagne,
      variationLibrary.goldenIvy,
      variationLibrary.midnightNoir,
      variationLibrary.seaGlass,
      variationLibrary.desertAmber,
    ],
  },
  {
    id: "art-deco-gala",
    name: "Art Deco Gala",
    description:
      "Geometric frames, metallic edges, and graceful type for ballroom dances.",
    heroImageName: "art-deco-gala-hero.jpg",
    heroMood: "Deco geometry",
    menu: [...baseMenu],
    variations: [
      variationLibrary.midnightNoir,
      variationLibrary.crimsonVelvet,
      variationLibrary.goldenIvy,
      variationLibrary.gardenEmerald,
      variationLibrary.moonlitLavender,
    ],
  },
  {
    id: "sunset-vineyard",
    name: "Sunset Vineyard",
    description:
      "Dusty coral shades, leafy wreaths, and flowing serif lines for countryside vows.",
    heroImageName: "sunset-vineyard-hero.jpg",
    heroMood: "Sunset over vines",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.sunsetCoral,
      variationLibrary.blushChampagne,
      variationLibrary.goldenIvy,
      variationLibrary.desertAmber,
      variationLibrary.gardenEmerald,
    ],
  },
  {
    id: "winter-chalet",
    name: "Winter Chalet",
    description:
      "Snowy minimalism, frosted edges, and thin serif text ready for alpine invites.",
    heroImageName: "winter-chalet-hero.jpg",
    heroMood: "Frosted lodge",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.moonlitLavender,
      variationLibrary.midnightNoir,
      variationLibrary.opalSand,
      variationLibrary.seaGlass,
      variationLibrary.goldenIvy,
    ],
  },
  {
    id: "palais-moderne",
    name: "Palais Moderne",
    description:
      "Modern symmetry, asymmetrical menus, and restrained palettes for bold couples.",
    heroImageName: "palais-moderne-hero.jpg",
    heroMood: "Modern gallery",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.seaGlass,
      variationLibrary.gardenEmerald,
      variationLibrary.opalSand,
      variationLibrary.moonlitLavender,
      variationLibrary.midnightNoir,
    ],
  },
  {
    id: "evergreen-ballroom",
    name: "Evergreen Ballroom",
    description:
      "Dark green, gold leaf, and organic script for grand ballroom affairs.",
    heroImageName: "evergreen-ballroom-hero.jpg",
    heroMood: "Emerald canopy",
    menu: [...baseMenu],
    variations: [
      variationLibrary.gardenEmerald,
      variationLibrary.seaGlass,
      variationLibrary.goldenIvy,
      variationLibrary.midnightNoir,
      variationLibrary.blushChampagne,
    ],
  },
  {
    id: "tidal-opulence",
    name: "Tidal Opulence",
    description:
      "Pearlescent shells, gallery grids, and lavish serif type for oceanfront vows.",
    heroImageName: "tidal-opulence-hero.jpg",
    heroMood: "Pearl tide",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.seaGlass,
      variationLibrary.desertAmber,
      variationLibrary.blushChampagne,
      variationLibrary.goldenIvy,
      variationLibrary.moonlitLavender,
    ],
  },
  {
    id: "starlight-ballroom",
    name: "Starlight Ballroom",
    description:
      "Ink pulps, shooting stars, and illuminated script sections for starry affairs.",
    heroImageName: "starlight-ballroom-hero.jpg",
    heroMood: "Star-etched sky",
    menu: [...baseMenu],
    variations: [
      variationLibrary.midnightNoir,
      variationLibrary.moonlitLavender,
      variationLibrary.goldenIvy,
      variationLibrary.crimsonVelvet,
      variationLibrary.seaGlass,
    ],
  },
  {
    id: "silken-alpine",
    name: "Silken Alpine",
    description:
      "Snowy linen, glassy serif strokes, and alpine vistas for high-country vows.",
    heroImageName: "silken-alpine-hero.jpg",
    heroMood: "Winter panorama",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.opalSand,
      variationLibrary.gardenEmerald,
      variationLibrary.moonlitLavender,
      variationLibrary.desertAmber,
      variationLibrary.goldenIvy,
    ],
  },
  {
    id: "horizon-chateau",
    name: "Horizon Château",
    description:
      "Sunrise headlands, crisp script, and luminous galleries for chateau celebrations.",
    heroImageName: "horizon-chateau-hero.jpg",
    heroMood: "Sunrise balcony",
    menu: [...baseMenu, "Accommodations"],
    variations: [
      variationLibrary.blushChampagne,
      variationLibrary.moonlitLavender,
      variationLibrary.seaGlass,
      variationLibrary.desertAmber,
      variationLibrary.midnightNoir,
    ],
  },
  {
    id: "celestial-atelier",
    name: "Celestial Atelier",
    description:
      "Star charts, moonbeams, and airy scripts that feel like a couture atelier.",
    heroImageName: "celestial-atelier-hero.jpg",
    heroMood: "Celestial glow",
    menu: [...baseMenu],
    variations: [
      variationLibrary.moonlitLavender,
      variationLibrary.seaGlass,
      variationLibrary.midnightNoir,
      variationLibrary.goldenIvy,
      variationLibrary.desertAmber,
    ],
  },
];

type WeddingTemplateGalleryProps = {
  selectedTemplateId: string | null;
  selectedVariationId: string | null;
  onTemplateVariationPick: (
    template: WeddingTemplateDefinition,
    variation: TemplateVariation
  ) => void;
};

export default function WeddingTemplateGallery({
  selectedTemplateId,
  selectedVariationId,
  onTemplateVariationPick,
}: WeddingTemplateGalleryProps) {
  return (
    <div className={styles.gallery}>
      {weddingTemplateCatalog.map((template) => {
        const isSelected = template.id === selectedTemplateId;
        const activeVariation =
          template.variations.find((v) => v.id === selectedVariationId) ??
          template.variations[0];

        return (
          <article
            key={template.id}
            className={styles.templateCard}
            data-selected={isSelected ? "true" : undefined}
          >
            <div
              className={styles.hero}
              style={{ background: activeVariation.background }}
            >
              <span className={styles.heroLabel}>{template.heroMood}</span>
              <p className={styles.heroImageName}>
                Placeholder: {template.heroImageName}
              </p>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardTitle}>{template.name}</p>
                  <p className={styles.cardDescription}>{template.description}</p>
                </div>
                <button
                  type="button"
                  className={styles.selectButton}
                  onClick={() => onTemplateVariationPick(template, activeVariation)}
                >
                  {isSelected ? "Selected" : "Use template"}
                </button>
              </div>
              <nav className={styles.menu} aria-label={`${template.name} menu`}>
                {template.menu.map((item) => (
                  <span key={item} className={styles.menuItem}>
                    {item}
                  </span>
                ))}
              </nav>
              <div className={styles.variationRow}>
                {template.variations.map((variation) => {
                  const isActiveVariation =
                    isSelected && variation.id === selectedVariationId;
                  return (
                    <button
                      key={variation.id}
                      type="button"
                      aria-pressed={isActiveVariation}
                      className={`${styles.variationButton} ${
                        isActiveVariation ? styles.variationActive : ""
                      }`}
                      onClick={() => onTemplateVariationPick(template, variation)}
                    >
                      <div className={styles.variationSwatches}>
                        {variation.palette.map((color) => (
                          <span
                            key={color}
                            className={styles.paletteDot}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className={styles.variationLabel}>
                        <span>{variation.label}</span>
                        <small>{variation.tagline}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
