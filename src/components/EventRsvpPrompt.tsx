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
  rsvpName?: string | null;
  rsvpPhone?: string | null;
  rsvpEmail?: string | null;
  eventTitle: string;
  shareUrl?: string | null;
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
  rsvpName,
  rsvpPhone,
  rsvpEmail,
  eventTitle,
  shareUrl,
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

  const hasPhone = Boolean(rsvpPhone);
  const hasEmail = Boolean(rsvpEmail);
  if (!hasPhone && !hasEmail) {
    return null;
  }
  if (!mounted) {
    return null;
  }

  const contactMode: "sms" | "email" = hasPhone ? "sms" : "email";

  const handleDecline = () => {
    setModalOpen(false);
    const eventLabel = eventTitle?.trim() || "the event";
    const guest = sender.forWho.trim();
    const declineParts: string[] = [
      guest
        ? `We're sorry ${guest} can't make it to ${eventLabel}.`
        : `We're sorry you can't make it to ${eventLabel}.`,
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
    setDeclineModalOpen(true);
    setIntent(null);
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!intent) return;
    if (!sender.firstName.trim() || !sender.lastName.trim()) {
      setError("Please enter both first and last name.");
      return;
    }
    if (contactMode === "sms" && !sender.phone.trim()) {
      setError("Please enter a phone number we can share with the host.");
      return;
    }
    setError(null);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sender));
      }
    } catch {}

    const eventLabel = eventTitle?.trim() || "the event";
    const salutation = rsvpName?.trim() || "there";
    const senderName =
      `${sender.firstName.trim()} ${sender.lastName.trim()}`.trim();
    const guest = sender.forWho.trim();
    const guestPhraseAttend = guest ? `${guest} will attend` : "I will attend";
    const guestPhraseMaybe = guest
      ? `${guest} might be able to attend`
      : "I might be able to attend";

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

  const handleEmailIntent = (nextIntent: ResponseIntent) => {
    if (!rsvpEmail || !nextIntent) return;
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
      handleEmailIntent(nextIntent);
      return;
    }
    if (nextIntent === "decline") {
      handleDecline();
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {RSVP_OPTIONS.map((option) => (
          <button
            key={option.intent}
            type="button"
            onClick={() => openModalFor(option.intent)}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-surface/90"
          >
            <span aria-hidden="true">{option.icon}</span>
            <span suppressHydrationWarning>{option.label}</span>
          </button>
        ))}
      </div>

      {declineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          {/* Force modal to follow site theme tokens; avoid OS auto-dark */}
          <div
            className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl"
            style={{ colorScheme: theme }}
          >
            <h3 className="text-lg font-semibold text-foreground">
              Thanks for the RSVP
            </h3>
            <div className="mt-3 space-y-2 text-sm text-foreground/80">
              {declineLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeDeclineModal}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary hover:opacity-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && intent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          {/* Force modal to follow site theme tokens; avoid OS auto-dark */}
          <div
            className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl"
            style={{ colorScheme: theme }}
          >
            <h3 className="text-lg font-semibold text-foreground">
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
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
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

