"use client";

import Image from "next/image";
import { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/components/event-create/TemplateGallery.module.css";
import {
  DEFAULT_PREVIEW,
  resolveTemplateVariation,
  type ResolvedTemplateVariation,
} from "@/components/event-create/TemplateGallery";
import {
  type WeddingTemplateDefinition,
  weddingTemplateCatalog,
} from "@/components/event-create/WeddingTemplateGallery";

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

  const resolvedVariation: ResolvedTemplateVariation = useMemo(() => {
    const variation =
      template.variations.find((v) => v.id === variationId) ??
      template.variations[0];
    return resolveTemplateVariation(variation);
  }, [template, variationId]);

  const previewNames = template.preview?.coupleName ?? DEFAULT_PREVIEW.coupleName;
  const [defaultLeft, defaultRight] = previewNames.split("&").map((s) => s.trim());
  const location = template.preview?.location ?? DEFAULT_PREVIEW.location;
  const [defaultCity, defaultState] = location.split(",").map((s) => s.trim());

  const [partnerOne, setPartnerOne] = useState(defaultLeft ?? "");
  const [partnerTwo, setPartnerTwo] = useState(defaultRight ?? "");
  const [eventDate, setEventDate] = useState(
    parseDateInput(defaultDate ?? template.preview?.dateLabel ?? DEFAULT_PREVIEW.dateLabel)
  );
  const [city, setCity] = useState(defaultCity ?? "");
  const [state, setState] = useState(defaultState ?? "");

  const previewCoupleName =
    partnerOne && partnerTwo
      ? `${partnerOne} & ${partnerTwo}`
      : previewNames;
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
    params.set("variationId", resolvedVariation.id);
    if (eventDate) {
      try {
        const iso = new Date(eventDate).toISOString();
        params.set("d", iso);
      } catch {}
    } else if (defaultDate) {
      params.set("d", defaultDate);
    }
    router.push(`/event/new?${params.toString()}`);
  }, [template.id, resolvedVariation.id, eventDate, defaultDate, router]);

  return (
    <main className="px-5 py-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <article className={styles.templateCard}>
            <div className={styles.cardBody}>
              <div className={styles.previewFrame}>
                <div
                  className={styles.previewHeader}
                  style={{ background: resolvedVariation.background }}
                >
                  <p
                    className={styles.previewNames}
                    style={{
                      color: resolvedVariation.titleColor,
                      fontFamily: resolvedVariation.titleFontFamily,
                      fontWeight:
                        resolvedVariation.titleWeight === "bold"
                          ? 700
                          : resolvedVariation.titleWeight === "semibold"
                          ? 600
                          : 400,
                    }}
                  >
                    {previewCoupleName}
                  </p>
                  <p
                    className={styles.previewMeta}
                    style={{ color: resolvedVariation.titleColor }}
                  >
                    {previewDateLabel} • {previewLocation}
                  </p>
                  <div
                    className={styles.previewNav}
                    style={{ color: resolvedVariation.titleColor }}
                  >
                    {template.menu.slice(0, 7).map((item) => (
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
              Personalize the headline information before continuing to full event setup.
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
