"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useRecaptcha } from "@/hooks/useRecaptcha";

type ContactResponse = { ok?: boolean; delivered?: boolean; error?: string };

export default function AccountDeletionRequestForm({
  accountEmail,
}: {
  accountEmail?: string;
}) {
  const id = useId();
  const { executeRecaptcha, recaptchaConfigured, recaptchaReady } = useRecaptcha();
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !confirmed) return;
    const formData = new FormData(event.currentTarget);
    const requestEmail = (accountEmail || email).trim();
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const recaptchaToken = await executeRecaptcha("contact");
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: requestEmail,
          title: "Envitefy account deletion request",
          message: [
            "Please permanently delete my Envitefy account and its associated personal data.",
            `Account email: ${requestEmail}`,
            "I understand that completed deletion cannot be undone.",
            "Please confirm the expected completion time and explain any data that must be retained and for how long.",
            "",
            "Submitted through the Envitefy account deletion form. This is a request only; account ownership must be verified with the account holder before any deletion. An entered email address is not proof of ownership.",
          ].join("\n"),
          website: String(formData.get("website") || ""),
          recaptchaToken,
        }),
      });
      const result = (await response.json().catch(() => null)) as ContactResponse | null;
      if (!response.ok || result?.ok !== true || result.delivered !== true) {
        throw new Error(
          response.status === 429
            ? "Too many requests. Please wait a few minutes and try again."
            : "Your request could not be sent. Please try again or contact Envitefy support.",
        );
      }
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.startsWith("Too many requests")
          ? cause.message
          : "Your request could not be sent. Please try again or contact Envitefy support.",
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
      requestAnimationFrame(() => feedbackRef.current?.focus());
    }
  }

  if (sent) {
    return (
      <div ref={feedbackRef} tabIndex={-1} role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2">
        <p className="font-semibold">Deletion request sent</p>
        <p className="mt-2">
          Envitefy support will reply to <span className="break-all font-semibold">{accountEmail || email}</span> to
          verify account ownership and explain the next steps. Your account has not been deleted yet.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative space-y-5" aria-busy={submitting}>
      <div>
        <label htmlFor={`${id}-email`} className="block text-sm font-semibold text-slate-900">Account email</label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          readOnly={Boolean(accountEmail)}
          disabled={submitting}
          value={accountEmail || email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={`${id}-email-help`}
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 read-only:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7964ad]"
        />
        <p id={`${id}-email-help`} className="mt-2 text-sm leading-6 text-slate-600">
          Use the email you use to sign in to Envitefy. We will verify ownership before deleting any data.
        </p>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">
        <input
          type="checkbox"
          required
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          disabled={submitting}
          className="mt-1 h-4 w-4 shrink-0 accent-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <span>I request deletion of my Envitefy account and associated data. I understand that completed deletion is permanent.</span>
      </label>
      {error ? <div ref={feedbackRef} tabIndex={-1} role="alert" className="text-sm leading-6 text-rose-800">{error}</div> : null}
      <button
        type="submit"
        disabled={!confirmed || submitting || (recaptchaConfigured && !recaptchaReady)}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-800 active:bg-rose-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600"
      >
        {submitting ? "Sending request…" : "Request account deletion"}
      </button>
      {recaptchaConfigured && !recaptchaReady ? (
        <p role="status" className="text-sm leading-6 text-slate-600">Loading security verification. If it does not load, use the contact link below.</p>
      ) : null}
      <p className="text-sm leading-6 text-slate-600">Submitting sends a request to Envitefy support. Your account remains active until the verified request is processed.</p>
    </form>
  );
}
