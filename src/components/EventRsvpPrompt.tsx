"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ActionType = "sms" | "call" | null;

type StoredSender = {
  firstName: string;
  lastName: string;
  forWho: string;
};

type EventRsvpPromptProps = {
  rsvpName?: string | null;
  rsvpPhone?: string | null;
  eventTitle: string;
  shareUrl?: string | null;
  isAuthenticated: boolean;
  defaultSmsBody?: string | null;
};

const STORAGE_KEY = "snapmydate:rsvp-sender";

const initialSender: StoredSender = {
  firstName: "",
  lastName: "",
  forWho: "",
};

export default function EventRsvpPrompt({
  rsvpName,
  rsvpPhone,
  eventTitle,
  shareUrl,
  isAuthenticated,
  defaultSmsBody,
}: EventRsvpPromptProps) {
  const [modalOpen, setModalOpen] = useState<ActionType>(null);
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
        });
      }
    } catch {}
  }, []);

  const authenticatedSmsHref = useMemo(() => {
    if (!rsvpPhone) return null;
    const body = defaultSmsBody?.trim();
    if (!body) return `sms:${encodeURIComponent(rsvpPhone)}`;
    return `sms:${encodeURIComponent(rsvpPhone)}?&body=${encodeURIComponent(
      body
    )}`;
  }, [rsvpPhone, defaultSmsBody]);

  if (!rsvpPhone) {
    return null;
  }

  const telHref = `tel:${encodeURIComponent(rsvpPhone)}`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modalOpen) return;
    if (!sender.firstName.trim() || !sender.lastName.trim()) {
      setError("Please enter both first and last name.");
      return;
    }
    setError(null);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sender));
      }
    } catch {}

    if (modalOpen === "sms") {
      const salutation = rsvpName?.trim() || "there";
      const intro = `Hi ${salutation}, this is ${
        sender.firstName.trim()
      } ${sender.lastName.trim()}`;
      const subjectLine = sender.forWho.trim()
        ? ` RSVP-ing for ${sender.forWho.trim()}`
        : "";
      const messageBody = `${intro}${subjectLine}. ${
        eventTitle ? `I'm contacting you about ${eventTitle}.` : ""
      }`;
      const footer = shareUrl ? `\n${shareUrl}` : "";
      const fullMessage = `${messageBody}${footer}`.trim();
      const href = `sms:${encodeURIComponent(rsvpPhone)}?&body=${encodeURIComponent(
        fullMessage
      )}`;
      window.location.href = href;
    } else if (modalOpen === "call") {
      window.location.href = telHref;
    }

    setModalOpen(null);
  };

  const clearAndClose = () => {
    setModalOpen(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {isAuthenticated ? (
          <>
            <a
              href={authenticatedSmsHref || undefined}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-surface/90"
            >
              Text {rsvpPhone}
            </a>
            <a
              href={telHref}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-surface/90"
            >
              Call
            </a>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setModalOpen("sms")}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-surface/90"
            >
              Text {rsvpPhone}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen("call")}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-surface/90"
            >
              Call
            </button>
          </>
        )}
      </div>

      {!isAuthenticated && modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl dark:bg-neutral-900">
            <h3 className="text-lg font-semibold text-foreground">
              Introduce yourself before you RSVP
            </h3>
            <p className="mt-2 text-sm text-foreground/70">
              We’ll open your {modalOpen === "sms" ? "text" : "call"} after you share who is reaching out.
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
