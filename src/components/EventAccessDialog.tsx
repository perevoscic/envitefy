"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, UserPlus, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { EventAccessPerson } from "@/lib/event-collaboration-types";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50";
export default function EventAccessDialog({
  eventId,
  eventTitle,
  className,
}: {
  eventId: string;
  eventTitle: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [people, setPeople] = useState<EventAccessPerson[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const readController = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const mutationPending = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const endpoint = `/api/events/${encodeURIComponent(eventId)}/collaborators`;
  useEffect(() => {
    setOpen(false);
    setPeople([]);
    setLoaded(false);
    setLoading(false);
    setBusy(false);
    setEmail("");
    setError("");
    setMessage("");
    mutationPending.current = false;
    return () => {
      readController.current?.abort();
      readController.current = null;
      requestId.current += 1;
    };
  }, [eventId]);
  async function request(method = "GET", recipient?: string, personId?: string) {
    if (mutationPending.current) return;
    readController.current?.abort();
    const currentId = ++requestId.current;
    const read = method === "GET";
    const controller = read ? new AbortController() : null;
    readController.current = controller;
    setLoading(read);
    if (!read) {
      mutationPending.current = true;
      setBusy(true);
    }
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${endpoint}${personId ? `?personId=${encodeURIComponent(personId)}` : ""}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          ...(controller ? { signal: controller.signal } : {}),
          ...(recipient ? { body: JSON.stringify({ email: recipient }) } : {}),
        },
      );
      const result = await response.json();
      if (currentId !== requestId.current) return;
      if (!response.ok)
        throw new Error(result.error || "Access could not be updated. Please try again.");
      setPeople(result.people || []);
      setLoaded(true);
      if (method === "POST") {
        setEmail("");
        setMessage(
          result.emailSent
            ? "Invitation sent. It expires in seven days."
            : "The invitation was created, but its email could not be sent. Use Resend to try again.",
        );
      } else if (method === "DELETE")
        setMessage("Access removed. This person can no longer edit the event.");
    } catch (cause) {
      if (currentId !== requestId.current || controller?.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Access could not be loaded.");
    } finally {
      if (currentId === requestId.current) {
        readController.current = null;
        setLoading(false);
        if (!read) {
          mutationPending.current = false;
          setBusy(false);
        }
      }
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void request("POST", email.trim());
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void request();
        else if (readController.current) {
          readController.current.abort();
          readController.current = null;
          requestId.current += 1;
          setLoading(false);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button
          ref={trigger}
          type="button"
          className={className || `${button} text-violet-700 hover:bg-violet-50`}
        >
          <UserPlus size={18} aria-hidden="true" />
          <span>Manage access</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-sm" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
          className="fixed left-1/2 top-1/2 z-[91] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 text-slate-950 shadow-2xl sm:p-7"
        >
          <Dialog.Close
            className={`${button} absolute right-2 top-2 min-w-11 text-slate-700`}
            aria-label="Close manage access"
          >
            <X size={20} />
          </Dialog.Close>
          <Dialog.Title className="pr-10 text-xl font-semibold">Manage access</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-slate-600">
            Invite a co-host to {eventTitle}. They can edit, save and publish this event and manage
            its RSVPs and messages. Only you can manage co-hosts or delete the event.
          </Dialog.Description>
          <form onSubmit={submit} className="mt-5 space-y-2">
            <label htmlFor={`cohost-email-${eventId}`} className="text-sm font-semibold">
              Co-host email
            </label>
            <input
              id={`cohost-email-${eventId}`}
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-violet-600"
            />
            <p className="text-sm text-slate-600">
              They can create an account when they accept. Access applies only to this event.
            </p>
            <button
              type="submit"
              disabled={busy}
              className={`${button} w-full bg-violet-700 text-white hover:bg-violet-800`}
            >
              {busy ? (
                <Loader2
                  size={18}
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <UserPlus size={18} aria-hidden="true" />
              )}
              Invite co-host
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="mt-3 text-sm text-slate-700">
              {message}
            </p>
          )}
          <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="font-semibold">Co-hosts and invitations</h3>
            {loading ? (
              <p role="status" className="mt-2 text-sm">
                {loaded ? "Refreshing access…" : "Loading access…"}
              </p>
            ) : (
              loaded &&
              !people.length && <p className="mt-2 text-sm text-slate-600">No co-hosts yet.</p>
            )}
            <ul className="mt-2 divide-y divide-slate-200">
              {people.map((person) => (
                <li key={person.id} className="py-3">
                  <p className="break-words text-sm font-semibold">{person.name || person.email}</p>
                  {person.name && (
                    <p className="break-words text-sm text-slate-600">{person.email}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-600">
                    {person.status === "accepted"
                      ? "Co-host"
                      : person.status === "expired"
                        ? "Invitation expired"
                        : person.emailStatus === "failed"
                          ? "Invitation email failed"
                          : person.status === "pending"
                            ? "Invitation pending"
                            : "Access removed"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {person.status !== "accepted" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void request("POST", person.email)}
                        className={`${button} text-violet-700 hover:bg-violet-50`}
                      >
                        Resend
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void request("DELETE", undefined, person.id)}
                      className={`${button} text-rose-700 hover:bg-rose-50`}
                    >
                      {person.status === "accepted" ? "Remove access" : "Cancel invitation"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
