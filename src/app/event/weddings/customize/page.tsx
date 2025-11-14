"use client";

import Image from "next/image";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/components/event-create/TemplateGallery.module.css";
import {
  DEFAULT_PREVIEW,
  resolveTemplateVariation,
  type ResolvedTemplateVariation,
  type TemplateGalleryVariation,
} from "@/components/event-create/TemplateGallery";
import {
  type WeddingTemplateDefinition,
  weddingTemplateCatalog,
} from "@/components/event-create/WeddingTemplateGallery";
import {
  getPaletteToken,
  type TemplatePaletteToken,
} from "@/components/event-create/templateDesignTokens";

const NAME_ADJECTIVES = [
  "Aurora",
  "Solstice",
  "Moonlit",
  "Gilded",
  "Velour",
  "Opaline",
  "Celadon",
  "Saffron",
  "Marigold",
  "Azure",
  "Petal",
  "Ivory",
];

const NAME_NOUNS = [
  "Prism",
  "Veil",
  "Serenade",
  "Waltz",
  "Grove",
  "Cascade",
  "Fable",
  "Chateau",
  "Harbor",
  "Symphony",
  "Garden",
  "Canvas",
];

const TAGLINE_VARIANTS = [
  "Dreamy twilight glaze",
  "Sunset champagne drift",
  "Candlelit linen wash",
  "Deep emerald flourish",
  "Dusky heirloom luster",
  "Opal shoreline shimmer",
  "Moonbeam botanical glow",
  "Velvet midnight bloom",
  "Amber orchard radiance",
  "Iridescent gallery haze",
  "Rosy garden lanterns",
  "Silvered skyline gleam",
];

function hashSeed(seed: string) {
  return seed
    .split("")
    .reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
}

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, value));
}

function adjustHex(hex: string, delta: number) {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const nextR = clampChannel(r + delta);
  const nextG = clampChannel(g + Math.round(delta * 0.6));
  const nextB = clampChannel(b - Math.round(delta * 0.4));
  return `#${((nextR << 16) | (nextG << 8) | nextB)
    .toString(16)
    .padStart(6, "0")}`;
}

function adjustGradientStops(gradient: string, delta: number) {
  return gradient.replace(/#([0-9a-fA-F]{6})/g, (match) =>
    adjustHex(match, delta)
  );
}

function generateLabel(seed: string) {
  const hash = Math.abs(hashSeed(seed));
  const adjective = NAME_ADJECTIVES[hash % NAME_ADJECTIVES.length];
  const noun = NAME_NOUNS[(hash >> 3) % NAME_NOUNS.length];
  const tagline = TAGLINE_VARIANTS[(hash >> 5) % TAGLINE_VARIANTS.length];
  return { label: `${adjective} ${noun}`, tagline };
}

function buildAlternatePalette(
  base: TemplatePaletteToken,
  seed: string,
  label: string
): TemplatePaletteToken {
  const hash = hashSeed(seed);
  const rotation = base.swatches.length ? hash % base.swatches.length : 0;
  const shift = (hash % 120) - 60;
  const swatches = base.swatches.map((color, idx) =>
    adjustHex(color, shift + (idx - rotation) * 9)
  );
  const rotated =
    rotation === 0
      ? swatches
      : [...swatches.slice(rotation), ...swatches.slice(0, rotation)];
  const background = adjustGradientStops(base.background, shift * 0.9);
  const titleColor = adjustHex(base.titleColor, -shift * 0.7);
  return {
    ...base,
    id: `${base.id}-alt-${seed.slice(-5)}`,
    label,
    tagline: base.tagline,
    swatches: rotated,
    background,
    titleColor,
  };
}

function createExtraVariations(
  templateId: string,
  variations: TemplateGalleryVariation[]
): TemplateGalleryVariation[] {
  const uniqueBaseIds = new Set<string>();
  const deterministicSources = [...variations].sort((a, b) => {
    const aKey = (a.paletteId ?? a.id).toString();
    const bKey = (b.paletteId ?? b.id).toString();
    return aKey.localeCompare(bKey);
  });
  const selected: TemplateGalleryVariation[] = [];
  for (const variation of deterministicSources) {
    const baseId = variation.paletteId ?? variation.id;
    if (!uniqueBaseIds.has(baseId)) {
      selected.push(variation);
      uniqueBaseIds.add(baseId);
    }
    if (selected.length === Math.min(variations.length, 2)) break;
  }
  while (selected.length < Math.min(variations.length, 2)) {
    selected.push(variations[selected.length % variations.length]);
  }

  return selected.map((variation, idx) => {
    const seed = `${templateId}-${variation.id}-alt-${idx}`;
    const basePalette =
      variation.palette ??
      (variation.paletteId
        ? getPaletteToken(variation.paletteId)
        : getPaletteToken(undefined));
    const { label, tagline } = generateLabel(seed);
    const palette = buildAlternatePalette(basePalette, seed, label);
    return {
      ...variation,
      id: `alt-${templateId}-${idx}-${seed.slice(-4)}`,
      label,
      tagline,
      palette,
      paletteId: undefined,
    };
  });
}

function parseDateInput(label?: string | null) {
  if (!label) return "";
  const parsed = new Date(label);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatDateLabel(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(parsed);
  } catch {
    return parsed.toDateString();
  }
}

function getTemplateById(id?: string | null): WeddingTemplateDefinition {
  if (!id) return weddingTemplateCatalog[0];
  return (
    weddingTemplateCatalog.find((template) => template.id === id) ??
    weddingTemplateCatalog[0]
  );
}

