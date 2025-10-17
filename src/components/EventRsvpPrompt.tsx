"use client";

import { FormEvent, useEffect, useState } from "react";

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
  eventTitle,
  shareUrl,
}: EventRsvpPromptProps) {
  const [intent, setIntent] = useState<ResponseIntent>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [sender, setSender] = useState<StoredSender>(initialSender);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
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
  }, []);

  if (!rsvpPhone) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!intent) return;
    if (!sender.firstName.trim() || !sender.lastName.trim()) {
      setError("Please enter both first and last name.");
      return;
    }
    if (!sender.phone.trim()) {
      setError("Please enter a phone number we can share with the host.");
      return;
    }
    setError(null);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sender));
      }
    } catch {}

    const salutation = rsvpName?.trim() || "there";
    const senderName = `${sender.firstName.trim()} ${sender.lastName.trim()}`.trim();
    const guest = sender.forWho.trim();
    const guestPhraseAttend = guest
      ? `${guest} will attend`
      : "I will attend";
    const guestPhraseDecline = guest
      ? `${guest} will not be able to attend`
      : "I won't be able to attend";
    const guestPhraseMaybe = guest
      ? `${guest} might be able to attend`
      : "I might be able to attend";

    const eventLabel = eventTitle?.trim() || "the event";
    let bodyCore = "";
    if (intent === "attend") {
      bodyCore = `${guestPhraseAttend} ${eventLabel}! Looking forward to it.`;
    } else if (intent === "decline") {
      bodyCore = `${guestPhraseDecline} ${eventLabel}. Thank you for the invitation!`;
    } else if (intent === "maybe") {
      bodyCore = `${guestPhraseMaybe} ${eventLabel}, but we're not sure yet. We'll confirm soon!`;
    }

    const intro = `Hi ${salutation}, this is ${senderName}.`;
    const contactLine = `You can reach me at ${sender.phone.trim()}.`;
    const footer = shareUrl ? `\n${shareUrl}` : "";
    const smsMessage = `${intro} ${bodyCore} ${contactLine}`.trim();
    const fullMessage = `${smsMessage}${footer}`.trim();
    const href = `sms:${encodeURIComponent(rsvpPhone)}?&body=${encodeURIComponent(
      fullMessage
    )}`;
    window.location.href = href;

    setModalOpen(false);
    setIntent(null);
  };

  const clearAndClose = () => {
    setModalOpen(false);
    setIntent(null);
    setError(null);
  };

  const openModalFor = (nextIntent: ResponseIntent) => {
    setIntent(nextIntent);
    setError(null);
    setModalOpen(true);
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

      {modalOpen && intent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl dark:bg-neutral-900">
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
                <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
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
