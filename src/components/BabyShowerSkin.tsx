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
  skinId?: string | null;
  palette?: Palette;
  background?: OcrSkinBackground | null;
  rsvpName?: string | null;
  rsvpPhone?: string | null;
  rsvpEmail?: string | null;
  rsvpUrl?: string | null;
  rsvpSenderName?: string | null;
  rsvpSenderEmail?: string | null;
  detailCopy?: string | null;
  activities?: string[] | null;
  attire?: string | null;
  registryActionLabel?: string | null;
  registryHelperText?: string | null;
  registryName?: string | null;
  registryUrl?: string | null;
  ocrFacts?: OcrFact[] | null;
  footerPrefix?: string | null;
  actions?: ReactNode;
};

export default function BabyShowerSkin({
  title,
  dateLabel,
  timeLabel,
  venueName,
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
  rsvpSenderName,
  rsvpSenderEmail,
  detailCopy,
  activities,
  attire,
  registryActionLabel,
  registryHelperText,
  registryName,
  registryUrl,
  ocrFacts,
  footerPrefix,
  actions,
}: Props) {
  const babyShowerPalette = {
    background: palette?.background || "#fdf7ff",
    primary: palette?.primary || "#8f63d8",
    secondary: palette?.secondary || "#b08ce8",
    accent: palette?.accent || "#f3b8d0",
    text: palette?.text || "#2f1f45",
    dominant: palette?.dominant || "#8f63d8",
    themeColor: palette?.themeColor || "#8f63d8",
  };

  return (
    <ScannedInviteSkin
      title={title}
      categoryLabel="🍼 Baby Shower"
      backgroundCategory="baby shower"
      dateLabel={dateLabel}
      timeLabel={timeLabel}
      venueName={venueName}
      location={location}
      imageUrl={imageUrl}
      shareUrl={shareUrl}
      calendarLinks={calendarLinks}
      skinId={skinId}
      palette={babyShowerPalette}
      background={background}
      rsvpName={rsvpName}
      rsvpPhone={rsvpPhone}
      rsvpEmail={rsvpEmail}
      rsvpUrl={rsvpUrl}
      rsvpSenderName={rsvpSenderName}
      rsvpSenderEmail={rsvpSenderEmail}
      detailCopy={detailCopy}
      activities={activities}
      attire={attire}
      registryActionLabel={registryActionLabel}
      registryHelperText={registryHelperText}
      registryName={registryName}
      registryUrl={registryUrl}
      ocrFacts={ocrFacts}
      detailLayout="wideDetails"
      footerPrefix={footerPrefix}
      actions={actions}
    />
  );
}
