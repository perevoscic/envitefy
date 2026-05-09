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
  categoryLabel?: string | null;
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
  detailCopy?: string | null;
  activities?: string[] | null;
  attire?: string | null;
  registryActionLabel?: string | null;
  registryHelperText?: string | null;
  registryName?: string | null;
  registryUrl?: string | null;
  ocrFacts?: OcrFact[] | null;
  actions?: ReactNode;
};

export default function GenericEventSkin({ categoryLabel, ...props }: Props) {
  return <ScannedInviteSkin {...props} categoryLabel={categoryLabel || "General Event"} />;
}
