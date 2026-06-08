"use client";

import { Bell, CheckCircle2, ClipboardList, HeartHandshake, WalletCards } from "lucide-react";
import { useState } from "react";
import type {
  ConciergeV2FormSummary,
  ConciergeV2PaymentItem,
  ConciergeV2ReminderItem,
  ConciergeV2VolunteerSlot,
} from "@/lib/concierge-v2/public-event";

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function formatDateTime(value: string | null | undefined) {
  const raw = clean(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(cents: number | null | undefined, currency: string | null | undefined) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: clean(currency) || "USD",
  }).format(cents / 100);
}

function messageClass(kind: "success" | "error") {
  return kind === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-800";
}

function FieldControl({
  field,
}: {
  field: NonNullable<ConciergeV2FormSummary["fields"]>[number];
}) {
  const key = field.key || field.label;
  const label = field.label || "Question";
  const type = clean(field.type).toLowerCase();
  const baseClass =
    "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100";

  if (type === "textarea" || type === "long_text") {
    return (
      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <textarea name={key} required={field.required} rows={3} className={baseClass} />
      </label>
    );
  }

  if (type === "yes_no_maybe") {
    return (
      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <select name={key} required={field.required} className={baseClass}>
          <option value="">Choose</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
          <option value="maybe">Maybe</option>
        </select>
      </label>
    );
  }

  if (type === "yes_no" || type === "boolean") {
    return (
      <label className="block">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <select name={key} required={field.required} className={baseClass}>
          <option value="">Choose</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
    );
  }

  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <input
        name={key}
        required={field.required}
        type={
          type === "number" || type === "date" || type === "email"
            ? type
            : type === "phone"
              ? "tel"
              : "text"
        }
        className={baseClass}
      />
    </label>
  );
}

