"use client";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  RotateCw,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { EventAccessPerson } from "@/lib/event-collaboration-types";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50";
function accessStatus(person: EventAccessPerson): { label: string; dot: string } {
  if (person.status === "accepted") return { label: "Co-host", dot: "bg-emerald-500" };
  if (person.status === "expired") return { label: "Invitation expired", dot: "bg-slate-400" };
  if (person.emailStatus === "failed")
    return { label: "Invitation email failed", dot: "bg-rose-500" };
  if (person.status === "pending") return { label: "Invitation pending", dot: "bg-amber-500" };
  return { label: "Access removed", dot: "bg-slate-400" };
}

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
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
          className="fixed left-1/2 top-1/2 z-[91] flex max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white text-slate-950 shadow-xl ring-1 ring-slate-900/10"
        >
          <div className="relative px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
            <Dialog.Close
              className={`${button} absolute right-2 top-2 min-w-11 text-slate-500 hover:bg-slate-100 hover:text-slate-900`}
              aria-label="Close manage access"
            >
              <X size={18} />
            </Dialog.Close>
            <Dialog.Title className="pr-10 text-lg font-semibold tracking-tight">
              Manage access
            </Dialog.Title>
            <Dialog.Description className="mt-1 pr-6 text-sm leading-relaxed text-slate-500">
              Co-hosts can edit, publish and manage RSVPs and messages for{" "}
              <span className="font-medium text-slate-700">{eventTitle}</span>. Only you can manage
              co-hosts or delete the event.
            </Dialog.Description>
            <form onSubmit={submit} className="mt-5">
              <label
                htmlFor={`cohost-email-${eventId}`}
                className="text-sm font-medium text-slate-800"
              >
                Co-host email
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id={`cohost-email-${eventId}`}
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-describedby={`cohost-email-help-${eventId}`}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className={`${button} shrink-0 bg-violet-700 px-4 text-white shadow-sm hover:bg-violet-800`}
                >
                  {busy && (
                    <Loader2
                      size={16}
                      className="animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  )}
                  Invite co-host
                </button>
              </div>
              <p id={`cohost-email-help-${eventId}`} className="mt-2 text-xs text-slate-500">
                They can create an account when they accept. Access applies only to this event.
              </p>
            </form>
            {error && (
              <p
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              >
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                {message}
              </p>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">People with access</h3>
              {loading && (
                <p role="status" className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Loader2
                    size={12}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  {loaded ? "Refreshing access…" : "Loading access…"}
                </p>
              )}
            </div>
            <ul className="mt-2 divide-y divide-slate-200/80">
              <li className="flex items-center gap-3 py-2.5">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-700 text-xs font-semibold text-white"
                >
                  You
                </span>
                <p className="min-w-0 flex-1 text-sm font-medium text-slate-900">You</p>
                <span className="pr-1 text-xs font-medium text-slate-500">Owner</span>
              </li>
              {people.map((person) => {
                const status = accessStatus(person);
                return (
                  <li key={person.id} className="flex items-center gap-3 py-2.5">
                    <span
                      aria-hidden="true"
                      className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                        person.status === "accepted"
                          ? "bg-violet-100 text-violet-800"
                          : "border border-dashed border-slate-300 bg-white text-slate-500"
                      }`}
                    >
                      {(person.name || person.email).trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium text-slate-900"
                        title={person.name || person.email}
                      >
                        {person.name || person.email}
                      </p>
                      <p className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                        <span
                          aria-hidden="true"
                          className={`size-1.5 shrink-0 rounded-full ${status.dot}`}
                        />
                        <span className="truncate" title={person.name ? person.email : undefined}>
                          {status.label}
                          {person.name ? ` · ${person.email}` : ""}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      {person.status !== "accepted" && (
                        <button
                          type="button"
                          disabled={busy}
                          aria-label="Resend"
                          title="Resend invitation"
                          onClick={() => void request("POST", person.email)}
                          className={`${button} min-w-11 px-2 text-slate-600 hover:bg-white hover:text-violet-700`}
                        >
                          <RotateCw size={15} aria-hidden="true" />
                          <span className="hidden sm:inline">Resend</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={
                          person.status === "accepted" ? "Remove access" : "Cancel invitation"
                        }
                        title={person.status === "accepted" ? "Remove access" : "Cancel invitation"}
                        onClick={() => void request("DELETE", undefined, person.id)}
                        className={`${button} min-w-11 px-2 text-slate-400 hover:bg-white hover:text-rose-700`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {loaded && !loading && !people.length && (
              <p className="pt-1 text-xs text-slate-500">No co-hosts yet.</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
