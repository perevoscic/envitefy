"use client";

import { Check, Share2 } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import CalendarAction from "@/components/CalendarAction";
import { buildGoogleMapsDirectionsHref } from "@/lib/directions";
import { buildCalendarLinks } from "@/utils/calendar-links";
import type { EventData } from "./BirthdayRenderer";

type GuestCalendarLinks = {
  appleInline: string;
  google: string;
  outlook: string;
};

const BirthdayActionContext = createContext< {
  links?: GuestCalendarLinks | null;
  destination: string;
  share: () => Promise<void>;
  message: string;
  copied: boolean;
  manualShareUrl: string;
} | null>(null);

export default function BirthdayGuestActionsProvider({
  event,
  eventId,
  calendarLinks,
  location,
  children,
}: {
  event: EventData;
  eventId?: string;
  calendarLinks?: GuestCalendarLinks | null;
  location?: string | null;
  children: ReactNode;
}) {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [manualShareUrl, setManualShareUrl] = useState("");
  const destination =
    location ||
    event.location ||
    [event.venue?.name, event.venue?.address].filter(Boolean).join(", ");
  const validStart = event.date && !Number.isNaN(Date.parse(event.date));
  let links = calendarLinks;
  if (!links && validStart && event.date) {
    const allDay = /^\d{4}-\d{2}-\d{2}$/.test(event.date);
    const end = new Date(event.date);
    if (allDay) end.setUTCDate(end.getUTCDate() + 1);
    const fallbackEnd = allDay ? end.toISOString().slice(0, 10) : event.date;
    links = buildCalendarLinks({
      title: event.headlineTitle || `${event.birthdayName || "Birthday"}'s celebration`,
      eventUrl: event.shareUrl || undefined,
      description: event.story || "",
      location: destination,
      startIso: event.date,
      endIso: event.end && Date.parse(event.end) > Date.parse(event.date) ? event.end : fallbackEnd,
      allDay,
      reminders: null,
      recurrence: null,
    });
  }

  const handleShare = async () => {
    setCopied(false);
    setManualShareUrl("");
    let shareUrl = "";
    if (event.shareUrl) {
      try {
        const candidate = new URL(event.shareUrl, window.location.origin);
        if (
          (candidate.protocol === "https:" || candidate.protocol === "http:") &&
          /^\/(event|card)\/[^/]+\/?$/.test(candidate.pathname)
        ) {
          shareUrl = candidate.href;
        }
      } catch {
        // A malformed saved URL can fall back to the public event route.
      }
    }
    if (!shareUrl && eventId)
      shareUrl = `${window.location.origin}/event/${encodeURIComponent(eventId)}`;
    if (!shareUrl) {
      setMessage("Publish your invitation to get a shareable link.");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.headlineTitle || "Birthday invitation",
          url: shareUrl,
        });
        setMessage("Invitation shared.");
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setMessage("Invitation link copied.");
    } catch {
      setManualShareUrl(shareUrl);
      setMessage("Copy your invitation link below.");
    }
  };

  return <BirthdayActionContext.Provider value={{ links, destination, share: handleShare, message, copied, manualShareUrl }}>{children}</BirthdayActionContext.Provider>;
}

// The layout supplies the visible date, venue, and invitation treatment.
// These primitives provide behavior without adding a shared action-strip layout.
export function BirthdayCalendarDate({ children }: { children: ReactNode }) {
  const actions = useContext(BirthdayActionContext);
  if (!actions?.links) return <>{children}</>;
  const { links } = actions;
  return (
    <span className="basis-auto" data-birthday-calendar>
      <CalendarAction links={links} className="inline-flex min-h-11 flex-wrap items-center gap-2 border-b border-current/30 py-2 text-left underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2">
        {(label) => <>{children}<small className="text-xs font-medium">{label}</small></>}
      </CalendarAction>
    </span>
  );
}

export function BirthdayVenueLink({ children }: { children: ReactNode }) {
  const actions = useContext(BirthdayActionContext);
  if (!actions?.destination) return <span className="inline-flex items-center gap-2">{children}</span>;
  return <a href={buildGoogleMapsDirectionsHref(actions.destination)} target="_blank" rel="noopener noreferrer" aria-label={`Get directions to ${actions.destination}`} className="inline-flex min-h-11 items-center gap-2 border-b border-current/30 py-2 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2">{children}</a>;
}

export function BirthdayShareControl({ className }: { className: string }) {
  const actions = useContext(BirthdayActionContext);
  if (!actions) return null;
  return <>
    <button type="button" onClick={() => void actions.share()} className={className}>
      {actions.copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      {actions.copied ? "Link copied" : "Share invitation"}
    </button>
    {actions.message ? <p role="status" className="basis-full text-sm font-normal">{actions.message}</p> : null}
    {actions.manualShareUrl ? <label className="basis-full text-sm">Invitation link<input readOnly value={actions.manualShareUrl} onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full border border-current bg-transparent p-3" /></label> : null}
  </>;
}
