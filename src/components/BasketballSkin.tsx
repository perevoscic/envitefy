"use client";

import type { ReactNode } from "react";
import ScannedInviteSkin from "@/components/ScannedInviteSkin";
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
  actions?: ReactNode;
};

const BASKETBALL_ACTIVITY_DEFAULTS = [
  "Games: 5v5 full-court runs",
  "Pickup: 3v3 half-court games",
  "Training: dribbling and passing stations",
  "Training: shooting reps and free throws",
  "Training: finishing and footwork circuits",
];

export default function BasketballSkin({
  title,
  dateLabel,
  timeLabel,
  location,
  imageUrl,
  shareUrl,
  calendarLinks,
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
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return (
    <ScannedInviteSkin
      title={title}
      categoryLabel="🏀 Basketball Run"
      backgroundCategory="basketball"
      dateLabel={dateLabel}
      timeLabel={timeLabel}
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
      detailCopy={detailCopy || "Games, pickup, and training sessions for all levels."}
      activities={displayActivities.length ? displayActivities : BASKETBALL_ACTIVITY_DEFAULTS}
      attire={attire || "Basketball attire + indoor/outdoor shoes"}
      registryUrl={registryUrl}
      actions={actions}
    />
  );
}
