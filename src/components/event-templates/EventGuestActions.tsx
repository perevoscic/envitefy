"use client";
import { useTemplateEditor } from "@/components/templates/TemplateEditorContext";

import { CalendarDays, Check, Link, Navigation, Share2 } from "lucide-react";
import { useState } from "react";
import AppleCalendarLink from "@/components/AppleCalendarLink";
import { buildGoogleMapsDirectionsHref } from "@/lib/directions";
import { resolvePublicEventShareUrl } from "@/lib/event-guest-planning";
import { buildCalendarLinks } from "@/utils/calendar-links";
import styles from "./guest-actions.module.css";

type GuestCalendarLinks = {
  appleInline: string;
  google: string;
  outlook: string;
};

export default function EventGuestActions({
  title = "Event invitation",
  start,
  end: eventEnd,
  description = "",
  location = "",
  shareUrl: savedShareUrl,
  eventId,
  preview = false,
  calendarLinks,
  inverse = false,
  timezone,
  allDay: suppliedAllDay,
}: {
  title?: string;
  start?: string | null;
  end?: string | null;
  description?: string;
  location?: string | null;
  shareUrl?: string | null;
  eventId?: string;
  preview?: boolean;
  calendarLinks?: GuestCalendarLinks | null;
  inverse?: boolean;
  timezone?: string;
  allDay?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const templateEditor = useTemplateEditor();
  const [manualShareUrl, setManualShareUrl] = useState("");
  const destination = location || "";
  const validStart = start && !Number.isNaN(Date.parse(start));
  let links = calendarLinks;
  if (!links && validStart && start) {
    const allDay = suppliedAllDay ?? /^\d{4}-\d{2}-\d{2}$/.test(start);
    const end = new Date(start);
    if (allDay) end.setUTCDate(end.getUTCDate() + 1);
    const fallbackEnd = allDay ? end.toISOString().slice(0, 10) : start;
    links = buildCalendarLinks({
      title,
      eventUrl: savedShareUrl || undefined,
      description,
      timezone,
      location: destination,
      startIso: start,
      endIso: eventEnd && Date.parse(eventEnd) > Date.parse(start) ? eventEnd : fallbackEnd,
      allDay,
      reminders: null,
      recurrence: null,
    });
  }

  const handleShare = async () => {
    if (templateEditor) { await templateEditor.requestSave(); return; }
    setCopied(false);
    setManualShareUrl("");
    const shareUrl = resolvePublicEventShareUrl({
      shareUrl: savedShareUrl,
      eventId,
      origin: window.location.origin,
      preview,
    });
    if (!shareUrl) {
      setMessage("Publish your event to get a shareable link.");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
        setMessage("Event shared.");
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setMessage("Event link copied.");
    } catch {
      setManualShareUrl(shareUrl);
      setMessage("Copy your event link below.");
    }
  };

  const buttonClass = styles.button;

  return (
    <section
      aria-label="Plan your visit"
      className={styles.actions}
      style={inverse ? { color: "#ffffff" } : undefined}
    >
      {start &&
      eventEnd &&
      Date.parse(eventEnd) > Date.parse(start) &&
      !suppliedAllDay &&
      !/^\d{4}-\d{2}-\d{2}$/.test(start) ? (
        <p className="mb-4 text-sm font-medium">
          Ends{" "}
          {new Date(eventEnd).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            ...(timezone ? { timeZone: timezone } : {}),
          })}
        </p>
      ) : null}
      <div className="flex flex-wrap items-start justify-center gap-3">
        {links ? (
          <details className="group relative">
            <summary
              className={`${buttonClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" /> Add to calendar
            </summary>
            <div className={styles.menu}>
              <AppleCalendarLink href={links.appleInline}>Apple Calendar</AppleCalendarLink>
              <a href={links.google} target="_blank" rel="noopener noreferrer">
                Google Calendar
              </a>
              <a href={links.outlook} target="_blank" rel="noopener noreferrer">
                Outlook Calendar
              </a>
            </div>
          </details>
        ) : null}
        {destination ? (
          <a
            href={buildGoogleMapsDirectionsHref(destination)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
          >
            <Navigation className="h-4 w-4" aria-hidden="true" /> Get directions
          </a>
        ) : null}
        <button type="button" onClick={() => void handleShare()} className={buttonClass}>
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Share2 className="h-4 w-4" aria-hidden="true" />
          )}{" "}
          {copied ? "Link copied" : "Share event"}
        </button>
      </div>
      {message ? (
        <p role="status" className="mx-auto mt-3 max-w-lg text-sm">
          {message}
        </p>
      ) : null}
      {manualShareUrl ? (
        <label className="mx-auto mt-3 flex max-w-lg items-center gap-2">
          <Link className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Event link</span>
          <input
            readOnly
            value={manualShareUrl}
            onFocus={(event) => event.currentTarget.select()}
            className={styles.copyInput}
          />
        </label>
      ) : null}
    </section>
  );
}
