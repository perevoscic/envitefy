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

export default function GraduationSkin({
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
  const graduationPalette = {
    background: palette?.background || "#f6f2ff",
    primary: palette?.primary || "#5b3cc4",
    secondary: palette?.secondary || "#7c5cff",
    accent: palette?.accent || "#f4b942",
    text: palette?.text || "#1f1633",
    dominant: palette?.dominant || "#5b3cc4",
    themeColor: palette?.themeColor || "#5b3cc4",
  };

  return (
    <ScannedInviteSkin
      title={title}
      categoryLabel="🎓 Graduation Celebration"
      backgroundCategory="graduation"
      dateLabel={dateLabel}
      timeLabel={timeLabel}
      location={location}
      imageUrl={imageUrl}
      shareUrl={shareUrl}
      calendarLinks={calendarLinks}
      skinId={skinId}
      palette={graduationPalette}
      background={background}
      rsvpName={rsvpName}
      rsvpPhone={rsvpPhone}
      rsvpEmail={rsvpEmail}
      rsvpUrl={rsvpUrl}
      detailCopy={detailCopy}
      activities={activities}
      attire={attire}
      registryUrl={registryUrl}
      actions={actions}
    />
  );
}
