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

export default function PickleballSkin({
  title,
  dateLabel,
  timeLabel,
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
  const pickleballPalette = {
    background: palette?.background || "#073f2d",
    primary: palette?.primary || "#facc15",
    secondary: palette?.secondary || "#0f172a",
    accent: palette?.accent || "#a3e635",
    text: palette?.text || "#f8fafc",
    dominant: palette?.dominant || "#166534",
    themeColor: palette?.themeColor || "#facc15",
  };

  const displayActivities = Array.isArray(activities)
    ? activities
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return (
    <ScannedInviteSkin
      title={title}
      categoryLabel={categoryLabel}
      backgroundCategory="general"
      sportKind="pickleball"
      dateLabel={dateLabel}
      timeLabel={timeLabel}
      location={location}
      imageUrl={imageUrl}
      shareUrl={shareUrl}
      calendarLinks={calendarLinks}
      skinId={skinId}
      palette={pickleballPalette}
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
