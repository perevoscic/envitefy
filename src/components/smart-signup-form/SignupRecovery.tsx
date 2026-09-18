"use client";

import { type FormEvent, useId, useState } from "react";

export default function SignupRecovery({ eventId }: { eventId: string }) {
  const id = useId();
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/history/${encodeURIComponent(eventId)}/signup/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });
      const result: { message?: string; error?: string } = await response.json();
      if (!response.ok) setError(result.error || "We couldn’t send your link. Please try again.");
      else
        setMessage(result.message || "Check the email you used to sign up for your private link.");
    } catch {
      setError("Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <details className="rounded-xl border border-[var(--signup-border)] bg-[var(--signup-page)] px-4 py-2 text-[var(--signup-text)]">
      <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
        Already signed up? Find my signup
      </summary>
      <form onSubmit={recover} className="space-y-3 pb-3 pt-2">
        <p id={`${id}-help`} className="text-sm text-[var(--signup-muted)]">
          Enter the email or phone number you used. We’ll email a private link to the address saved
          with your signup so you can edit or cancel on any device. No account needed.
        </p>
        <label htmlFor={id} className="block text-sm font-medium">
          Email or phone number
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={id}
            type="text"
            autoComplete="username"
            required
            maxLength={254}
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
            aria-invalid={Boolean(error)}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-3 text-base text-[var(--signup-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          <button
            type="submit"
            disabled={sending}
            className="min-h-11 shrink-0 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 text-sm font-semibold text-[var(--signup-text)] disabled:opacity-60"
          >
            {sending ? "Sending…" : "Email my link"}
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <p className="text-xs text-[var(--signup-muted)]">
          If you didn’t provide an email or no longer have access to it, contact the organizer.
        </p>
      </form>
    </details>
  );
}
