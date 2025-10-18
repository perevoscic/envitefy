"use client";
import React, { useMemo, useState } from "react";
import { combineVenueAndLocation } from "@/lib/mappers";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { useSession } from "next-auth/react";
import EventShareThankYouModal from "./EventShareThankYouModal";

try {
  const globalObj = globalThis as typeof globalThis & {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    findPhone?: () => string | null;
  };
  if (globalObj && typeof globalObj.findPhone !== "function") {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    globalObj.findPhone = () => null;
  }
} catch {
  // Ignore if globalThis is not available.
}

type EventFields = {
  title: string;
  start: string | null;
  end: string | null;
  location?: string | null;
  venue?: string | null;
  description?: string | null;
  timezone?: string | null;
  reminders?: { minutes: number }[] | null;
  rsvp?: string | null;
};

export default function EventActions({
  shareUrl,
  event,
  className,
  historyId,
}: {
  shareUrl: string;
  event: EventFields | null;
  className?: string;
  historyId?: string;
}) {
  // No visible inputs; infer contact targets from event details
  const { data: session } = useSession();
  const absoluteUrl = useMemo(() => {
    try {
      if (!shareUrl) return "";
      if (/^https?:\/\//i.test(shareUrl)) return shareUrl;
      if (typeof window !== "undefined") {
        return new URL(shareUrl, window.location.origin).toString();
      }
      return shareUrl;
    } catch {
      return shareUrl;
    }
  }, [shareUrl]);

  const combinedLocation = useMemo(() => {
    return combineVenueAndLocation(event?.venue ?? null, event?.location ?? null);
  }, [event?.venue, event?.location]);

  const safeEvent = useMemo(() => {
    if (!event) return null;
    const start = event.start || null;
    const end = event.end || null;
    if (!start) return null;

    let computedEnd = end || null;
    if (!computedEnd) {
      const parsedStart = new Date(start);
      const startTime = parsedStart.getTime();
      if (!Number.isNaN(startTime)) {
        const fallbackEnd = new Date(startTime + 90 * 60 * 1000);
        const fallbackTime = fallbackEnd.getTime();
        if (!Number.isNaN(fallbackTime)) {
          try {
            computedEnd = fallbackEnd.toISOString();
          } catch {
            computedEnd = null;
          }
        }
      }
    }

    return {
      ...event,
      start,
      end: computedEnd,
      location: combinedLocation,
    } as EventFields;
  }, [combinedLocation, event]);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareFirstName, setShareFirstName] = useState("");
  const [shareLastName, setShareLastName] = useState("");
  const [shareState, setShareState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [shareError, setShareError] = useState<string | null>(null);
  const [showShareThankYou, setShowShareThankYou] = useState(false);
  const [sharedRecipientEmail, setSharedRecipientEmail] = useState<string>("");

  const onShare = async () => {
    try {
      if (historyId) {
        setShareError(null);
        setShareState("idle");
        setShareEmail("");
        setShareOpen(true);
        return;
      }
      const url =
        absoluteUrl ||
        (typeof window !== "undefined" ? window.location.href : "");
      if ((navigator as any).share) {
        await (navigator as any).share({ title: event?.title || "Event", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      // eslint-disable-next-line no-alert
      alert("Link copied to clipboard");
    } catch {}
  };

  const findEmail = (): string | null => {
    const text = `${event?.description || ""}`;
    const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return m ? m[0] : null;
  };

  const rsvpPhone = useMemo(() => {
    const rsvp = event?.rsvp || "";
    const text = `${rsvp} ${event?.description || ""} ${combinedLocation || ""}`;
    return extractFirstPhoneNumber(text);
  }, [combinedLocation, event]);

  // Legacy RSVP logic used a phone lookup helper. Keep a stub so any stale bundles
  // referencing `findPhone` during hot reloads keep working without throwing.
  const legacyFindPhone = (): string | null => rsvpPhone;
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
  const findPhone = legacyFindPhone;

  const formatDateRange = (
    startIso: string | null | undefined,
    endIso: string | null | undefined,
    timeZone?: string
  ): string => {
    try {
      if (!startIso) return "";
      const start = new Date(startIso);
      const end = endIso ? new Date(endIso) : null;
      const dateFmt = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timeZone || undefined,
      });
      const sameDay =
        end &&
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();
      if (end) {
        if (sameDay) {
          const dayPart = new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "2-digit",
            timeZone: timeZone || undefined,
          }).format(start);
          const timeFmt = new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: timeZone || undefined,
          });
          return `${dayPart}, ${timeFmt.format(start)} - ${timeFmt.format(
            end
          )} ${timeZone ? `(${timeZone})` : ""}`.trim();
        }
        return `${dateFmt.format(start)} - ${dateFmt.format(end)} ${
          timeZone ? `(${timeZone})` : ""
        }`.trim();
      }
      return `${dateFmt.format(start)} ${
        timeZone ? `(${timeZone})` : ""
      }`.trim();
    } catch {
      return `${startIso || ""}${endIso ? ` - ${endIso}` : ""}`;
    }
  };

  const extractRsvpSubject = (title?: string | null): string => {
    try {
      const t = (title || "").trim();
      if (!t) return "the event";
      // Try to extract a name prior to 's (e.g., "Livia's Birthday Party")
      const m = t.match(/([^\s][^']*?)\s*(?:'s|’s)\b/i);
      if (m && m[1]) {
        const name = m[1].trim();
        return `${name}'s birthday`;
      }
      // Otherwise fall back to the full title
      return t;
    } catch {
      return title || "the event";
    }
  };

  const userFullName = useMemo(() => {
    const name = (session?.user?.name as string) || "";
    return name.trim();
  }, [session]);

  const onEmail = () => {
    const to = findEmail() || "";
    const title = event?.title || "Event";
    const whenLine = formatDateRange(
      safeEvent?.start || null,
      safeEvent?.end || null,
      event?.timezone
    );
    const locationLine = combinedLocation;
    const parts = [
      `${title}`,
      "",
      whenLine ? `Date: ${whenLine}` : undefined,
      locationLine ? `Location: ${locationLine}` : undefined,
      event?.description ? "" : undefined,
      event?.description ? `${event.description}` : undefined,
      "",
      absoluteUrl ? `Event link: ${absoluteUrl}` : undefined,
      "",
      "—",
      "Sent via SnapMyDate · snapmydate.com",
    ].filter(Boolean) as string[];
    const body = encodeURIComponent(parts.join("\n"));
    const subject = encodeURIComponent(title);
    window.location.href = `mailto:${encodeURIComponent(
      to
    )}?subject=${subject}&body=${body}`;
  };

  const onRsvp = () => {
    const rsvpTarget = extractRsvpSubject(event?.title);
    const intro = [
      "Hi, there,",
      userFullName ? `this is ${userFullName},` : undefined,
      "parent of ______,",
      `RSVP-ing for ${rsvpTarget}`,
    ]
      .filter(Boolean)
      .join(" ");
    const message = [intro, absoluteUrl ? `\n${absoluteUrl}` : undefined]
      .filter(Boolean)
      .join("");
    const phone = rsvpPhone;
    const email = findEmail();
    if (phone) {
      const smsUrl = `sms:${encodeURIComponent(
        phone
      )}?&body=${encodeURIComponent(message)}`;
      try {
        window.location.href = smsUrl;
        return;
      } catch {}
    }
    const subject = encodeURIComponent(event?.title || "Event RSVP");
    window.location.href = `mailto:${encodeURIComponent(
      email || ""
    )}?subject=${subject}&body=${encodeURIComponent(message)}`;
  };

  const mapsHref = useMemo(() => {
    const q = (safeEvent?.location || combinedLocation || "").trim();
    if (!q) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      q
    )}`;
  }, [combinedLocation, safeEvent?.location]);

  const onShareLink = async () => {
    try {
      const url =
        absoluteUrl ||
        (typeof window !== "undefined" ? window.location.href : "");
      if ((navigator as any).share) {
        await (navigator as any).share({ title: event?.title || "Event", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      // eslint-disable-next-line no-alert
      alert("Link copied to clipboard");
    } catch {}
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-10">
        {historyId && (
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 text-foreground/90 hover:text-foreground"
          >
            <svg
              version="1.1"
              id="designs"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 32 32"
              xmlSpace="preserve"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M28.701,11.297c-0.026-0.468-0.37-0.86-0.86-0.86c-0.049,0-0.096,0.021-0.144,0.03 c-0.005,0-0.009-0.003-0.014-0.003c-0.098-0.002-0.196-0.002-0.294-0.002c-0.369,0-0.739,0.01-1.108,0.016 c-0.498,0.008-0.995,0.017-1.492,0.046c0.005-0.248,0.008-0.497,0.014-0.745c0.02-0.769,0.012-1.537,0.01-2.306 c-0.004-0.832,0-1.666,0.089-2.494c0.02-0.184,0.04-0.368,0.059-0.553c0.024-0.216-0.107-0.465-0.254-0.612 c-0.026-0.026-0.061-0.038-0.09-0.06c-0.113-0.301-0.376-0.547-0.72-0.524c-0.329,0.024-0.666,0.002-0.996-0.012 c-0.275-0.012-0.551-0.014-0.824-0.02c-0.303-0.006-0.604-0.002-0.907-0.006c-0.234-0.002-0.469-0.02-0.703-0.032 c-0.648-0.036-1.296-0.042-1.943-0.055c-0.727-0.016-1.452-0.091-2.179-0.103C16.258,3.001,16.173,3,16.087,3 c-0.586,0-1.17,0.032-1.756,0.044c-0.664,0.012-1.327,0.03-1.991,0.032c-0.662,0-1.323,0-1.985-0.018 C9.783,3.044,9.209,3.089,8.638,3.135c-0.13,0.01-0.245,0.044-0.353,0.094c-0.39,0.044-0.7,0.371-0.704,0.77 c-0.002,0.414,0.002,0.826-0.01,1.24C7.564,5.457,7.544,5.675,7.538,5.892C7.522,6.411,7.522,6.927,7.542,7.447 c0.041,1.121,0.083,2.243,0.121,3.364c-0.285-0.018-0.57-0.021-0.855-0.016c-0.154,0.004-0.309,0.008-0.462,0.006 c-0.291,0-0.582-0.036-0.874-0.061c-0.408-0.034-0.814-0.052-1.222-0.058c-0.005,0-0.009,0-0.014,0c-0.452,0-0.826,0.391-0.826,0.84 c0,0.084,0.025,0.16,0.049,0.236c-0.012,0.056-0.034,0.109-0.035,0.168c-0.048,1.821,0.002,3.643-0.04,5.464 c-0.008,0.409-0.038,0.814-0.046,1.223c-0.01,0.436-0.012,0.874-0.016,1.311c-0.008,0.884,0.01,1.768,0.022,2.651 c0.012,0.95,0.022,1.9,0.024,2.85c0,0.448-0.002,0.894-0.032,1.342c-0.024,0.374-0.053,0.75-0.077,1.125 c-0.019,0.31,0.164,0.575,0.409,0.734c0.146,0.181,0.359,0.306,0.605,0.303c0.681-0.008,1.363-0.049,2.044-0.047 c0.353,0,0.707,0.03,1.06,0.032c0.345,0.002,0.687-0.024,1.03-0.046c0.703-0.042,1.408-0.048,2.114-0.048 c0.721,0,1.438-0.002,2.157,0.036c0.365,0.02,0.731,0.042,1.095,0.056c0.343,0.014,0.687,0.01,1.032,0.012 c0.745,0.008,1.492,0.008,2.238,0.006c0.737-0.002,1.474,0.016,2.211,0.02c0.345,0.002,0.687,0.002,1.032,0 c0.394,0,0.788-0.002,1.183,0c1.072,0.01,2.143,0.032,3.215,0.034c0.45,0.002,0.897,0.026,1.347,0.012 c0.464-0.016,0.923-0.065,1.389-0.067c0.164-0.001,0.309-0.065,0.436-0.155c0.112-0.014,0.222-0.051,0.32-0.109 c0.129-0.075,0.23-0.176,0.305-0.305c0.077-0.133,0.117-0.275,0.117-0.43c0.087-0.725,0.032-1.468,0.032-2.199 c0-0.818-0.004-1.634,0.026-2.452c0.059-1.632,0.057-3.262,0.065-4.897c0.002-0.561,0-1.123,0.008-1.686 c0.008-0.578,0.04-1.159,0.052-1.737C28.808,13.739,28.77,12.515,28.701,11.297z M24.808,12.16c0.344-0.032,0.689-0.055,1.035-0.069 c-0.35,0.27-0.697,0.544-1.042,0.821c0.004-0.245,0.004-0.49,0.007-0.735C24.808,12.172,24.808,12.166,24.808,12.16z M24.407,15.155 c0.502-0.409,1.004-0.819,1.514-1.218c0.38-0.286,0.775-0.545,1.164-0.815c0.017,0.375,0.034,0.749,0.04,1.125 c0.014,0.828-0.054,1.652-0.073,2.48c-0.022,0.856-0.012,1.714-0.01,2.569c0.002,0.802-0.008,1.604-0.018,2.405 c-0.014,1.058-0.046,2.114-0.052,3.169c-0.004,0.481-0.006,0.965-0.01,1.446c0,0.015,0,0.03,0,0.045 c-0.948-1.244-1.87-2.508-2.797-3.768c-0.513-0.697-1.03-1.391-1.513-2.11c-0.527-0.779-1.046-1.559-1.533-2.363 c-0.036-0.06-0.081-0.111-0.128-0.159c0.03-0.024,0.059-0.051,0.089-0.075c0.628-0.499,1.236-1.024,1.852-1.537 C23.418,15.943,23.915,15.553,24.407,15.155z M10.455,4.635c0.517,0.028,1.036,0.028,1.555,0.026c0.226,0,0.45,0,0.675,0 c0.709,0.006,1.422,0.014,2.131-0.008c0.719-0.022,1.44-0.071,2.161-0.052c0.317,0.01,0.634,0.038,0.951,0.046 c0.366,0.01,0.731,0.02,1.097,0.024c0.545,0.008,1.086,0.047,1.628,0.079c0.511,0.028,1.022,0.038,1.535,0.04 c0.252,0.002,0.501,0.022,0.753,0.02c0.089-0.001,0.178-0.004,0.267-0.006c-0.047,0.729-0.055,1.459-0.077,2.191 c-0.024,0.79-0.002,1.583-0.014,2.373c-0.006,0.402-0.016,0.802-0.014,1.204c0,0.39,0.016,0.778,0.034,1.169 c0.03,0.695,0.024,1.389,0.024,2.086c0,0.103,0.002,0.204,0.006,0.307c0.001,0.022,0.011,0.04,0.013,0.062 c-0.541,0.424-1.08,0.851-1.612,1.288c-0.63,0.519-1.248,1.054-1.892,1.555c0.01-0.007,0.02-0.015,0.029-0.022 c-0.701,0.548-1.373,1.133-2.07,1.686c-0.341,0.269-0.679,0.545-1.02,0.814c-0.19,0.151-0.375,0.308-0.56,0.464 c-0.454-0.322-0.906-0.645-1.35-0.984c0.029,0.022,0.058,0.045,0.086,0.068c-0.033-0.026-0.066-0.052-0.1-0.078 c-0.022-0.017-0.044-0.034-0.067-0.051c0.019,0.014,0.037,0.028,0.056,0.042c-1.121-0.873-2.234-1.759-3.35-2.637 c-0.671-0.527-1.339-1.058-2.006-1.591c0-0.154,0.007-0.307,0.014-0.457c0.012-0.281,0.022-0.561,0.036-0.842 c0.034-0.681,0.022-1.363,0.008-2.044C9.372,10.704,9.364,9.999,9.323,9.3c-0.036-0.58-0.04-1.165-0.073-1.747 C9.24,7.354,9.214,7.156,9.198,6.956C9.172,6.637,9.174,6.314,9.16,5.993C9.153,5.766,9.135,5.538,9.129,5.31 C9.121,5.108,9.125,4.905,9.13,4.703C9.571,4.655,10.013,4.61,10.455,4.635z M10.989,18.448c-0.123,0.158-0.246,0.318-0.369,0.477 c0.014-0.018,0.027-0.035,0.041-0.053c-0.439,0.566-0.908,1.108-1.366,1.658c-0.465,0.562-0.939,1.119-1.406,1.682 c-0.454,0.545-0.905,1.094-1.343,1.654c-0.473,0.605-0.957,1.202-1.426,1.81c0.012-0.016,0.024-0.031,0.036-0.047 c-0.032,0.042-0.064,0.083-0.095,0.124c0.011-0.793,0.01-1.588,0.012-2.383c0-0.861-0.03-1.72-0.032-2.579 c-0.004-0.878-0.014-1.755,0.01-2.633c0.026-0.975,0.03-1.947,0.038-2.92c0.005-0.61,0.028-1.219,0.045-1.828 c0.294,0.235,0.587,0.472,0.877,0.712c0.426,0.352,0.871,0.681,1.309,1.017c0.627,0.496,1.233,1.015,1.858,1.511 c0.646,0.513,1.289,1.028,1.935,1.543c0.015,0.012,0.03,0.024,0.046,0.036C11.099,18.302,11.044,18.375,10.989,18.448z M7.119,12.449c0.19,0,0.382-0.008,0.574-0.002c0.001,0.331,0.001,0.663-0.004,0.994c-0.41-0.326-0.815-0.658-1.212-1 C6.691,12.447,6.906,12.449,7.119,12.449z M23.343,27.5c-0.737,0-1.474-0.014-2.213-0.012c-0.735,0.004-1.472,0-2.207-0.006 c-0.757-0.008-1.511-0.042-2.266-0.042c-0.733,0.002-1.464,0.008-2.195,0c-0.719-0.008-1.438-0.032-2.157-0.073 c-0.513-0.031-1.029-0.038-1.544-0.038c-0.185,0-0.371,0.001-0.556,0.002c-0.172,0.002-0.345,0-0.517,0 c-0.329-0.002-0.658-0.004-0.987,0.01c-0.495,0.022-0.988,0.054-1.484,0.038c-0.238-0.006-0.477-0.02-0.715-0.028 c-0.227-0.007-0.454,0.004-0.68,0.01c0.084-0.107,0.169-0.213,0.252-0.321c0.369-0.48,0.732-0.964,1.098-1.447 c-0.008,0.011-0.017,0.022-0.025,0.033c0.038-0.051,0.077-0.102,0.116-0.153c-0.008,0.011-0.017,0.022-0.026,0.033 c-0.021,0.027-0.041,0.055-0.062,0.082c-0.02,0.026-0.04,0.051-0.06,0.076c0.051-0.066,0.101-0.132,0.152-0.198 c-0.009,0.013-0.019,0.025-0.029,0.038c0.015-0.019,0.03-0.038,0.044-0.057c0.021-0.027,0.042-0.055,0.063-0.082 c-0.006,0.008-0.012,0.016-0.018,0.024c0.773-0.99,1.578-1.951,2.381-2.916c0.9-1.081,1.856-2.115,2.723-3.222 c0.197,0.158,0.396,0.313,0.591,0.472c0.626,0.511,1.258,1.012,1.912,1.488c0.081,0.059,0.163,0.119,0.245,0.178 c0.094,0.224,0.271,0.411,0.517,0.473c0.248,0.061,0.46,0.018,0.679-0.099c0.099-0.053,0.186-0.139,0.273-0.208 c0.105-0.083,0.21-0.166,0.311-0.254c0.269-0.228,0.527-0.468,0.8-0.691c0.271-0.222,0.537-0.452,0.812-0.669 c0.285-0.228,0.574-0.448,0.858-0.677c0.089-0.073,0.177-0.148,0.265-0.222c0.267,0.425,0.544,0.842,0.836,1.25 c0.24,0.337,0.485,0.669,0.725,1.006c0.501,0.705,1.008,1.406,1.515,2.108c0.977,1.349,1.987,2.672,2.979,4.007 c0.017,0.023,0.034,0.046,0.051,0.069c-0.124,0.002-0.248,0.006-0.371,0.008C24.736,27.504,24.041,27.502,23.343,27.5z M14.684,18.976c0.008,0.006,0.016,0.012,0.024,0.019c-0.004-0.003-0.009-0.007-0.013-0.01 C14.691,18.982,14.688,18.979,14.684,18.976z M7.331,25.39c-0.022,0.029-0.044,0.057-0.066,0.085 c0.007-0.009,0.014-0.018,0.021-0.027C7.301,25.429,7.316,25.409,7.331,25.39z M7.226,25.525c0.004-0.006,0.009-0.011,0.013-0.017 c0.001-0.001,0.001-0.002,0.002-0.003C7.236,25.512,7.231,25.518,7.226,25.525z M6.024,27.109c0.017-0.023,0.034-0.046,0.052-0.068 c0.009-0.012,0.018-0.023,0.027-0.035C6.076,27.04,6.05,27.075,6.024,27.109z M12.299,9.541c-0.149-0.148-0.234-0.354-0.234-0.566 c0-0.21,0.085-0.416,0.234-0.565c0.126-0.126,0.331-0.238,0.518-0.238c0.016,0,0.032,0.001,0.048,0.003 c0.368,0.04,0.739,0.077,1.109,0.109c0.196,0.018,0.39,0.038,0.586,0.01c-0.067,0.01-0.135,0.018-0.204,0.028 c0.422-0.057,0.848-0.046,1.272-0.042c0.359,0.004,0.717,0,1.076-0.004c0.497-0.004,0.994,0.008,1.49,0.01 c0.364,0,0.727-0.012,1.089-0.026c0.434-0.018,0.796,0.376,0.796,0.796c0,0.426-0.362,0.808-0.796,0.796 c-0.511-0.012-1.022-0.057-1.533-0.057c-0.572,0-1.147,0-1.719-0.01c-0.452-0.008-0.909,0.02-1.361,0.042 c-0.6,0.03-1.206,0.002-1.805-0.049C12.646,9.756,12.46,9.701,12.299,9.541z M11.954,12.005c0-0.438,0.37-0.818,0.814-0.812 c0.083,0,0.166,0.002,0.25,0.004c0.357,0.008,0.713,0.024,1.072,0.03c0.36,0.004,0.723-0.026,1.082-0.044 c0.335-0.018,0.668-0.018,1-0.026c0.283-0.004,0.567-0.026,0.852-0.028c0.216-0.002,0.434-0.008,0.65-0.01 c0.119,0,0.238,0.006,0.357,0.01c0.127,0.006,0.255,0.01,0.384,0.008c0.093,0,0.188,0,0.281,0c0.198,0,0.396,0,0.595-0.017 c0.067-0.017,0.135-0.025,0.202-0.025c0.354,0,0.684,0.231,0.782,0.589c0.115,0.412-0.135,0.885-0.561,0.989 c-0.109,0.026-0.222,0.036-0.333,0.043c-0.353,0.026-0.703,0.03-1.058,0.016c-0.236-0.008-0.473-0.004-0.709-0.002 c-0.246,0.004-0.493,0.006-0.737-0.004c-0.285-0.012-0.568,0.002-0.854,0.01c-0.347,0.008-0.691,0.004-1.038,0.012 c-0.739,0.02-1.478,0.062-2.217,0.071C12.324,12.825,11.954,12.445,11.954,12.005z"></path>
            </svg>
            <span className="hidden sm:inline">Invite</span>
          </button>
        )}

        <button
          type="button"
          onClick={onShareLink}
          className="inline-flex items-center gap-2 text-foreground/90 hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="hidden sm:inline">Share</span>
        </button>

        <button
          type="button"
          onClick={onEmail}
          className="inline-flex items-center gap-2 text-foreground/90 hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <polyline points="22,7 12,13 2,7" />
          </svg>
          <span className="hidden sm:inline">Email</span>
        </button>

        {session && rsvpPhone && (
          <button
            type="button"
            onClick={onRsvp}
            className="inline-flex items-center gap-2 text-foreground/90 hover:text-foreground"
          >
            <svg
              fill="currentColor"
              viewBox="0 0 14 14"
              role="img"
              focusable="false"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path d="m 4.315027,12.158602 c -0.9166805,-0.4626 -1.7278542,-0.903 -1.8026191,-0.9788 -0.1478698,-0.1498 -1.4890884,-4.2157996 -1.4890884,-4.5141996 0,-0.1794 1.9277474,-3.8667 2.4722734,-4.7288 0.3461929,-0.5482 0.6940858,-0.7692 1.21135,-0.7696 0.5126739,-6e-4 0.816424,0.1402 0.816424,0.3779 0,0.2828 -0.1781318,0.3785 -0.5974395,0.3211 -0.3147608,-0.043 -0.4060468,-0.021 -0.5947593,0.1457 -0.272448,0.2404 -2.4114894,4.1964 -2.3740869,4.3907 0.015001,0.078 0.3915959,0.3334 0.8590168,0.5825 0.9503928,0.5065 1.2472424,0.7564 1.3812813,1.1626 0.1429494,0.4331 0.029302,0.8899 -0.4433493,1.7825 -0.3793751,0.7163996 -0.4144374,0.8241996 -0.3094305,0.9506996 0.1626808,0.1961 2.7174796,1.4529 2.9532752,1.4529 0.2985297,0 0.5355554,-0.2492 0.9499528,-0.9982 0.2111439,-0.3817 0.4437293,-0.7314 0.5168441,-0.7769 0.1642809,-0.1024 0.575408,-0.01 0.575388,0.1307 -10e-6,0.056 -0.2263849,0.5054 -0.5030632,0.9976 -0.5994196,1.0664 -0.8889088,1.3136 -1.5371216,1.313 -0.363884,-7e-4 -0.6345119,-0.1095 -2.0848478,-0.8414 z M 7.7463238,9.5757024 c -0.6336519,-0.2163 -1.1689373,-0.4103 -1.1895286,-0.4309 -0.055904,-0.056 0.084306,-0.1509 1.1332649,-0.7682 l 0.9583433,-0.564 1.8750236,-0.1997 c 1.031268,-0.1098 1.96831,-0.1894 2.082317,-0.1769 0.201354,0.022 0.210294,0.051 0.311551,1.0195 0.0573,0.5482 0.0765,1.0223 0.0427,1.0535 -0.0339,0.031 -0.961564,0.1475 -2.061576,0.2584 l -2.0000221,0.2016 -1.1520861,-0.3933 z m 0.9846951,-0.054 c -0.1324288,-0.3207 -0.2165143,-0.825 -0.1737115,-1.0417 0.024902,-0.126 0.029702,-0.2291 0.010701,-0.2291 -0.019001,0 -0.3439127,0.1859 -0.7220077,0.4132 -0.5619572,0.3378 -0.6583435,0.4244 -0.5280049,0.4744 0.087706,0.034 0.4229179,0.1628 0.7449292,0.2868 0.7139172,0.2751 0.7436392,0.2794 0.6680942,0.096 z m 0.9681139,-2.2614 c -0.093306,-0.061 -0.024102,-0.249 0.3541732,-0.9637 0.537145,-1.0149 0.586078,-1.3287 0.261787,-1.6787 -0.227535,-0.2455 -0.263567,-0.4452 -0.108337,-0.6004 0.165851,-0.1659 0.353683,-0.1144 0.623661,0.1708 0.577718,0.6104 0.581129,0.9106 0.0231,2.0345 -0.231266,0.4657 -0.465991,0.8846 -0.521605,0.9307 -0.15836,0.1314 -0.5051427,0.1899 -0.6328112,0.1068 z m -3.9426405,-1.0845 c -1.3871717,-0.712 -1.8892649,-1.0083 -1.7086629,-1.0083 0.1192979,0 3.4755697,1.7091 3.4755697,1.7699 0,0.1262 -0.2339055,0.025 -1.7669068,-0.7616 z m 1.8294009,0.4017 c -0.1566504,-0.091 -0.2008133,-0.3266 -0.061304,-0.3266 0.1328988,0 0.4184977,-0.5259 0.3694845,-0.6803 -0.072005,-0.2268 0.1014167,-0.254 0.4584402,-0.072 0.4303885,0.2195 0.5359555,0.5407 0.2530268,0.7699 -0.106127,0.086 -0.2430361,0.1358 -0.3042301,0.1109 -0.061204,-0.025 -0.1675211,-0.068 -0.2362756,-0.096 -0.092106,-0.037 -0.1249983,0.01 -0.1249983,0.1667 0,0.2286 -0.1114174,0.2686 -0.3541734,0.1272 z m 0.817004,-0.584 c 0.030802,-0.05 0.012701,-0.1338 -0.040203,-0.1868 -0.072705,-0.073 -0.1143675,-0.067 -0.1705813,0.024 -0.079405,0.1285 -0.039403,0.2532 0.081305,0.2532 0.040403,0 0.098707,-0.041 0.1294886,-0.091 z m -1.7025725,0.099 c -0.093906,-0.06 -0.098006,-0.1677 -0.022301,-0.5973 0.090706,-0.515 0.066304,-0.7167 -0.061704,-0.5097 -0.086906,0.1406 -0.3163809,0.043 -0.3686343,-0.1568 -0.023102,-0.089 -0.083106,-0.161 -0.1332089,-0.161 -0.1407393,0 -0.1082871,0.1254 0.075505,0.2918 0.317011,0.2869 0.166031,0.7083 -0.2537567,0.7083 -0.2601372,0 -0.4962528,-0.2311 -0.4962528,-0.4857 0,-0.2566 0.2362256,-0.228 0.3384923,0.041 0.063604,0.1672 0.1079872,0.1983 0.1801719,0.1261 0.072205,-0.072 0.048303,-0.1463 -0.096606,-0.3006 -0.2234648,-0.2378 -0.1875824,-0.5881 0.068605,-0.6694 0.211694,-0.067 0.5775382,0.1095 0.6410624,0.3098 0.036002,0.1133 0.077905,0.136 0.1389991,0.075 0.061004,-0.061 0.1592006,-0.05 0.3250615,0.035 0.2599272,0.1344 0.2986798,0.2408 0.1251783,0.3436 -0.1248682,0.074 -0.2616273,0.525 -0.1592105,0.525 0.078105,0 0.2976897,-0.3302 0.3238214,-0.4868 0.010301,-0.062 0.035402,-0.1285 0.055804,-0.1489 0.057004,-0.057 0.4753614,0.1523 0.4753614,0.2378 0,0.098 -0.8500762,0.8909 -0.9583433,0.8934 -0.045803,0 -0.134959,-0.031 -0.1980631,-0.071 z m -1.6264575,-0.8663 c -0.094306,-0.069 -0.136229,-0.1905 -0.1189179,-0.3445 0.015401,-0.1368 -0.017601,-0.2537 -0.077405,-0.2747 -0.065904,-0.023 -0.1041669,0.043 -0.1041669,0.1789 0,0.2321 -0.085406,0.2646 -0.3388224,0.129 -0.182202,-0.098 -0.2185944,-0.3305 -0.051603,-0.3305 0.1379791,0 0.4017566,-0.5402 0.3410426,-0.6984 -0.085806,-0.2235 0.1312186,-0.2261 0.5065734,-0.01 0.3067003,0.1797 0.3761649,0.2644 0.3761649,0.4584 0,0.132 -0.059704,0.2713 -0.1341289,0.313 -0.073805,0.041 -0.1399292,0.1906 -0.1470297,0.3318 -0.016301,0.3251 -0.069505,0.3764 -0.2516766,0.2432 z m 0.1995032,-0.9245 c 0,-0.1575 -0.2255849,-0.2344 -0.2790285,-0.095 -0.050403,0.1314 0.013001,0.2112 0.1679111,0.2112 0.061104,0 0.1111174,-0.052 0.1111174,-0.116 z m 3.601918,0.2363 c -0.2627774,-0.184 -0.2331554,-0.463 0.120658,-1.1362 0.4462095,-0.8492 0.8352452,-1.0216 1.1660466,-0.5167 0.127968,0.1953 0.119808,0.2336 -0.1778913,0.836 -0.4634407,0.9377 -0.6939359,1.1076 -1.1088133,0.8169 z m -1.1933089,-1.3112 c -0.5219145,-0.2992 -0.741929,-0.4653 -0.741929,-0.56 0,-0.035 0.067505,-0.1473 0.1499899,-0.1852 l 0.1499799,-0.1852 0.6870454,0.3454 c 0.7041866,0.354 0.8527864,0.5114 0.7053666,0.7471 -0.137129,0.2191 -0.45407,0.1864 -0.9504528,-0.098 z m -2.0548158,-0.3219 c -0.2223046,-0.2223 -0.023902,-0.8755 0.4707412,-1.5497 0.2968096,-0.4045 0.5676375,-0.462 0.8493761,-0.1803 0.2178944,0.2179 0.1765917,0.4139 -0.2531967,1.2012 -0.30199,0.5531 -0.3351122,0.5846 -0.6407924,0.6079 -0.1785118,0.014 -0.3686444,-0.022 -0.4261282,-0.079 z"></path>
              </g>
            </svg>
            <span className="hidden sm:inline">RSVP</span>
          </button>
        )}

        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-foreground/90 hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M13,24h-2v-7c0-2.8-2.1-5-4.8-5H3.7l3.2,3.3l-1.4,1.4L0,11l5.5-5.7l1.4,1.4L3.7,10h2.5c1.9,0,3.6,0.8,4.8,2.1V12 c0-3.9,3-7,6.8-7h2.5l-3.2-3.3l1.4-1.4L24,6l-5.5,5.7l-1.4-1.4L20.3,7h-2.5C15.1,7,13,9.2,13,12V24z" />
            </svg>
            <span className="hidden sm:inline">Directions</span>
          </a>
        )}
      </div>

      {shareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => {
            if (shareState !== "submitting") setShareOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-50 w-[360px] max-w-[92vw] sm:w-auto sm:max-w-md sm:rounded-xl bg-surface border border-border p-4 sm:p-5 shadow-xl sm:mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold">
                Invite guests to this event
              </h3>
              <button
                type="button"
                onClick={() =>
                  shareState !== "submitting" && setShareOpen(false)
                }
                className="text-foreground/70 hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-foreground/70">
              Enter an email address to invite someone to this event.
            </p>
            <form
              className="mt-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!historyId) {
                  setShareError("This event cannot be shared right now.");
                  setShareState("error");
                  return;
                }
                const email = (shareEmail || "").trim();
                if (!email) return;
                setShareState("submitting");
                setShareError(null);
                try {
                  const res = await fetch(`/api/events/share`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      eventId: historyId,
                      recipientEmail: email,
                      recipientFirstName:
                        (shareFirstName || "").trim() || undefined,
                      recipientLastName:
                        (shareLastName || "").trim() || undefined,
                    }),
                    credentials: "include",
                  });
                  const j = await res.json().catch(() => ({}));
                  if (!res.ok || j?.error) {
                    throw new Error(
                      String(j?.error || `Failed: ${res.status}`)
                    );
                  }
                  // Store the recipient email and show thank you modal
                  setSharedRecipientEmail(email);
                  setShareState("success");
                  setShareOpen(false);
                  setShowShareThankYou(true);
                  // Reset form
                  setShareEmail("");
                  setShareFirstName("");
                  setShareLastName("");
                } catch (err: any) {
                  setShareState("error");
                  setShareError(String(err?.message || err || "Failed"));
                }
              }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="First name"
                  value={shareFirstName}
                  onChange={(e) => setShareFirstName(e.target.value)}
                  className="border border-border bg-surface rounded px-2 py-1 text-sm flex-1 min-w-0"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={shareLastName}
                  onChange={(e) => setShareLastName(e.target.value)}
                  className="border border-border bg-surface rounded px-2 py-1 text-sm flex-1 min-w-0"
                />
              </div>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="border border-border bg-surface rounded px-2 py-1 text-sm w-full"
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={shareState === "submitting"}
                  className="text-sm rounded border border-border bg-surface px-3 py-1 hover:bg-foreground/5 disabled:opacity-50"
                >
                  {shareState === "submitting" ? "Inviting…" : "Invite"}
                </button>
              </div>
            </form>
            {shareState === "error" && shareError && (
              <div className="mt-2 text-xs text-red-500">{shareError}</div>
            )}
          </div>
        </div>
      )}

      {/* Event Share Thank You Modal */}
      <EventShareThankYouModal
        open={showShareThankYou}
        onClose={() => setShowShareThankYou(false)}
        recipientEmail={sharedRecipientEmail}
      />
    </div>
  );
}
