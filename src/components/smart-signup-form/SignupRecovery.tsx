"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";

export default function SignupRecovery({ eventId }: { eventId: string }) {
  const id = useId();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [contacts, setContacts] = useState({ email: "", phone: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const focusInput = useRef(false);
  const requestPending = useRef(false);

  useEffect(() => {
    if (!requestCount) return;
    if (detailsRef.current?.open) confirmationRef.current?.focus();
    const timeout = window.setTimeout(() => setCanResend(true), 30_000);
    return () => window.clearTimeout(timeout);
  }, [requestCount]);

  useEffect(() => {
    if (focusInput.current && !sent) {
      inputRef.current?.focus();
      focusInput.current = false;
    }
  }, [method, sent]);

  async function requestLink() {
    if (requestPending.current) return;
    requestPending.current = true;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/history/${encodeURIComponent(eventId)}/signup/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contacts[method].trim() }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) setError(result.error || "We couldn’t send your link. Please try again.");
      else {
        setSent(true);
        setCanResend(false);
        setRequestCount((count) => count + 1);
      }
    } catch {
      setError("Check your connection and try again.");
    } finally {
      requestPending.current = false;
      setSending(false);
    }
  }

  function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void requestLink();
  }

  function switchMethod() {
    focusInput.current = true;
    setError("");
    setMethod((current) => (current === "email" ? "phone" : "email"));
  }

  function tryAnotherContact() {
    focusInput.current = true;
    setError("");
    setSent(false);
  }

  return (
    <details
      ref={detailsRef}
      className="rounded-xl border border-[var(--signup-border)] bg-[var(--signup-page)] px-4 py-2 text-[var(--signup-text)]"
    >
      <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
        Edit or cancel your signup
      </summary>
      <div className="space-y-3 pb-2 pt-2">
        {sent ? (
          <section aria-labelledby={`${id}-confirmation`} className="space-y-3">
            <h3
              id={`${id}-confirmation`}
              ref={confirmationRef}
              tabIndex={-1}
              aria-describedby={`${id}-next-step`}
              className="w-fit rounded text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Check your email
            </h3>
            <p
              id={`${id}-next-step`}
              className="max-w-prose text-sm leading-relaxed text-[var(--signup-muted)]"
            >
              If your details match a signup with a saved email, you’ll receive a link to edit or
              cancel it.
            </p>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                disabled={sending || !canResend}
                onClick={() => void requestLink()}
                aria-describedby={!canResend ? `${id}-resend-help` : undefined}
                className="min-h-11 w-full rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 text-sm font-semibold enabled:hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 sm:w-auto"
              >
                {sending ? "Sending…" : "Resend link"}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={tryAnotherContact}
                className="min-h-11 text-left text-sm underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
              >
                Try another email or phone
              </button>
            </div>
            {!canResend && (
              <p id={`${id}-resend-help`} className="text-sm text-[var(--signup-muted)]">
                Allow a moment for the email to arrive before resending.
              </p>
            )}
          </section>
        ) : (
          <form onSubmit={recover} aria-busy={sending} className="space-y-3">
            <p
              id={`${id}-help`}
              className="max-w-prose text-sm leading-relaxed text-[var(--signup-muted)]"
            >
              {method === "email"
                ? "Enter the email you used to sign up. We’ll email you a link. No account needed."
                : "Enter the phone number you used to sign up. We’ll send the link to the email saved with your signup."}
            </p>
            <label htmlFor={id} className="block text-sm font-medium">
              {method === "email" ? "Email address" : "Phone number"}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                ref={inputRef}
                id={id}
                name={method}
                type={method === "email" ? "email" : "tel"}
                autoComplete={method === "email" ? "email" : "tel"}
                autoCapitalize="none"
                spellCheck={false}
                required
                readOnly={sending}
                maxLength={254}
                value={contacts[method]}
                onChange={(event) => {
                  setContacts((current) => ({ ...current, [method]: event.target.value }));
                  setError("");
                }}
                aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
                aria-invalid={Boolean(error)}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-3 text-base text-[var(--signup-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              />
              <button
                type="submit"
                disabled={sending}
                className="min-h-11 shrink-0 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 text-sm font-semibold text-[var(--signup-text)] enabled:hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
              >
                {sending ? "Sending…" : "Email me a link"}
              </button>
            </div>
            <button
              type="button"
              disabled={sending}
              onClick={switchMethod}
              className="min-h-11 text-left text-sm underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
            >
              {method === "email" ? "Use phone number instead" : "Use email address instead"}
            </button>
          </form>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm">
            {error}
          </p>
        )}
        <details className="border-t border-[var(--signup-border)]">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Need help?
          </summary>
          <div className="max-w-prose space-y-2 pb-2 text-sm leading-relaxed text-[var(--signup-muted)]">
            <p>
              Check your spam or junk folder. Your original confirmation email also has an “Update
              or cancel my signup” button.
            </p>
            <p>
              If you didn’t provide an email or no longer have access to it, contact the organizer
              using the details on your invitation or the message they shared with you.
            </p>
          </div>
        </details>
      </div>
    </details>
  );
}
