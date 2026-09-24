"use client";
import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { signupAccessInstructions } from "@/lib/signup-access";

type Recipient = { id: string; name: string; email: string; status: "pending" | "accepted" };
const actionClass =
  "min-h-11 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-surface)] px-4 py-2 text-sm font-semibold disabled:opacity-50";

export default function SignupSharing({
  eventId,
  requiresInvitation = false,
  publicPath,
  published = true,
}: {
  eventId?: string;
  requiresInvitation?: boolean;
  publicPath?: string;
  published?: boolean;
}) {
  const linkId = useId();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const load = async () => {
    if (!eventId || !published) return;
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
    setLink(published && eventId ? window.location.origin + (publicPath || `/smart-signup-form/${encodeURIComponent(eventId)}`) : "");
  }, [eventId, publicPath, published]);
  useEffect(() => {
    if (open) void load();
  }, [open, eventId]);
  return (
    <section
      aria-label="Share signup"
      className="rounded-xl border border-[var(--signup-border)] bg-[var(--signup-surface)] p-4 space-y-3"
    >
      <h3 className="font-semibold">Share your signup</h3>
      {!published || !eventId ? (
        <p className="text-sm">Publish your signup to get a shareable link.</p>
      ) : <>
      <p className="text-sm">{signupAccessInstructions(requiresInvitation)}</p>
      <div className="space-y-1">
        <label htmlFor={linkId} className="block text-sm">
          Signup link
        </label>
        <div className="relative">
          <input
            id={linkId}
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="min-h-11 w-full min-w-0 rounded-lg border border-[var(--signup-border)] bg-[var(--signup-page)] pl-3 pr-14"
          />
          <button
            type="button"
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-lg text-[var(--signup-text)] transition hover:bg-[var(--signup-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            aria-label={copied ? "Signup link copied" : "Copy signup link"}
            title={copied ? "Copied" : "Copy signup link"}
            disabled={!link}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setMessage("Signup link copied.");
              } catch {
                setCopied(false);
                setMessage("Select and copy the signup link from the field.");
              }
            }}
          >
            {copied ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Copy size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <a href={`${publicPath || `/smart-signup-form/${encodeURIComponent(eventId)}`}#signup-host-dashboard`} className={`${actionClass} inline-flex items-center`}>
          View host dashboard
        </a>
        {requiresInvitation && (
          <button
            type="button"
            className={actionClass}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            Invite people &amp; check access
          </button>
        )}
      </div>
      {requiresInvitation && open && (
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
      </>}
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
