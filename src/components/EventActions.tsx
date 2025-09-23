"use client";
import React, { useMemo, useState, useEffect } from "react";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { useSession } from "next-auth/react";

type EventFields = {
  title: string;
  start: string | null;
  end: string | null;
  location: string;
  description: string;
  timezone: string;
  reminders?: { minutes: number }[] | null;
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

  const safeEvent = useMemo(() => {
    if (!event) return null;
    const start = event.start || null;
    const end = event.end || null;
    if (!start) return null;
    return {
      ...event,
      start,
      end:
        end ||
        new Date(new Date(start).getTime() + 90 * 60 * 1000).toISOString(),
    } as EventFields;
  }, [event]);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareFirstName, setShareFirstName] = useState("");
  const [shareLastName, setShareLastName] = useState("");
  const [shareState, setShareState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [shareError, setShareError] = useState<string | null>(null);

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

  const findPhone = (): string | null => {
    const text = `${event?.description || ""} ${event?.location || ""}`;
    return extractFirstPhoneNumber(text);
  };

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
    const parts = [
      `${title}`,
      "",
      whenLine ? `Date: ${whenLine}` : undefined,
      event?.location ? `Location: ${event.location}` : undefined,
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
    const phone = findPhone();
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
    const q = (safeEvent?.location || "").trim();
    if (!q) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      q
    )}`;
  }, [safeEvent?.location]);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-10">
        <button
          type="button"
          onClick={onShare}
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
          <span>Share</span>
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
          <span>Email</span>
        </button>

        {/* RSVP removed for practice events */}

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
            <span>Directions</span>
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
                Share this event
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
              Enter the email of an existing user to share this event.
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
                  setShareState("success");
                  // close shortly after success
                  setTimeout(() => setShareOpen(false), 800);
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
                  {shareState === "submitting" ? "Sharing…" : "Share"}
                </button>
              </div>
            </form>
            {shareState === "success" && (
              <div className="mt-2 text-xs text-emerald-600">
                Invitation sent.
              </div>
            )}
            {shareState === "error" && shareError && (
              <div className="mt-2 text-xs text-red-500">{shareError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
