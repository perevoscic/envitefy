"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SIGNUP_ALERT_LABELS,
  type SignupHostAlertKind,
  type SignupHostAlertPreferences,
} from "@/lib/signup-host-activity";

type Settings = {
  email: string | null;
  preferences: SignupHostAlertPreferences;
  deliveries: Array<{
    id: string;
    kind: SignupHostAlertKind;
    name: string;
    status: string;
    createdAt: string;
  }>;
};
const statusLabels: Record<string, string> = {
  pending: "Queued for sending",
  sending: "Sending",
  accepted: "Accepted by email provider",
  failed: "Send failed",
  unknown: "Sending result unknown",
  skipped: "Skipped",
};
const labels: Array<[keyof SignupHostAlertPreferences, string]> = [
  ["newSignups", "New signups"],
  ["changes", "Signup changes"],
  ["cancellations", "Cancellations"],
  ["waitlist", "Waitlist additions and confirmations"],
];

export default function SignupHostAlerts({ eventId }: { eventId: string }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [preferences, setPreferences] = useState<SignupHostAlertPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const url = `/api/history/${encodeURIComponent(eventId)}/signup/alerts`;
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url, { cache: "no-store", signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load email alerts.");
        if (signal?.aborted) return;
        setSettings(data);
        setPreferences(data.preferences);
      } catch (failure) {
        if (!signal?.aborted)
          setError(failure instanceof Error ? failure.message : "Unable to load email alerts.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [url],
  );
  useEffect(() => {
    const controller = new AbortController();
    setSettings(null);
    setPreferences(null);
    setMessage(null);
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const save = async (alertId?: string) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertId ? { action: "retry", alertId } : { preferences }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save email alerts.");
      setSettings(data);
      setPreferences(data.preferences);
      setMessage(alertId ? "Email retry queued." : "Email alert preferences saved.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save email alerts.");
    } finally {
      setSaving(false);
    }
  };
  const dirty =
    settings &&
    preferences &&
    labels.some(([key]) => preferences[key] !== settings.preferences[key]);
  const enabled = preferences && labels.some(([key]) => preferences[key]);
  return (
    <details className="rounded-xl border border-[var(--signup-border)] bg-[var(--signup-page)] px-4">
      <summary className="min-h-11 cursor-pointer py-3 font-semibold">Email alerts</summary>
      <div className="space-y-3 pb-4 text-sm">
        {loading && !settings && <p role="status">Loading email alerts…</p>}
        {settings && preferences && (
          <>
            <p className="break-words">
              Send my alerts to{" "}
              <strong>{settings.email || "No email address on your account"}</strong>.
            </p>
            <p className="text-[var(--signup-muted)]">
              Owners and accepted co-hosts receive signup emails automatically, including who signed
              up and their selections. Turn them off or choose which updates you receive for this
              form. Your choices apply only to your account.
            </p>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
              <input
                type="checkbox"
                checked={!!enabled}
                disabled={saving || !settings.email}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setPreferences({
                    newSignups: checked,
                    changes: checked,
                    cancellations: checked,
                    waitlist: checked,
                  });
                  setMessage(null);
                }}
              />
              Receive signup emails
            </label>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {labels.map(([key, label]) => (
                <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    disabled={saving || !settings.email || !enabled}
                    onChange={(event) => {
                      setPreferences({ ...preferences, [key]: event.target.checked });
                      setMessage(null);
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 disabled:opacity-50"
              disabled={saving || !dirty || !settings.email}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save email preferences"}
            </button>
            <details>
              <summary className="min-h-11 cursor-pointer py-3">Recent email attempts</summary>
              <p className="mb-3 text-[var(--signup-muted)]">
                Provider acceptance does not confirm inbox delivery. Check spam if an accepted email
                is missing. An unknown result is held to avoid sending duplicates.
              </p>
              {settings.deliveries.length === 0 ? (
                <p>Your next signup activity will appear here.</p>
              ) : (
                <ul className="space-y-3">
                  {settings.deliveries.map((delivery) => (
                    <li key={delivery.id} className="break-words">
                      <strong>
                        {SIGNUP_ALERT_LABELS[delivery.kind]} · {delivery.name}
                      </strong>
                      <p>{statusLabels[delivery.status] || delivery.status}</p>
                      <time
                        dateTime={delivery.createdAt}
                        className="text-xs text-[var(--signup-muted)]"
                      >
                        {new Date(delivery.createdAt).toLocaleString()}
                      </time>
                      {delivery.status === "failed" && (
                        <button
                          type="button"
                          disabled={saving}
                          className="ml-3 min-h-11 rounded-lg border px-3"
                          onClick={() => void save(delivery.id)}
                        >
                          Retry email
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                disabled={loading || saving || !!dirty}
                className="mt-3 min-h-11 rounded-lg border px-3"
                onClick={() => void load()}
              >
                {loading ? "Refreshing…" : "Refresh email status"}
              </button>
            </details>
          </>
        )}
        {error && (
          <div role="alert">
            <p>{error}</p>
            {!settings && (
              <button
                type="button"
                disabled={loading}
                className="min-h-11 underline"
                onClick={() => void load()}
              >
                Retry loading email alerts
              </button>
            )}
          </div>
        )}
        {message && <p role="status">{message}</p>}
      </div>
    </details>
  );
}
