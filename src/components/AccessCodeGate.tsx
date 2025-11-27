"use client";

import { useState } from "react";

type Props = {
  eventId: string;
  hint?: string | null;
  className?: string;
  submitLabel?: string;
};

export default function AccessCodeGate({
  eventId,
  hint,
  className,
  submitLabel = "Unlock event",
}: Props) {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Enter the access code.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((payload && payload.error) || "That code did not match.");
        setSubmitting(false);
        return;
      }
      window.location.reload();
    } catch (err) {
      console.error("Failed to unlock event", err);
      setError("Could not verify the code. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className={className ?? "space-y-3"}>
      <div className="space-y-1">
        <label htmlFor="access-code" className="text-sm font-medium text-neutral-900">
          Enter the access code
        </label>
        <div className="flex gap-2">
          <input
            id="access-code"
            type={showCode ? "text" : "password"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-base shadow-sm focus:border-purple-500 focus:outline-none"
            placeholder="Cardinals2025"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowCode((prev) => !prev)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {showCode ? "Hide" : "Show"}
          </button>
        </div>
        {hint && (
          <p className="text-xs text-neutral-600">
            Hint: {hint}
          </p>
        )}
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || !code.trim()}
        className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Checking..." : submitLabel}
      </button>
      <p className="text-xs text-neutral-500">
        Use the password your coach shared with the invite.
      </p>
    </form>
  );
}
