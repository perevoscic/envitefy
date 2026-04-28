"use client";

import type { ReactNode } from "react";
import ScannedInviteSkin from "@/components/ScannedInviteSkin";
import type { OcrFact } from "@/lib/ocr/facts";
import type { OcrSkinBackground } from "@/lib/ocr/skin-background";

type CalendarLinks = {
  google: string;
  outlook: string;
  appleInline: string;
};

type Palette = {
  background?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
  dominant?: string;
  themeColor?: string;
} | null;

type Props = {
  title: string;
  dateLabel?: string | null;
  timeLabel?: string | null;
  venueName?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  shareUrl?: string | null;
  calendarLinks?: CalendarLinks | null;
  categoryLabel?: string | null;
  skinId?: string | null;
  palette?: Palette;
  background?: OcrSkinBackground | null;
  rsvpName?: string | null;
  rsvpPhone?: string | null;
  rsvpEmail?: string | null;
  rsvpUrl?: string | null;
  detailCopy?: string | null;
  activities?: string[] | null;
  attire?: string | null;
  registryUrl?: string | null;
  ocrFacts?: OcrFact[] | null;
  actions?: ReactNode;
};

const BASKETBALL_CHIP_LABELS = ["Game On", "Hoop Time", "Court Ready", "Ball Night"];

function normalizeBasketballActivity(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(?:pickup|pick up|community|event|night|run|game|games|basketball|hoops?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBasketballSummaryActivity(item: string, title: string, categoryLabel?: string | null) {
  const normalizedItem = item
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const normalizedCategory = String(categoryLabel || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!normalizedItem) return true;
  if (normalizedItem === normalizedTitle || normalizedItem === normalizedCategory) return true;
  if (normalizedTitle.length > 0 && normalizedTitle.includes(normalizedItem)) return true;
  if (normalizedTitle.length > 0 && normalizedItem.includes(normalizedTitle)) return true;
  if (
    /^(?:pickup )?basketball (?:open )?run$/.test(normalizedItem) ||
    /^(?:community )?open run$/.test(normalizedItem)
  ) {
    return true;
  }

  const compactItem = normalizeBasketballActivity(item);
  const compactTitle = normalizeBasketballActivity(title);
  if (!compactItem) return true;
  return Boolean(compactTitle && compactItem === compactTitle);
}

function getBasketballChipLabel(title: string, skinId?: string | null): string {
  const seed = `${title || ""}|${skinId || ""}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return BASKETBALL_CHIP_LABELS[hash % BASKETBALL_CHIP_LABELS.length] || "Game On";
}

export default function BasketballSkin({
  title,
  dateLabel,
  timeLabel,
  venueName,
  location,
  imageUrl,
  shareUrl,
  calendarLinks,
  categoryLabel,
  skinId,
  palette,
  background,
  rsvpName,
  rsvpPhone,
  rsvpEmail,
  rsvpUrl,
  detailCopy,
  activities,
  attire,
  registryUrl,
  ocrFacts,
  actions,
}: Props) {
  const basketballPalette = {
    background: palette?.background || "#fff6eb",
    primary: palette?.primary || "#f97316",
    secondary: palette?.secondary || "#111827",
    accent: palette?.accent || "#f59e0b",
    text: palette?.text || "#111827",
    dominant: palette?.dominant || "#f97316",
    themeColor: palette?.themeColor || "#f97316",
  };

  const displayActivities = Array.isArray(activities)
    ? activities
        .map((item) => String(item || "").trim())
        .filter((item) => item && !isBasketballSummaryActivity(item, title, categoryLabel))
        .slice(0, 6)
    : [];
  const displayCategoryLabel =
    String(categoryLabel || "").trim() || getBasketballChipLabel(title, skinId);

  return (
    <ScannedInviteSkin
      title={title}
      categoryLabel={displayCategoryLabel}
      backgroundCategory="basketball"
      dateLabel={dateLabel}
      timeLabel={timeLabel}
      venueName={venueName}
      location={location}
      imageUrl={imageUrl}
      shareUrl={shareUrl}
      calendarLinks={calendarLinks}
      skinId={skinId}
      palette={basketballPalette}
      background={background}
      rsvpName={rsvpName}
      rsvpPhone={rsvpPhone}
      rsvpEmail={rsvpEmail}
      rsvpUrl={rsvpUrl}
      detailCopy={detailCopy}
      activities={displayActivities}
      attire={attire}
      registryUrl={registryUrl}
      ocrFacts={ocrFacts}
      detailLayout="wideDetails"
      actions={actions}
    />
  );
}
