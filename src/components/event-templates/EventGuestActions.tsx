"use client";
import { useTemplateEditor } from "@/components/templates/TemplateEditorContext";

import { CalendarPlus, Check, Link, Navigation, Share2, X } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import CalendarAction from "@/components/CalendarAction";
import { buildGoogleMapsDirectionsHref } from "@/lib/directions";
import { resolvePublicEventShareUrl } from "@/lib/event-guest-planning";
import {
  EVENT_GUEST_ACTIONS,
  type EventGuestActionId,
  type EventGuestActionVisibility,
} from "@/lib/event-guest-actions";
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
  compactMobile = false,
  visibility = {},
  onVisibilityChange,
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
  compactMobile?: boolean;
  visibility?: EventGuestActionVisibility;
  onVisibilityChange?: (value: EventGuestActionVisibility) => void;
}) {
  const actionsRef = useRef<HTMLElement>(null);
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
    if (templateEditor) {
      await templateEditor.requestSave();
      return;
    }
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
  const hiddenActions = EVENT_GUEST_ACTIONS.filter(({ id }) => visibility[id] === false);
  const action = (id: EventGuestActionId, content: ReactNode) => {
    if (visibility[id] === false) return null;
    if (!onVisibilityChange) return content;
    const label = EVENT_GUEST_ACTIONS.find((item) => item.id === id)!.label;
    return (
      <div className={styles.editableAction}>
        {content}
        <button
          type="button"
          className={styles.removeAction}
          data-remove-action={id}
          aria-label={`Remove ${label}`}
          title={`Remove ${label}`}
          onClick={() => {
            onVisibilityChange({ ...visibility, [id]: false });
            setMessage(`${label} removed. You can restore it below.`);
            if (id === "share") setManualShareUrl("");
            requestAnimationFrame(() =>
              actionsRef.current
                ?.querySelector<HTMLButtonElement>(`[data-restore-action="${id}"]`)
                ?.focus({ preventScroll: true }),
            );
          }}
        >
          <span>
            <X size={14} aria-hidden="true" />
          </span>
        </button>
      </div>
    );
  };
  if (hiddenActions.length === EVENT_GUEST_ACTIONS.length && !onVisibilityChange) return null;

  return (
    <section
      ref={actionsRef}
      aria-label="Plan your visit"
      className={`${styles.actions} ${compactMobile ? styles.compactMobile : ""}`}
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
      <div className={`${styles.actionRow} flex flex-wrap items-start justify-center gap-3`}>
        {action(
          "calendar",
          links ? (
            <CalendarAction links={links} className={buttonClass}>
              {compactMobile
                ? (label) => (
                    <>
                      <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className={styles.fullLabel}>{label}</span>
                      <span className={styles.shortLabel} aria-hidden="true">
                        Calendar
                      </span>
                    </>
                  )
                : undefined}
            </CalendarAction>
          ) : onVisibilityChange ? (
            <button type="button" className={buttonClass} disabled>
              <CalendarPlus size={16} aria-hidden="true" />
              Add to calendar
            </button>
          ) : null,
        )}
        {action(
          "directions",
          destination ? (
            <a
              href={buildGoogleMapsDirectionsHref(destination)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass}
              aria-label="Get directions"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              <span className={styles.fullLabel}>Get directions</span>
              {compactMobile && (
                <span className={styles.shortLabel} aria-hidden="true">
                  Directions
                </span>
              )}
            </a>
          ) : onVisibilityChange ? (
            <button type="button" className={buttonClass} disabled>
              <Navigation size={16} aria-hidden="true" />
              Get directions
            </button>
          ) : null,
        )}
        {action(
          "share",
          <button
            type="button"
            onClick={() => void handleShare()}
            className={buttonClass}
            aria-label={copied ? "Link copied" : "Share event"}
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Share2 className="h-4 w-4" aria-hidden="true" />
            )}{" "}
            <span className={styles.fullLabel}>{copied ? "Link copied" : "Share event"}</span>
            {compactMobile && (
              <span className={styles.shortLabel} aria-hidden="true">
                {copied ? "Copied" : "Share"}
              </span>
            )}
          </button>,
        )}
      </div>
      {onVisibilityChange && hiddenActions.length > 0 && (
        <div className={styles.restoreActions} role="group" aria-label="Removed actions">
          {hiddenActions.map(({ id, restoreLabel }) => (
            <button
              key={id}
              type="button"
              data-restore-action={id}
              onClick={() => {
                onVisibilityChange({ ...visibility, [id]: true });
                setMessage(`${restoreLabel} restored.`);
                requestAnimationFrame(() =>
                  actionsRef.current
                    ?.querySelector<HTMLButtonElement>(`[data-remove-action="${id}"]`)
                    ?.focus({ preventScroll: true }),
                );
              }}
            >
              + Restore {restoreLabel}
            </button>
          ))}
        </div>
      )}
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
