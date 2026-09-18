"use client";

import { useEffect, useRef, useState } from "react";
import SignupFormFooter from "./SignupFormFooter";
import SignupRecovery from "./SignupRecovery";

export default function SignupManageAccess({ eventId }: { eventId: string }) {
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    // Fragments never reach server/access logs; remove the secret from browser history immediately.
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) {
      setError("This link is missing or has expired. Request a new private link below.");
      return;
    }
    void fetch(`/api/history/${encodeURIComponent(eventId)}/signup/manage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const result: { error?: string } | null = await response.json().catch(() => null);
        if (!response.ok) {
          setError(result?.error || "This link is no longer available. Request a new one below.");
          return;
        }
        window.location.replace(`/smart-signup-form/${encodeURIComponent(eventId)}#my-signup`);
      })
      .catch(() =>
        setError(
          "We couldn’t open your signup. Check your connection and reopen your email link, or request a new one below.",
        ),
      );
  }, [eventId]);

  return (
    <main
      className="mx-auto max-w-xl space-y-6 px-5 py-16 text-slate-900"
      style={
        {
          "--signup-border": "#d5d1db",
          "--signup-page": "#faf8fc",
          "--signup-surface": "#ffffff",
          "--signup-text": "#182336",
          "--signup-muted": "#52596a",
        } as React.CSSProperties
      }
    >
      <h1 className="text-3xl font-semibold">Manage your signup</h1>
      {error ? (
        <>
          <p role="alert">{error}</p>
          <SignupRecovery eventId={eventId} />
          <a
            className="inline-flex min-h-11 items-center underline"
            href={`/smart-signup-form/${encodeURIComponent(eventId)}`}
          >
            Back to signup form
          </a>
        </>
      ) : (
        <p role="status">Opening your signup…</p>
      )}
      <SignupFormFooter />
    </main>
  );
}
