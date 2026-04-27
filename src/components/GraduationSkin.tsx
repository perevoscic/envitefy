"use client";

import type { ReactNode } from "react";
import ScannedInviteSkin from "@/components/ScannedInviteSkin";

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
  calendarLinks?: CalendarLinks | null;
  palette?: Palette;
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
  calendarLinks,
  palette,
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
  const graduationActivities =
    Array.isArray(activities) && activities.length
      ? activities
      : ["Commencement", "Photo Moments", "Celebration Gathering"];

  return (
    <ScannedInviteSkin
      title={title}
      categoryLabel="🎓 Graduation Celebration"
      dateLabel={dateLabel}
      timeLabel={timeLabel}
      location={location}
      imageUrl={imageUrl}
      calendarLinks={calendarLinks}
      palette={graduationPalette}
      rsvpName={rsvpName}
      rsvpPhone={rsvpPhone}
      rsvpEmail={rsvpEmail}
      rsvpUrl={rsvpUrl}
      detailCopy={
        detailCopy ||
        "Join us to honor the graduate, celebrate this milestone, and capture memories together."
      }
      activities={graduationActivities}
      attire={attire || "Grad celebration attire"}
      registryUrl={registryUrl}
      actions={actions}
    />
  );
}