export default function WeddingTemplateCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();

  const templateId = search?.get("templateId") ?? weddingTemplateCatalog[0].id;
  const variationId = search?.get("variationId") ?? "";
  const defaultDate = search?.get("d") ?? undefined;

  const template = useMemo(() => getTemplateById(templateId), [templateId]);

  const extraVariations = useMemo(
    () => createExtraVariations(template.id, template.variations),
    [template]
  );

  const resolvedVariations = useMemo(
    () =>
      [...template.variations, ...extraVariations].map((variation) =>
        resolveTemplateVariation(variation)
      ),
    [template, extraVariations]
  );

  const [activeVariationId, setActiveVariationId] = useState(
    variationId || resolvedVariations[0]?.id
  );

  useEffect(() => {
    setActiveVariationId(variationId || resolvedVariations[0]?.id);
  }, [variationId, resolvedVariations]);

  const activeVariation: ResolvedTemplateVariation =
    resolvedVariations.find((v) => v.id === activeVariationId) ??
    resolvedVariations[0];

  const previewNames =
    template.preview?.coupleName ?? DEFAULT_PREVIEW.coupleName;
  const [defaultLeft, defaultRight] = previewNames
    .split("&")
    .map((s) => s.trim());
  const location = template.preview?.location ?? DEFAULT_PREVIEW.location;
  const [defaultCity, defaultState] = location.split(",").map((s) => s.trim());

  const [partnerOne, setPartnerOne] = useState(defaultLeft ?? "");
  const [partnerTwo, setPartnerTwo] = useState(defaultRight ?? "");
  const [eventDate, setEventDate] = useState(
    parseDateInput(
      defaultDate ?? template.preview?.dateLabel ?? DEFAULT_PREVIEW.dateLabel
    )
  );
  const [city, setCity] = useState(defaultCity ?? "");
  const [state, setState] = useState(defaultState ?? "");

  const previewCoupleName =
    partnerOne && partnerTwo ? `${partnerOne} & ${partnerTwo}` : previewNames;
  const previewDateLabel =
    formatDateLabel(eventDate) ??
    template.preview?.dateLabel ??
    DEFAULT_PREVIEW.dateLabel;
  const previewLocation =
    city || state ? [city, state].filter(Boolean).join(", ") : location;

  const heroImageSrc = `/templates/wedding-placeholders/${template.heroImageName}`;

  const handleContinue = useCallback(() => {
    const params = new URLSearchParams();
    params.set("templateId", template.id);
    params.set("variationId", activeVariation.id);
    if (eventDate) {
      try {
        const iso = new Date(eventDate).toISOString();
        params.set("d", iso);
      } catch {}
    } else if (defaultDate) {
      params.set("d", defaultDate);
    }
    router.push(`/event/new?${params.toString()}`);
  }, [template.id, activeVariation.id, eventDate, defaultDate, router]);

  return (
    <main className="px-5 py-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <article className={styles.templateCard}>
            <div className={styles.cardBody}>
              <div className={styles.previewFrame}>
                <div
                  className={styles.previewHeader}
                  style={{ background: activeVariation.background }}
                >
                  <p
                    className={styles.previewNames}
                    style={{
                      color: activeVariation.titleColor,
                      fontFamily: activeVariation.titleFontFamily,
                      fontSize: "2rem",
                      fontWeight:
                        activeVariation.titleWeight === "bold"
                          ? 700
                          : activeVariation.titleWeight === "semibold"
                          ? 600
                          : 400,
                    }}
                  >
                    {previewCoupleName}
                  </p>
                  <p
                    className={styles.previewMeta}
                    style={{ color: activeVariation.titleColor }}
                  >
                    {previewDateLabel} • {previewLocation}
                  </p>
                  <div
                    className={styles.previewNav}
                    style={{ color: activeVariation.titleColor }}
                  >
                    {template.menu.slice(0, 8).map((item) => (
                      <span key={item} className={styles.previewNavItem}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.previewPhoto}>
                  <Image
                    src={heroImageSrc}
                    alt={`${template.name} preview`}
                    width={640}
                    height={360}
                    className={styles.previewPhotoImage}
                    priority={false}
                  />
                </div>
              </div>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardTitle}>{template.name}</p>
                </div>
              </div>
              <div className={styles.variationSection}>
                <span className={styles.variationKicker}>Color stories</span>
                <div className={styles.variationRow}>
                  {resolvedVariations.map((variation) => {
                    const isActive = variation.id === activeVariation.id;
                    return (
                      <button
                        key={variation.id}
                        type="button"
                        aria-pressed={isActive}
                        className={`${styles.variationButton} ${
                          isActive ? styles.variationActive : ""
                        }`}
                        onClick={() => setActiveVariationId(variation.id)}
                      >
                        <div className={styles.variationSwatches}>
                          {variation.swatches.map((color) => (
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
            </div>
          </article>
        </div>
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-md">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
              Customize
            </p>
            <h2 className="text-2xl font-semibold text-stone-900">
              Add your details
            </h2>
            <p className="text-sm text-stone-600">
              Personalize the headline information before continuing to full
              event setup.
            </p>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-stone-700">
              Partner one
              <input
                type="text"
                value={partnerOne}
                onChange={(e) => setPartnerOne(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                placeholder="First partner name"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Partner two
              <input
                type="text"
                value={partnerTwo}
                onChange={(e) => setPartnerTwo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                placeholder="Second partner name"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Event date
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-stone-700">
                City
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                State
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                />
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-stone-800"
          >
            Continue to details
          </button>
        </div>
      </section>
    </main>
  );
}
