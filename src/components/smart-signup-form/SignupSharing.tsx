"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Recipient = { id: string; name: string; email: string; status: "pending" | "accepted" };
const actionClass =
  "min-h-11 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2 text-sm font-semibold disabled:opacity-50";

export default function SignupSharing({ eventId }: { eventId: string }) {
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/share?eventId=${encodeURIComponent(eventId)}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as {
        recipients?: Recipient[];
        error?: string;
      };
      if (!response.ok || !data.recipients)
        throw new Error(data.error || "Could not load invitations.");
      setRecipients(data.recipients);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load invitations.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setLink(window.location.origin + window.location.pathname);
  }, []);
  useEffect(() => {
    if (open) void load();
  }, [open, eventId]);
  return (
    <section
      aria-label="Share signup"
      className="rounded-xl border border-[var(--signup-border)] bg-[var(--signup-surface)] p-4 space-y-3"
    >
      <h3 className="font-semibold">Share your signup</h3>
      <p className="text-sm">
        Signup access is invitation-only. Participants need an Envitefy account, an invitation to
        that account, and must accept before signing up. A copied link does not grant access.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={actionClass}
          disabled={!link}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setMessage("Signup link copied. Share it with invited participants.");
            } catch {
              setMessage("Copy the signup link from the field below.");
            }
          }}
        >
          Copy signup link
        </button>
        <button
          type="button"
          className={actionClass}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          Invite people &amp; check access
        </button>
      </div>
      <label className="block text-sm">
        Signup link
        <input
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-page)] px-3"
        />
      </label>
      {open && (
        <div className="space-y-3 border-t border-[var(--signup-border)] pt-4">
          <form
            className="flex flex-wrap gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (sending) return;
              setSending(true);
              setMessage("");
              setError("");
              try {
                const response = await fetch("/api/events/share", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ eventId, recipientEmail: email.trim() }),
                });
                const data = (await response.json().catch(() => ({}))) as {
                  ok?: boolean;
                  error?: string;
                };
                if (!response.ok || !data.ok)
                  throw new Error(data.error || "The invitation could not be sent.");
                setEmail("");
                setMessage("Invitation created. The recipient must accept it before signing up.");
                await load();
              } catch (failure) {
                setError(failure instanceof Error ? failure.message : "Please try again.");
              } finally {
                setSending(false);
              }
            }}
          >
            <label className="w-full text-sm">
              Recipient's account email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-[var(--signup-border)] bg-[var(--signup-page)] px-3"
              />
            </label>
            <button type="submit" className={actionClass} disabled={sending}>
              {sending ? "Sending invitation…" : "Send invitation"}
            </button>
          </form>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold">Recipient access</h4>
            <button
              type="button"
              className={actionClass}
              disabled={loading}
              onClick={() => void load()}
            >
              {loading ? "Checking…" : "Refresh access"}
            </button>
          </div>
          {!loading && !error && !recipients.length && (
            <p className="text-sm">No participants invited yet.</p>
          )}
          <ul className="space-y-2 text-sm">
            {recipients.map((recipient) => (
              <li
                key={recipient.id}
                className="break-words rounded-lg border border-[var(--signup-border)] p-3"
              >
                <strong>{recipient.name || recipient.email}</strong>
                <div>{recipient.email}</div>
                <div>
                  {recipient.status === "accepted"
                    ? "Accepted · Can sign up"
                    : "Pending · Must accept invitation"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}

export function AcceptSignupInvitation({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="text-center space-y-3">
      <p>Your invitation is ready. Accept it to view the form and choose your slots.</p>
      <button
        type="button"
        className={actionClass}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/events/share/accept", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ eventId }),
            });
            if (!response.ok)
              throw new Error("Could not accept this invitation. Refresh and try again.");
            router.refresh();
          } catch (failure) {
            setError(failure instanceof Error ? failure.message : "Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Accepting…" : "Accept invitation & open signup"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
