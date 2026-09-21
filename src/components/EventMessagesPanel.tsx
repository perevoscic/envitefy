"use client";

import { Mail, RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUnsavedProgress } from "@/components/UnsavedProgressProvider";
import {
  validateEventMessage,
  type EventMessage,
  type EventMessagesData,
} from "@/lib/event-message-types";

const panel =
  "owner-workspace-glass-panel rounded-[24px] border border-black/5 bg-white/85 p-4 shadow-sm sm:p-6";
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600";
const primary = `${button} !border-slate-950 !bg-slate-950 !text-white`;
const field =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base font-normal text-slate-950 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

export default function EventMessagesPanel({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [data, setData] = useState<EventMessagesData | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [baseline, setBaseline] = useState({ subject: "", body: "" });
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const id = useRef<string | null>(null);
  const inFlight = useRef(false);
  const composer = useRef<HTMLHeadingElement>(null);
  const url = `/api/events/${encodeURIComponent(eventId)}/messages`;
  const dirty = subject !== baseline.subject || body !== baseline.body;

  const request = useCallback(
    async (payload?: object): Promise<EventMessagesData> => {
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "include",
        ...(payload
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          : {}),
      });
      const result = (await response.json().catch(() => null)) as
        | (EventMessagesData & { error?: string })
        | null;
      if (!response.ok || !result || !Array.isArray(result.messages)) {
        throw new Error(result?.error || "Messages could not be loaded. Please try again.");
      }
      setData(result);
      return result;
    },
    [url],
  );

  useEffect(() => {
    void request().catch((cause: Error) => setError(cause.message));
  }, [request]);

  function resetComposer() {
    id.current = null;
    setSubject("");
    setBody("");
    setBaseline({ subject: "", body: "" });
    setPreview(false);
    setLocked(false);
  }

  async function refresh() {
    setError("");
    try {
      const result = await request();
      if (
        id.current &&
        result.messages.some((message) => message.id === id.current && message.status === "queued")
      ) {
        resetComposer();
      } else {
        setLocked(false);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    }
  }

  async function saveDraft() {
    if (inFlight.current || locked) throw new Error("Wait for the current send to finish.");
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      id.current ??= crypto.randomUUID();
      const input = validateEventMessage({ id: id.current, subject, body }, false);
      await request({ action: "save", ...input });
      setSubject(input.subject);
      setBody(input.body);
      setBaseline(input);
      setNotice("Draft saved. No emails were sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The draft could not be saved.");
      throw cause;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const navigation = useUnsavedProgress({ dirty, busy, save: saveDraft, discard: resetComposer });

  async function processPending(messageId: string, snapshot: EventMessagesData) {
    let latest = snapshot;
    while (
      latest.messages
        .find((message) => message.id === messageId)
        ?.deliveries.some((delivery) => delivery.status === "pending")
    ) {
      latest = await request({ action: "process", id: messageId });
    }
    setNotice("Sending finished. Review each recipient’s status in the history below.");
  }

  async function send() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      id.current ??= crypto.randomUUID();
      const input = validateEventMessage({ id: id.current, subject, body });
      setLocked(true);
      const result = await request({ action: "send", ...input });
      resetComposer();
      await processPending(input.id, result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sending was interrupted. Refresh the history before trying again.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function continueMessage(message: EventMessage, retry: boolean) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request({ action: retry ? "retry" : "process", id: message.id });
      await processPending(message.id, result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sending was interrupted. Refresh the history to check progress.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const audience = `${data?.audienceCount ?? 0} ${(data?.audienceCount ?? 0) === 1 ? "guest" : "guests"}`;
  return (
    <section aria-label="Messages" className="space-y-4">
      <div className={panel}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#786bd6]">
              Messages
            </p>
            <h3 ref={composer} tabIndex={-1} className="mt-2 text-2xl font-semibold text-slate-950">
              Email guests
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Write an announcement, reminder, or change to share with your guests.
            </p>
          </div>
          <button
            type="button"
            className={button}
            disabled={busy}
            onClick={() => void refresh()}
            aria-label="Refresh messages"
          >
            <RefreshCw size={17} aria-hidden="true" />
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mt-4 rounded-xl bg-violet-50 p-3 text-sm text-violet-800">
            {notice}
          </p>
        ) : null}
        {!data ? (
          <p className="mt-4 text-sm text-slate-500">
            {error ? "Use Refresh messages to try again." : "Loading recipients and history…"}
          </p>
        ) : (
          <>
            <div className="my-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-bold text-slate-900">Yes and Maybe · {audience}</p>
              <p className="mt-1">
                Guests who answered No are excluded. Current responses are checked again when
                sending.
              </p>
              {!data.audienceCount ? (
                <p className="mt-2">
                  You can save a draft now. Sending becomes available when a Yes or Maybe guest has
                  an email address.
                </p>
              ) : null}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError("");
                setNotice("");
                try {
                  validateEventMessage({ id: crypto.randomUUID(), subject, body });
                  setPreview(true);
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : "Check your message.");
                }
              }}
            >
              {preview ? (
                <section
                  aria-label="Email preview"
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email preview
                  </p>
                  <h4 className="mt-3 break-words text-xl font-semibold text-slate-950">
                    {subject.trim()}
                  </h4>
                  <p className="mt-2 text-sm text-slate-500">{eventTitle}</p>
                  <p className="my-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
                    {body.trim()}
                  </p>
                  <a
                    href={data.eventUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center rounded-xl bg-violet-100 px-4 text-sm font-bold text-violet-800"
                  >
                    View event
                  </a>
                  <p className="mt-4 text-xs text-slate-500">
                    {data.replyTo
                      ? `Replies go to ${data.replyTo}.`
                      : "Guests can open the event for host contact details."}
                  </p>
                  <p className="mt-4 text-sm text-slate-500">
                    Sincerely,
                    <br />
                    <strong>Envitefy Team</strong>
                  </p>
                </section>
              ) : (
                <fieldset disabled={busy || locked} className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">
                    Subject
                    <input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      required
                      maxLength={160}
                      className={field}
                      placeholder="An update about your event"
                    />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Message
                    <textarea
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      required
                      maxLength={5000}
                      rows={6}
                      className={`${field} resize-y`}
                      placeholder="Tell guests what they need to know…"
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    Your event link and the Envitefy signature are included automatically.
                  </p>
                </fieldset>
              )}
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                {preview && !locked ? (
                  <button
                    type="button"
                    disabled={busy}
                    className={button}
                    onClick={() => setPreview(false)}
                  >
                    Edit message
                  </button>
                ) : null}
                {!locked ? (
                  <button
                    type="button"
                    disabled={busy || (!subject.trim() && !body.trim())}
                    className={button}
                    onClick={() => void saveDraft().catch(() => {})}
                  >
                    Save draft
                  </button>
                ) : null}
                {preview ? (
                  <button
                    type="button"
                    disabled={busy || !data.audienceCount}
                    className={primary}
                    onClick={() => void send()}
                  >
                    <Send size={16} aria-hidden="true" />
                    {busy ? "Sending…" : locked ? "Check and continue send" : `Send to ${audience}`}
                  </button>
                ) : (
                  <button type="submit" disabled={busy || !data.audienceCount} className={primary}>
                    <Mail size={16} aria-hidden="true" />
                    Preview email
                  </button>
                )}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Guest updates are sent only from Messages when you choose Send.
              </p>
            </form>
          </>
        )}
      </div>
      {data ? (
        <section className={panel} aria-label="Message history">
          <h3 className="text-lg font-semibold text-slate-950">Message history</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Sent means accepted by our email provider. Delivery and reading are not confirmed.
          </p>
          {!data.messages.length ? (
            <p className="py-6 text-sm text-slate-500">
              No messages sent yet. Your first update will appear here.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.messages.map((message) => {
                const count = (status: string) =>
                  message.deliveries.filter((delivery) => delivery.status === status).length;
                return (
                  <details key={message.id} className="rounded-2xl border border-slate-200 p-4">
                    <summary className="min-h-11 cursor-pointer text-sm font-bold text-slate-900">
                      <span className="break-words">{message.subject || "Untitled update"}</span>
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        {new Date(message.sentAt || message.createdAt).toLocaleString()} ·{" "}
                        {message.status === "draft"
                          ? "Draft"
                          : `${count("sent")} sent · ${count("failed")} failed · ${count("pending")} pending${count("sending") ? ` · ${count("sending")} awaiting status` : ""}${count("skipped") ? ` · ${count("skipped")} excluded` : ""}`}
                      </span>
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {message.body}
                    </p>
                    {message.status === "draft" ? (
                      <button
                        type="button"
                        disabled={busy || locked}
                        className={`${button} mt-4`}
                        onClick={() =>
                          navigation.requestLeave(() => {
                            id.current = message.id;
                            setSubject(message.subject);
                            setBody(message.body);
                            setBaseline(message);
                            setPreview(false);
                            setNotice("");
                            setError("");
                            composer.current?.focus();
                          })
                        }
                      >
                        Edit draft
                      </button>
                    ) : (
                      <>
                        <ul className="mt-4 space-y-2 text-xs text-slate-600">
                          {message.deliveries.map((delivery) => (
                            <li
                              key={delivery.email}
                              className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-2"
                            >
                              <span className="break-all">
                                {delivery.name ? `${delivery.name} · ` : ""}
                                {delivery.email}
                              </span>
                              <span>
                                {
                                  {
                                    pending: "Pending",
                                    sending: "Awaiting send status",
                                    sent: "Sent",
                                    failed: "Failed",
                                    skipped: "Excluded — no longer Yes/Maybe",
                                  }[delivery.status]
                                }
                              </span>
                            </li>
                          ))}
                        </ul>
                        {count("sending") ? (
                          <p className="mt-3 text-xs text-amber-800">
                            Refresh to check progress. If a status remains unconfirmed, check with
                            the guest before sending another message.
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {count("pending") ? (
                            <button
                              type="button"
                              disabled={busy}
                              className={button}
                              onClick={() => void continueMessage(message, false)}
                            >
                              Continue sending
                            </button>
                          ) : null}
                          {count("failed") ? (
                            <button
                              type="button"
                              disabled={busy}
                              className={button}
                              onClick={() => void continueMessage(message, true)}
                            >
                              Retry failed emails
                            </button>
                          ) : null}
                        </div>
                      </>
                    )}
                  </details>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
