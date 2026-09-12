"use client";
import TemplateImageTone from "@/components/events/TemplateImageTone";
import { type CSSProperties, type ReactNode, useState } from "react";
import CalendarAction from "@/components/CalendarAction";
import { buildCalendarLinks } from "@/utils/calendar-links";
import { buildGoogleMapsDirectionsHref } from "@/lib/directions";
import { resolvePublicEventShareUrl } from "@/lib/event-guest-planning";
import type { BabyShowerDesign } from "@/lib/baby-shower-designs";
import "@/components/birthdays/redesign/birthday-fonts.css";
import styles from "./baby-shower-designs.module.css";

export function babyShowerDesignStyle(design: BabyShowerDesign): CSSProperties {
  return {
    "--baby-paper": design.colors.background,
    "--baby-ink": design.colors.text,
    "--baby-accent": design.colors.accent,
    "--baby-font": `"${design.displayFont}", Georgia, serif`,
  } as CSSProperties;
}

export default function BabyShowerDesignHero({
  design,
  babyName,
  momName,
  eventTitle,
  heroImage,
  filterEnabled = true,
  dateLabel,
  timeLabel,
  location,
  fontFamily,
  eventId,
  shareUrl,
  start,
  end,
  preview = false,
  thumbnail = false,
  fontSize,
  ownerActions,
}: {
  design: BabyShowerDesign;
  babyName?: string;
  momName?: string;
  eventTitle: string;
  heroImage: string;
  filterEnabled?: boolean;
  dateLabel: string | null;
  timeLabel: string | null;
  location?: string;
  fontFamily?: string;
  eventId: string;
  shareUrl: string;
  start?: string;
  end?: string;
  preview?: boolean;
  thumbnail?: boolean;
  fontSize?: string;
  ownerActions?: ReactNode;
}) {
  const [shareMessage, setShareMessage] = useState("");
  const calendar = start ? buildCalendarLinks({ title: eventTitle, startIso: start, endIso: end || start, description: "", location: location || "", allDay: false, reminders: null, recurrence: null }) : null;
  const share = async () => {
    const url = resolvePublicEventShareUrl({ shareUrl, eventId, preview, origin: window.location.origin });
    if (!url) { setShareMessage("Publish your event to get a shareable link."); return; }
    try {
      if (navigator.share) await navigator.share({ title: eventTitle, url });
      else { await navigator.clipboard.writeText(url); setShareMessage("Invitation link copied."); }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) setShareMessage(url);
    }
  };
  return (
    <TemplateImageTone color={design.colors.accent} enabled={filterEnabled}>
<header className={styles.hero} data-baby-scene={design.id}>
      <div className={styles.art}>
        <img src={heroImage} alt={design.subject} className={`template-hero-image ${styles.image}`} />
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>You’re invited · Baby shower</p>
        <p className={styles.headline}>{design.sample.headline}</p>
        <h1 className={styles.title} data-size={fontSize} style={fontFamily ? { fontFamily } : undefined}>
          {babyName ? <>Celebrating<br /><span>{babyName}</span></> : eventTitle}
        </h1>
        {momName && <p className={styles.dedication}>With love for {momName} and the little one</p>}
        {ownerActions && <div className={styles.ownerActions}>{ownerActions}</div>}
      </div>
      <div className={styles.facts}>
        <div className={styles.when}>
          {dateLabel && (calendar && !thumbnail ? <CalendarAction links={calendar} className={styles.calendar}>
            {(label) => <>{dateLabel}<small>{label}</small></>}
          </CalendarAction> : <p>{dateLabel}</p>)}
          {timeLabel && <p>{timeLabel}</p>}
        </div>
        {location && <p className={styles.where}>{thumbnail ? location : <a href={buildGoogleMapsDirectionsHref(location)} target="_blank" rel="noreferrer">{location}<small>Get directions</small></a>}</p>}
        {!thumbnail && <div className={styles.share}><button type="button" onClick={share}>Share invitation</button>{shareMessage && <p role="status">{shareMessage}</p>}</div>}
      </div>
    </header>
</TemplateImageTone>
  );
}
