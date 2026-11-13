"use client";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  RotateCw,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { EventAccessPerson } from "@/lib/event-collaboration-types";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50";
function accessStatus(person: EventAccessPerson): { label: string; pill: string } {
  if (person.status === "accepted")
    return { label: "Co-host", pill: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (person.status === "expired")
    return { label: "Expired", pill: "border-slate-200 bg-slate-50 text-slate-500" };
  if (person.emailStatus === "failed")
    return { label: "Email failed", pill: "border-rose-200 bg-rose-50 text-rose-700" };
  if (person.status === "pending")
    return { label: "Pending", pill: "border-amber-200 bg-amber-50 text-amber-700" };
  return { label: "Removed", pill: "border-slate-200 bg-slate-50 text-slate-500" };
}

function StatusPill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium leading-4 ${className}`}
    >
      {children}
    </span>
  );
}

function Avatar({ text, tone }: { text: string; tone: "owner" | "member" | "invite" }) {
  const style =
    tone === "owner"
      ? "bg-foreground text-background"
      : tone === "member"
        ? "bg-surface-alt text-foreground"
        : "border border-dashed border-border bg-surface text-muted-foreground";
  return (
    <span
      aria-hidden="true"
      className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${style}`}
    >
      {text}
    </span>
  );
}

export default function EventAccessDialog({
  eventId,
  eventTitle,
  className,
  resourceType = "event",
  labelClassName,
}: {
  eventId: string;
  eventTitle: string;
  className?: string;
  resourceType?: "event" | "signup";
  labelClassName?: string;
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
  const accessLabel = people.length ? "Manage access" : "Invite co-host";
  const request = useCallback(async (method = "GET", recipient?: string, personId?: string) => {
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
        setMessage(`Access removed. This person can no longer edit the ${resourceType === "signup" ? "form" : "event"}.`);
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
  }, [endpoint, resourceType]);
  useEffect(() => {
    setOpen(false);
    setPeople([]);
    setLoaded(false);
    setBusy(false);
    setEmail("");
    mutationPending.current = false;
    void request();
    return () => {
      readController.current?.abort();
      readController.current = null;
      requestId.current += 1;
    };
  }, [request]);
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
          aria-label={accessLabel}
          className={className || `${button} text-violet-700 hover:bg-violet-50`}
        >
          <UserPlus size={18} aria-hidden="true" />
          <span className={labelClassName}>{accessLabel}</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-[3px]" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
          className="fixed left-1/2 top-1/2 z-[91] flex max-h-[88dvh] w-[calc(100%_-_2rem)] max-w-[34rem] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-surface font-sans text-foreground shadow-[0_24px_70px_-16px_rgba(15,23,42,0.45)]"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="relative px-5 pt-6 sm:px-7 sm:pt-7">
              <Dialog.Close
                className={`${button} absolute right-2.5 top-2.5 min-w-11 text-muted-foreground hover:bg-surface-alt hover:text-foreground`}
                aria-label="Close manage access"
              >
                <X size={18} />
              </Dialog.Close>
              <div className="flex items-start gap-3.5 pr-10">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-2xl border border-border bg-surface-raised text-foreground"
                >
                  <Users size={18} />
                </span>
                <div className="min-w-0">
                  <Dialog.Title className="font-sans text-xl font-semibold leading-7 tracking-tight">
                    Manage access
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                    Invite co-hosts to help run{" "}
                    <span className="font-medium text-foreground">{eventTitle}</span>.
                  </Dialog.Description>
                </div>
              </div>
              {resourceType === "signup" && (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Co-hosts can edit and publish this form, view and manage participants, export responses and open or close signups. Only you can manage co-host access or delete the form.
                </p>
              )}
              <form onSubmit={submit} className="mt-7">
                <label
                  htmlFor={`cohost-email-${eventId}`}
                  className="text-sm font-medium text-foreground"
                >
                  Co-host email
                </label>
                <div className="mt-2 flex items-center gap-1 rounded-2xl border border-input bg-field-background p-1.5 pl-3.5 transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
                  <Mail size={17} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                  <input
                    id={`cohost-email-${eventId}`}
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-lg border-0 bg-transparent! px-1.5 text-base text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:outline-none! sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    aria-label="Invite co-host"
                    className={`${button} shrink-0 rounded-xl bg-foreground px-4 text-background hover:bg-foreground/90`}
                  >
                    {busy && (
                      <Loader2
                        size={15}
                        className="animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    )}
                    Invite
                  </button>
                </div>
              </form>
              {error && (
                <p
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800"
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}
              {message && (
                <p
                  role="status"
                  className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800"
                >
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {message}
                </p>
              )}
            </div>
            <div className="mx-5 mt-7 border-t border-border pb-3 pt-5 sm:mx-7">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-foreground">
                  People with access
                  <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-surface-alt px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {people.length + 1}
                  </span>
                </h3>
                {loading && (
                  <p role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2
                      size={12}
                      className="animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    {loaded ? "Refreshing access…" : "Loading access…"}
                  </p>
                )}
              </div>
              <ul className="mt-2 divide-y divide-border">
                <li className="flex items-center gap-3 py-3.5">
                  <Avatar text="Y" tone="owner" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">You</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{resourceType === "signup" ? "Form owner" : "Event owner"}</p>
                  </div>
                  <StatusPill className="mr-1 border-border bg-surface-raised text-muted-foreground">
                    Owner
                  </StatusPill>
                </li>
                {people.map((person) => {
                  const status = accessStatus(person);
                  return (
                    <li key={person.id} className="flex items-center gap-2 py-3.5 sm:gap-3">
                      <Avatar
                        text={(person.name || person.email).trim().charAt(0).toUpperCase()}
                        tone={person.status === "accepted" ? "member" : "invite"}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]"
                          title={person.name || person.email}
                        >
                          {person.name || person.email}
                        </p>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                          <StatusPill className={status.pill}>{status.label}</StatusPill>
                          {person.name && (
                            <span className="truncate text-xs text-muted-foreground" title={person.email}>
                              {person.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center">
                        {person.status !== "accepted" && (
                          <button
                            type="button"
                            disabled={busy}
                            aria-label="Resend"
                            title="Resend invitation"
                            onClick={() => void request("POST", person.email)}
                            className={`${button} min-w-11 rounded-xl px-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground`}
                          >
                            <RotateCw size={15} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={
                            person.status === "accepted" ? "Remove access" : "Cancel invitation"
                          }
                          title={
                            person.status === "accepted" ? "Remove access" : "Cancel invitation"
                          }
                          onClick={() => void request("DELETE", undefined, person.id)}
                          className={`${button} min-w-11 rounded-xl px-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-700`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {loaded && !loading && !people.length && (
                <p className="pb-2 text-xs text-muted-foreground">No co-hosts yet.</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-surface-raised px-5 py-4 sm:px-7">
            <p className="flex items-center gap-2 text-[13px] font-medium leading-5 text-foreground">
              <Clock size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              Invites expire after 7 days.
            </p>
            <Dialog.Close className={`${button} min-w-20 shrink-0 border border-border bg-surface px-5 text-foreground hover:bg-surface-alt`}>
              Done
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
