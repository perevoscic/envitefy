"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTheme } from "@/app/providers";

type ResponseIntent = "attend" | "decline" | "maybe" | null;

type StoredSender = {
  firstName: string;
  lastName: string;
  forWho: string;
  phone: string;
};

type EventRsvpPromptProps = {
  eventId?: string | null;
  rsvpName?: string | null;
  rsvpPhone?: string | null;
  rsvpEmail?: string | null;
  rsvpUrl?: string | null;
  eventTitle?: string | null;
  shareUrl?: string | null;
  variant?: "default" | "wedding-scan";
};

const RSVP_OPTIONS: Array<{
  intent: NonNullable<ResponseIntent>;
  icon: string;
  label: string;
}> = [
  { intent: "attend", icon: "✅", label: "Yes" },
  { intent: "decline", icon: "❌", label: "No" },
  { intent: "maybe", icon: "🤔", label: "Maybe" },
];

const STORAGE_KEY = "snapmydate:rsvp-sender";

const initialSender: StoredSender = {
  firstName: "",
  lastName: "",
  forWho: "",
  phone: "",
};

export default function EventRsvpPrompt({
  eventId,
  rsvpName,
  rsvpPhone,
  rsvpEmail,
  rsvpUrl,
  eventTitle,
  shareUrl,
  variant = "default",
}: EventRsvpPromptProps) {
  const { theme } = useTheme();
  const [intent, setIntent] = useState<ResponseIntent>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [sender, setSender] = useState<StoredSender>(initialSender);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineLines, setDeclineLines] = useState<string[]>([]);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredSender;
      if (parsed && typeof parsed === "object") {
        setSender({
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          forWho: parsed.forWho || "",
          phone: parsed.phone || "",
        });
      }
    } catch {}
  }, [mounted]);

  const [existingRsvp, setExistingRsvp] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted || !eventId) return;
    try {
      const stored = localStorage.getItem(`envitefy_rsvp_${eventId}`);
      if (stored) setExistingRsvp(stored);
    } catch {}

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.eventId === eventId && detail?.response) {
        setExistingRsvp(detail.response);
      } else if (eventId) {
        try {
          const stored = localStorage.getItem(`envitefy_rsvp_${eventId}`);
          if (stored) setExistingRsvp(stored);
        } catch {}
      }
    };
    window.addEventListener("rsvp-submitted", handler);
    return () => window.removeEventListener("rsvp-submitted", handler);
  }, [mounted, eventId]);

  const hasPhone = Boolean(rsvpPhone);
  const hasEmail = Boolean(rsvpEmail);
  const hasUrl = Boolean(rsvpUrl);
  const isWeddingScanVariant = variant === "wedding-scan";
  if (!hasPhone && !hasEmail && !hasUrl) {
    return null;
  }
  if (!mounted) {
    return null;
  }

  const contactMode: "sms" | "email" = hasPhone ? "sms" : "email";

  const _handleDecline = async () => {
    // Submit "no" RSVP to API if eventId is available
    if (eventId) {
      try {
        const senderName =
          sender.firstName && sender.lastName
            ? `${sender.firstName.trim()} ${sender.lastName.trim()}`.trim()
            : undefined;

        console.log("[RSVP] Submitting decline:", {
          eventId,
          email: rsvpEmail,
          name: senderName,
        });

        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            response: "no",
            email: rsvpEmail || undefined,
            name: senderName || undefined,
          }),
        });
        const data = await res.json();
        console.log("[RSVP] Decline response:", {
          ok: res.ok,
          status: res.status,
          data,
        });
        if (res.ok && data.ok) {
          console.log("[RSVP] Dispatching rsvp-submitted event");
          try { localStorage.setItem(`envitefy_rsvp_${eventId}`, "no"); } catch {}
          setExistingRsvp("no");
          window.dispatchEvent(new CustomEvent("rsvp-submitted", { detail: { eventId, response: "no" } }));
        } else {
          console.error(
            "RSVP submission failed:",
            data.error || "Unknown error"
          );
        }
      } catch (err) {
        console.error("Failed to submit RSVP to API:", err);
      }
    }

    setModalOpen(false);
    setIntent(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!intent) return;
    if (!sender.firstName.trim() || !sender.lastName.trim()) {
      setError("Please enter both first and last name.");
      return;
    }
    if (contactMode === "sms" && intent !== "decline" && !sender.phone.trim()) {
      setError("Please enter a phone number we can share with the host.");
      return;
    }
    setError(null);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sender));
      }
    } catch {}

    // Submit RSVP to API if eventId is available
    if (eventId) {
      try {
        const senderName =
          `${sender.firstName.trim()} ${sender.lastName.trim()}`.trim();
        const rsvpResponse =
          intent === "attend" ? "yes" : intent === "maybe" ? "maybe" : "no";
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            response: rsvpResponse,
            name: senderName,
            email: sender.phone.trim() ? undefined : rsvpEmail || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          try { localStorage.setItem(`envitefy_rsvp_${eventId}`, rsvpResponse); } catch {}
          setExistingRsvp(rsvpResponse);
          window.dispatchEvent(new CustomEvent("rsvp-submitted", { detail: { eventId, response: rsvpResponse } }));
        } else {
          console.error(
            "RSVP submission failed:",
            data.error || "Unknown error"
          );
        }
      } catch (err) {
        console.error("Failed to submit RSVP to API:", err);
      }
    }

    // For decline, do not open composers; just close the modal
    if (intent === "decline") {
      setModalOpen(false);
      setIntent(null);
      return;
    }

    const eventLabel = eventTitle?.trim() || "the event";
    const salutation = rsvpName?.trim() || "there";
    const senderName =
      `${sender.firstName.trim()} ${sender.lastName.trim()}`.trim();
    const guest = sender.forWho.trim();
    const guestPhraseAttend = guest ? `${guest} will attend` : "I will attend";
    const guestPhraseMaybe = guest
      ? `${guest} might be able to attend`
      : "I might be able to attend";

    if (contactMode === "email") {
      let bodyCore = "";
      if (intent === "attend") {
        bodyCore = `I'm excited to attend ${eventLabel}.`;
      } else if (intent === "maybe") {
        bodyCore = `I might be able to attend ${eventLabel}, and I'll confirm soon.`;
      }
      const lines = [`Hi ${salutation},`, "", `${senderName}: ${bodyCore}`];
      if (shareUrl) lines.push("", `Event link: ${shareUrl}`);
      lines.push("", "Sent via SnapMyDate · envitefy.com");
      const subject = `RSVP for ${eventTitle?.trim() || "your event"}`;
      const mailto = `mailto:${encodeURIComponent(
        rsvpEmail || ""
      )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        lines.join("\n")
      )}`;
      window.location.href = mailto;
      setModalOpen(false);
      setIntent(null);
      return;
    }

    // SMS flow
    let bodyCore = "";
    if (intent === "attend") {
      bodyCore = `${guestPhraseAttend} ${eventLabel}! Looking forward to it.`;
    } else if (intent === "maybe") {
      bodyCore = `${guestPhraseMaybe} ${eventLabel}, but we're not sure yet. We'll confirm soon!`;
    }
    const intro = `Hi ${salutation}, this is ${senderName}.`;
    const contactLine = `You can reach me at ${sender.phone.trim()}.`;
    const footer = shareUrl ? `\n${shareUrl}` : "";
    const smsMessage = `${intro} ${bodyCore} ${contactLine}`.trim();
    const fullMessage = `${smsMessage}${footer}`.trim();
    const href = `sms:${encodeURIComponent(
      rsvpPhone || ""
    )}?&body=${encodeURIComponent(fullMessage)}`;
    window.location.href = href;

    setModalOpen(false);
    setIntent(null);
  };

  const _handleEmailIntent = async (nextIntent: ResponseIntent) => {
    if (!rsvpEmail || !nextIntent) return;

    // Submit RSVP to API if eventId is available
    if (eventId && nextIntent !== "decline") {
      try {
        const rsvpResponse =
          nextIntent === "attend"
            ? "yes"
            : nextIntent === "maybe"
            ? "maybe"
            : "no";
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            response: rsvpResponse,
            email: rsvpEmail,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          try { localStorage.setItem(`envitefy_rsvp_${eventId}`, rsvpResponse); } catch {}
          setExistingRsvp(rsvpResponse);
          window.dispatchEvent(new CustomEvent("rsvp-submitted", { detail: { eventId, response: rsvpResponse } }));
        } else {
          console.error(
            "RSVP submission failed:",
            data.error || "Unknown error"
          );
        }
      } catch (err) {
        console.error("Failed to submit RSVP to API:", err);
        // Continue with email flow even if API call fails
      }
    }

    const eventLabel = eventTitle?.trim() || "the event";
    const salutation = rsvpName?.trim() || "there";
    let bodyCore = "";
    if (nextIntent === "attend") {
      bodyCore = `I'm excited to attend ${eventLabel}.`;
    } else if (nextIntent === "maybe") {
      bodyCore = `I might be able to attend ${eventLabel}, and I'll confirm soon.`;
    } else if (nextIntent === "decline") {
      bodyCore = `Unfortunately, I won't be able to attend ${eventLabel}.`;
    } else {
      return;
    }
    const lines = [`Hi ${salutation},`, "", bodyCore];
    if (shareUrl) {
      lines.push("", `Event link: ${shareUrl}`);
    }
    lines.push("", "Sent via SnapMyDate · envitefy.com");
    const subject = `RSVP for ${eventTitle?.trim() || "your event"}`;
    const href = `mailto:${encodeURIComponent(
      rsvpEmail
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      lines.join("\n")
    )}`;
    window.location.href = href;
  };

  const clearAndClose = () => {
    setModalOpen(false);
    setIntent(null);
    setError(null);
  };

  const openModalFor = (nextIntent: ResponseIntent) => {
    if (!nextIntent) return;
    if (contactMode === "email") {
      if (nextIntent === "decline") {
        // Build the apology card text and open decline card (combined flow)
        const eventLabel = eventTitle?.trim() || "the event";
        const guest = sender.forWho.trim();
        const declineParts: string[] = [
          guest
            ? `We're sorry, unfortunately, ${guest} can't make it to ${eventLabel}.`
            : `We're sorry, unfortunately, you can't make it to ${eventLabel}.`,
        ];
        if (rsvpName && rsvpPhone) {
          declineParts.push(
            `If plans change, you can reach out to ${rsvpName.trim()} at ${rsvpPhone}.`
          );
        } else if (rsvpPhone) {
          declineParts.push(
            `If plans change, you can let the host know at ${rsvpPhone}.`
          );
        } else if (rsvpName) {
          declineParts.push(
            `If plans change, you can let ${rsvpName.trim()} know.`
          );
        }
        declineParts.push("Thank you for letting us know.");
        setDeclineLines(declineParts);
        setIntent(nextIntent);
        setError(null);
        setDeclineModalOpen(true);
        setModalOpen(false);
        return;
      }
      // For email + yes/maybe, collect name via the Introduce Yourself modal
      setIntent(nextIntent);
      setError(null);
      setModalOpen(true);
      return;
    }
    if (nextIntent === "decline") {
      // Build the apology card text and open decline card (combined flow)
      const eventLabel = eventTitle?.trim() || "the event";
      const guest = sender.forWho.trim();
      const declineParts: string[] = [
        guest
          ? `We're sorry, unfortunately, ${guest} can't make it to ${eventLabel}.`
          : `We're sorry, unfortunately, you can't make it to ${eventLabel}.`,
      ];
      if (rsvpName && rsvpPhone) {
        declineParts.push(
          `If plans change, you can reach out to ${rsvpName.trim()} at ${rsvpPhone}.`
        );
      } else if (rsvpPhone) {
        declineParts.push(
          `If plans change, you can let the host know at ${rsvpPhone}.`
        );
      } else if (rsvpName) {
        declineParts.push(
          `If plans change, you can let ${rsvpName.trim()} know.`
        );
      }
      declineParts.push("Thank you for letting us know.");
      setDeclineLines(declineParts);
      setIntent(nextIntent);
      setError(null);
      setDeclineModalOpen(true);
      setModalOpen(false);
      return;
    }
    setIntent(nextIntent);
    setError(null);
    setModalOpen(true);
  };

  const closeDeclineModal = () => {
    setDeclineModalOpen(false);
    setDeclineLines([]);
  };

  if (existingRsvp) {
    const label = existingRsvp === "yes" ? "Yes" : existingRsvp === "no" ? "No" : "Maybe";
    const icon = existingRsvp === "yes" ? "\u2705" : existingRsvp === "no" ? "\u274C" : "\u{1F914}";
    return (
      <div
        className={
          isWeddingScanVariant
            ? "inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-medium text-[#2f261e] shadow-[0_12px_30px_rgba(37,26,10,0.08)]"
            : "inline-flex items-center gap-2 rounded-xl border border-[#ddd4f8] bg-[#f7f2ff] px-3 py-1.5 text-sm font-semibold text-[#3f3269]"
        }
      >
        <span aria-hidden="true">{icon}</span>
        <span>RSVP&apos;d: {label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasUrl ? (
        <a
          href={rsvpUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isWeddingScanVariant
              ? "inline-flex min-h-11 items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-medium tracking-[0.08em] text-[#2f261e] uppercase shadow-[0_14px_32px_rgba(37,26,10,0.08)] transition hover:-translate-y-[1px] hover:bg-[#fbf7f1]"
              : "inline-flex items-center gap-2 rounded-xl border border-[#ddd4f8] bg-[#f7f2ff] px-3 py-1.5 text-sm font-semibold text-[#3f3269] shadow-sm transition hover:border-[#cabcf0] hover:bg-white"
          }
        >
          <span aria-hidden="true">🔗</span>
          <span>Open RSVP</span>
        </a>
      ) : null}

      {!hasPhone && !hasEmail ? null : (
      <div className="flex flex-wrap gap-3">
        {RSVP_OPTIONS.map((option) => (
          <button
            key={option.intent}
            type="button"
            onClick={() => openModalFor(option.intent)}
            className={
              isWeddingScanVariant
                ? "inline-flex min-h-11 items-center gap-2 rounded-full border border-black/5 bg-white/95 px-4 py-2 text-sm font-medium tracking-[0.08em] text-[#2f261e] uppercase shadow-[0_14px_32px_rgba(37,26,10,0.08)] transition hover:-translate-y-[1px] hover:bg-[#fbf7f1]"
                : "inline-flex items-center gap-2 rounded-xl border border-[#ddd4f8] bg-white/90 px-3 py-1.5 text-sm font-semibold text-[#3f3269] shadow-sm transition hover:border-[#cabcf0] hover:bg-[#f7f2ff]"
            }
          >
            <span aria-hidden="true">{option.icon}</span>
            <span suppressHydrationWarning>{option.label}</span>
          </button>
        ))}
      </div>
      )}

      {declineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          {/* Force modal to follow site theme tokens; avoid OS auto-dark */}
          <div
            className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl"
            style={{ colorScheme: theme }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={closeDeclineModal}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold rsvp-heading">
              Thanks for the RSVP
            </h3>
            <div className="mt-3 space-y-2 text-sm text-foreground/80">
              {declineLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <form
              className="mt-5 space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                // Require first/last name before recording decline
                if (!sender.firstName.trim() || !sender.lastName.trim()) {
                  setError("Please enter both first and last name.");
                  return;
                }
                setError(null);
                try {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(
                      STORAGE_KEY,
                      JSON.stringify(sender)
                    );
                  }
                } catch {}

                // Submit RSVP 'no' to API
                if (eventId) {
                  try {
                    const senderName =
                      `${sender.firstName.trim()} ${sender.lastName.trim()}`.trim();
                    const res = await fetch(`/api/events/${eventId}/rsvp`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        response: "no",
                        name: senderName,
                        email: rsvpEmail || undefined,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok && data.ok) {
                      try { localStorage.setItem(`envitefy_rsvp_${eventId}`, "no"); } catch {}
                      setExistingRsvp("no");
                      window.dispatchEvent(new CustomEvent("rsvp-submitted", { detail: { eventId, response: "no" } }));
                    }
                  } catch {}
                }
                setDeclineModalOpen(false);
                setDeclineLines([]);
                setIntent(null);
              }}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="text-foreground/70">First name</span>
                  <input
                    type="text"
                    required
                    value={sender.firstName}
                    onChange={(event) =>
                      setSender((prev) => ({
                        ...prev,
                        firstName: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-foreground/70">Last name</span>
                  <input
                    type="text"
                    required
                    value={sender.lastName}
                    onChange={(event) =>
                      setSender((prev) => ({
                        ...prev,
                        lastName: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
              </div>
              <label className="text-sm block">
                <span className="text-foreground/70">RSVP for who?</span>
                <input
                  type="text"
                  value={sender.forWho}
                  onChange={(event) =>
                    setSender((prev) => ({
                      ...prev,
                      forWho: event.target.value,
                    }))
                  }
                  placeholder="Add the guest’s name (optional)"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
              <label className="text-sm block">
                <span className="text-foreground/70">Your phone number</span>
                <input
                  type="tel"
                  value={sender.phone}
                  onChange={(event) =>
                    setSender((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="We’ll include this so the host can reach you"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
              {error ? (
                <p className="text-sm text-rose-600 dark:text-rose-300">
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeclineModal}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium btn-cancel-white hover:bg-foreground/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary hover:opacity-95"
                >
                  Send RSVP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single modal handles name capture for Yes/Maybe and Decline.
          When intent === 'decline', we hide the phone input and submit without opening SMS/email. */}

      {modalOpen && intent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          {/* Force modal to follow site theme tokens; avoid OS auto-dark */}
          <div
            className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl"
            style={{ colorScheme: theme }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={clearAndClose}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold rsvp-heading">
              Introduce yourself
            </h3>
            <p className="mt-2 text-sm text-foreground/70">
              We’ll open your message after you share who is reaching out.
            </p>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="text-foreground/70">First name</span>
                  <input
                    type="text"
                    required
                    value={sender.firstName}
                    onChange={(event) =>
                      setSender((prev) => ({
                        ...prev,
                        firstName: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-foreground/70">Last name</span>
                  <input
                    type="text"
                    required
                    value={sender.lastName}
                    onChange={(event) =>
                      setSender((prev) => ({
                        ...prev,
                        lastName: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
              </div>
              <label className="text-sm block">
                <span className="text-foreground/70">RSVP for who?</span>
                <input
                  type="text"
                  value={sender.forWho}
                  onChange={(event) =>
                    setSender((prev) => ({
                      ...prev,
                      forWho: event.target.value,
                    }))
                  }
                  placeholder="Add the guest’s name (optional)"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
              <label className="text-sm block">
                <span className="text-foreground/70">Your phone number</span>
                <input
                  type="tel"
                  required
                  value={sender.phone}
                  onChange={(event) =>
                    setSender((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="We’ll include this so the host can reach you"
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
              {error ? (
                <p className="text-sm text-rose-600 dark:text-rose-300">
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={clearAndClose}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium btn-cancel-white hover:bg-foreground/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary hover:opacity-95"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