export function ConciergeSmartFormsSection({
  eventId,
  forms,
}: {
  eventId: string;
  forms: ConciergeV2FormSummary[];
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, { kind: "success" | "error"; text: string }>>({});

  async function submitForm(form: ConciergeV2FormSummary, formData: FormData) {
    if (!form.id) return;
    const answers: Record<string, FormDataEntryValue> = {};
    for (const field of form.fields || []) {
      const key = field.key || field.label;
      answers[key] = formData.get(key) || "";
    }
    setPending(form.id);
    setMessages((current) => ({ ...current, [form.id as string]: { kind: "success", text: "" } }));
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/forms/${encodeURIComponent(form.id)}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestName: formData.get("guestName"),
            guestEmail: formData.get("guestEmail"),
            answers,
          }),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to send response.");
      setMessages((current) => ({
        ...current,
        [form.id as string]: { kind: "success", text: "Response sent." },
      }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [form.id as string]: {
          kind: "error",
          text: error instanceof Error ? error.message : "Unable to send response.",
        },
      }));
    } finally {
      setPending(null);
    }
  }

  if (!forms.length) return null;

  return (
    <section id="forms" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Forms</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Questions to collect</h2>
        </div>
        <ClipboardList className="hidden h-9 w-9 text-violet-700 sm:block" aria-hidden="true" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {forms.map((form) => {
          const message = form.id ? messages[form.id] : null;
          return (
            <form
              key={form.id || form.title}
              onSubmit={(event) => {
                event.preventDefault();
                void submitForm(form, new FormData(event.currentTarget));
              }}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-black text-slate-950">{form.title}</h3>
              {form.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">{form.description}</p>
              ) : null}
              <div className="mt-4 grid gap-3">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Your name
                  </span>
                  <input
                    name="guestName"
                    required
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Email
                  </span>
                  <input
                    name="guestEmail"
                    type="email"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                </label>
                {(form.fields || []).slice(0, 8).map((field) => (
                  <FieldControl key={field.key || field.label} field={field} />
                ))}
              </div>
              {message?.text ? (
                <p className={`mt-4 rounded-lg border px-3 py-2 text-sm font-bold ${messageClass(message.kind)}`}>
                  {message.text}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={!form.id || pending === form.id}
                className="mt-5 inline-flex h-11 items-center rounded-full bg-violet-700 px-5 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {pending === form.id ? "Sending..." : form.id ? "Send response" : "Response disabled"}
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}

export function ConciergeVolunteerSignupSection({
  eventId,
  slots,
}: {
  eventId: string;
  slots: ConciergeV2VolunteerSlot[];
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, { kind: "success" | "error"; text: string }>>({});

  async function claimSlot(slot: ConciergeV2VolunteerSlot, formData: FormData) {
    if (!slot.id) return;
    setPending(slot.id);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/volunteer-slots/${encodeURIComponent(slot.id)}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestName: formData.get("guestName"),
            guestEmail: formData.get("guestEmail"),
            quantity: formData.get("quantity") || 1,
            notes: formData.get("notes"),
          }),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to claim this slot.");
      setMessages((current) => ({
        ...current,
        [slot.id as string]: { kind: "success", text: "Slot claimed." },
      }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [slot.id as string]: {
          kind: "error",
          text: error instanceof Error ? error.message : "Unable to claim this slot.",
        },
      }));
    } finally {
      setPending(null);
    }
  }

  if (!slots.length) return null;

  return (
    <section id="volunteer-signup" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Signup</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Volunteer slots</h2>
          </div>
          <HeartHandshake className="hidden h-9 w-9 text-violet-700 sm:block" aria-hidden="true" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => {
            const message = slot.id ? messages[slot.id] : null;
            const remaining = Math.max(
              0,
              Number(slot.quantityNeeded || 1) - Number(slot.claimedQuantity || 0),
            );
            return (
              <form
                key={slot.id || `${slot.group || "slot"}-${slot.title}`}
                onSubmit={(event) => {
                  event.preventDefault();
                  void claimSlot(slot, new FormData(event.currentTarget));
                }}
                className="rounded-lg border border-violet-100 bg-violet-50/60 p-5"
              >
                <p className="text-sm font-black text-slate-950">{slot.title}</p>
                <p className="mt-2 text-sm font-semibold text-violet-700">
                  {remaining > 0 ? `${remaining} open` : "Full"}
                  {slot.group ? ` - ${slot.group}` : ""}
                </p>
                {slot.description ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">{slot.description}</p>
                ) : null}
                <div className="mt-4 grid gap-2">
                  <input
                    name="guestName"
                    required
                    placeholder="Your name"
                    className="h-10 rounded-lg border border-violet-100 bg-white px-3 text-sm font-semibold outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                  <input
                    name="guestEmail"
                    type="email"
                    placeholder="Email"
                    className="h-10 rounded-lg border border-violet-100 bg-white px-3 text-sm font-semibold outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                  <input
                    name="notes"
                    placeholder="Note"
                    className="h-10 rounded-lg border border-violet-100 bg-white px-3 text-sm font-semibold outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                  <input name="quantity" type="hidden" value="1" />
                </div>
                {message?.text ? (
                  <p className={`mt-4 rounded-lg border px-3 py-2 text-sm font-bold ${messageClass(message.kind)}`}>
                    {message.text}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={!slot.id || pending === slot.id || remaining <= 0}
                  className="mt-4 inline-flex h-10 items-center rounded-full bg-violet-700 px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {pending === slot.id ? "Claiming..." : remaining > 0 ? "Claim this" : "Full"}
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ConciergePaymentTrackerSection({ items }: { items: ConciergeV2PaymentItem[] }) {
  if (!items.length) return null;
  return (
    <section id="payments" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Payments</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Manual payment tracker</h2>
        </div>
        <WalletCards className="hidden h-9 w-9 text-violet-700 sm:block" aria-hidden="true" />
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <div key={item.id || item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                {item.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                ) : null}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-950">
                {formatMoney(item.amountCents, item.currency) || clean(item.status) || "Track"}
              </span>
            </div>
            {item.dueAt ? (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Due {formatDateTime(item.dueAt)}
              </p>
            ) : null}
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Tracked manually by the organizer
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ConciergeReminderTimelineSection({ reminders }: { reminders: ConciergeV2ReminderItem[] }) {
  if (!reminders.length) return null;
  return (
    <section id="reminders" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">
            Reminders
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Message timeline</h2>
        </div>
        <Bell className="hidden h-9 w-9 text-violet-700 sm:block" aria-hidden="true" />
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {reminders.map((item) => (
          <div key={item.id || `${item.reminderType || "reminder"}-${item.title}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-black text-slate-950">{item.title}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                {clean(item.channel) || "email"}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {formatDateTime(item.scheduledFor) || clean(item.status) || "Draft"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ConciergeChecklistSection({
  items,
}: {
  items: Array<{ id?: string; title: string; category?: string | null; status?: string | null }>;
}) {
  if (!items.length) return null;
  return (
    <section id="checklist" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">
              Checklist
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Prep list</h2>
          </div>
          <CheckCircle2 className="hidden h-9 w-9 text-violet-700 sm:block" aria-hidden="true" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id || `${item.category || "item"}-${item.title}`} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-black text-slate-950">{item.title}</p>
                {item.category || item.status ? (
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    {[clean(item.category), clean(item.status)].filter(Boolean).join(" - ")}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
