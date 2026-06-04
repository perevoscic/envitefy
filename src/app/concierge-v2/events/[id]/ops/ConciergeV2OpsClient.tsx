"use client";

import {
  Bell,
  CalendarDays,
  ClipboardList,
  Eye,
  HeartHandshake,
  LinkIcon,
  RefreshCw,
  Send,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

type SummaryRecord = Record<string, any>;

function clean(value: any): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function formatMoney(cents: any, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: clean(currency) || "USD",
  }).format((Number(cents) || 0) / 100);
}

function formatDateTime(value: any) {
  const raw = clean(value);
  if (!raw) return "Not scheduled";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-violet-700">
      {children}
    </span>
  );
}

export default function ConciergeV2OpsClient({
  eventId,
  initialSummary,
}: {
  eventId: string;
  initialSummary: SummaryRecord;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [reminderQueue, setReminderQueue] = useState<SummaryRecord | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [pendingReminderId, setPendingReminderId] = useState<string | null>(null);
  const [previewByReminder, setPreviewByReminder] = useState<Record<string, SummaryRecord>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const forms = list(summary.forms);
  const volunteerSlots = list(summary.volunteerSlots);
  const paymentRequests = list(summary.paymentRequests);
  const reminders = list(summary.reminders);
  const reminderItems = reminderQueue ? list(reminderQueue.reminders) : reminders;

  async function reloadSummary() {
    setError(null);
    const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/operations`);
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || "Unable to refresh operations.");
    setSummary(json.summary);
  }

  async function reloadReminderQueue() {
    setError(null);
    const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/reminders`);
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || "Unable to refresh reminders.");
    setReminderQueue(json.queue);
  }

  async function reloadAll() {
    await Promise.all([reloadSummary(), reloadReminderQueue()]);
  }

  async function updatePayment(paymentId: string, status: string) {
    setPendingPaymentId(paymentId);
    setError(null);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/payment-requests/${encodeURIComponent(paymentId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, manualMethod: "manual" }),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to update payment.");
      await reloadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update payment.");
    } finally {
      setPendingPaymentId(null);
    }
  }

  async function previewReminder(reminderId: string) {
    setPendingReminderId(reminderId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/reminders/${encodeURIComponent(reminderId)}/preview`,
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to preview reminder.");
      setPreviewByReminder((current) => ({ ...current, [reminderId]: json.preview }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to preview reminder.");
    } finally {
      setPendingReminderId(null);
    }
  }

  async function dryRunReminder(reminderId: string) {
    setPendingReminderId(reminderId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/reminders/${encodeURIComponent(reminderId)}/dry-run`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to dry-run reminder.");
      setPreviewByReminder((current) => ({ ...current, [reminderId]: json.dryRun.preview }));
      setNotice(`Dry run recorded for ${Number(json.dryRun.deliveryCount || 0)} recipient record(s).`);
      await reloadReminderQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to dry-run reminder.");
    } finally {
      setPendingReminderId(null);
    }
  }

  async function updateReminderStatus(reminderId: string, status: string) {
    setPendingReminderId(reminderId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/reminders/${encodeURIComponent(reminderId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to update reminder.");
      setNotice(`Reminder ${clean(json.reminder?.status) || status}.`);
      await reloadReminderQueue();
      await reloadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update reminder.");
    } finally {
      setPendingReminderId(null);
    }
  }

  useEffect(() => {
    void reloadReminderQueue().catch((err) =>
      setError(err instanceof Error ? err.message : "Unable to load reminders."),
    );
  }, [eventId]);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">
              Concierge operations
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {clean(summary.event?.title) || "Event operations"}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              void reloadAll().catch((err) =>
                setError(err instanceof Error ? err.message : "Unable to refresh operations."),
              );
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          <Link
            href={`/concierge-v2/events/${encodeURIComponent(eventId)}/rsvp`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            RSVP
          </Link>
          <Link
            href={`/concierge-v2/events/${encodeURIComponent(eventId)}/calendar`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <LinkIcon className="h-4 w-4" aria-hidden="true" />
            Calendar
          </Link>
          <Link
            href={`/concierge-v2/events/${encodeURIComponent(eventId)}/schedule`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Schedule
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {notice}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <ClipboardList className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <p className="mt-4 text-3xl font-black">{forms.reduce((sum, form) => sum + Number(form.responseCount || 0), 0)}</p>
            <p className="text-sm font-bold text-slate-500">Form responses</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <HeartHandshake className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <p className="mt-4 text-3xl font-black">
              {volunteerSlots.reduce((sum, slot) => sum + Number(slot.claimedQuantity || 0), 0)}
            </p>
            <p className="text-sm font-bold text-slate-500">Signup claims</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <WalletCards className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <p className="mt-4 text-3xl font-black">{paymentRequests.length}</p>
            <p className="text-sm font-bold text-slate-500">Payment items</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Bell className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <p className="mt-4 text-3xl font-black">{reminderItems.length}</p>
            <p className="text-sm font-bold text-slate-500">Reminder queue</p>
          </div>
        </section>

        <section id="reminders" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Form responses</h2>
          <div className="mt-5 grid gap-4">
            {forms.length ? forms.map((form) => (
              <div key={form.id} className="rounded-lg bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-black">{form.title}</h3>
                  <StatusPill>{`${Number(form.responseCount || 0)} responses`}</StatusPill>
                </div>
                <div className="mt-3 grid gap-2">
                  {list(form.responses).length ? list(form.responses).map((response) => (
                    <div key={response.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                      <p className="font-black">{clean(response.guestName) || "Guest"}</p>
                      {clean(response.guestEmail) ? (
                        <p className="text-slate-500">{response.guestEmail}</p>
                      ) : null}
                      <p className="mt-2 text-slate-600">
                        {Object.entries(response.answers || {})
                          .map(([key, value]) => `${key}: ${String(value || "")}`)
                          .join(" | ")}
                      </p>
                    </div>
                  )) : (
                    <p className="text-sm font-semibold text-slate-500">No responses yet.</p>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-sm font-semibold text-slate-500">No forms are attached to this page.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Volunteer slots</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {volunteerSlots.length ? volunteerSlots.map((slot) => (
              <div key={slot.id} className="rounded-lg bg-violet-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-black">{slot.title}</h3>
                  <StatusPill>{`${Number(slot.claimedQuantity || 0)} / ${Number(slot.quantityNeeded || 1)}`}</StatusPill>
                </div>
                <div className="mt-3 grid gap-2">
                  {list(slot.claims).length ? list(slot.claims).map((claim) => (
                    <div key={claim.id} className="rounded-lg bg-white p-3 text-sm">
                      <p className="font-black">{clean(claim.guestName) || "Guest"}</p>
                      <p className="text-slate-500">{clean(claim.guestEmail) || "No email"}</p>
                      {clean(claim.notes) ? <p className="mt-1 text-slate-600">{claim.notes}</p> : null}
                    </div>
                  )) : (
                    <p className="text-sm font-semibold text-slate-500">No claims yet.</p>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-sm font-semibold text-slate-500">No volunteer slots are attached to this page.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Manual payments</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {paymentRequests.length ? paymentRequests.map((payment) => (
              <div key={payment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{payment.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatMoney(payment.amountCents, payment.currency)}
                    </p>
                  </div>
                  <StatusPill>{clean(payment.status) || "unpaid"}</StatusPill>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["paid", "pending", "unpaid", "waived"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={pendingPaymentId === payment.id}
                      onClick={() => void updatePayment(payment.id, status)}
                      className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )) : (
              <p className="text-sm font-semibold text-slate-500">No payment requests are attached to this page.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">Reminder queue</h2>
              {reminderQueue?.audience ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {Number(reminderQueue.audience.recipientCount || 0)} reachable guest contacts
                  {Number(reminderQueue.audience.missingContactCount || 0)
                    ? `, ${Number(reminderQueue.audience.missingContactCount || 0)} missing contact`
                    : ""}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                void reloadReminderQueue().catch((err) =>
                  setError(err instanceof Error ? err.message : "Unable to refresh reminders."),
                );
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Queue
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            {reminderItems.length ? reminderItems.map((reminder) => {
              const preview = previewByReminder[reminder.id] || reminder.preview;
              const restoreStatus = reminder.scheduledFor ? "scheduled" : "draft";
              return (
                <div key={reminder.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{clean(reminder.title) || "Reminder"}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {formatDateTime(reminder.scheduledFor)} - {clean(reminder.channel) || "email"}
                      </p>
                    </div>
                    <StatusPill>{clean(reminder.status) || "draft"}</StatusPill>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pendingReminderId === reminder.id}
                      onClick={() => void previewReminder(reminder.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Preview
                    </button>
                    <button
                      type="button"
                      disabled={pendingReminderId === reminder.id || clean(reminder.status) === "canceled"}
                      onClick={() => void dryRunReminder(reminder.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      Dry run
                    </button>
                    <button
                      type="button"
                      disabled={pendingReminderId === reminder.id}
                      onClick={() =>
                        void updateReminderStatus(
                          reminder.id,
                          clean(reminder.status) === "canceled" ? restoreStatus : "canceled",
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      {clean(reminder.status) === "canceled" ? "Restore" : "Cancel"}
                    </button>
                  </div>
                  {preview ? (
                    <div className="mt-4 rounded-lg border border-violet-100 bg-white p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black text-slate-950">{clean(preview.subject) || "Reminder preview"}</p>
                        <span className="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-violet-700">
                          {clean(preview.providerStatus) || "stub"}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-line leading-6 text-slate-600">{clean(preview.body)}</p>
                      <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        {clean(preview.audienceLabel) || "0 reachable guests"}
                      </p>
                    </div>
                  ) : null}
                  {list(reminder.deliveries).length ? (
                    <div className="mt-3 grid gap-2">
                      {list(reminder.deliveries).slice(0, 3).map((delivery) => (
                        <p key={delivery.id} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-500">
                          {clean(delivery.status)} - {formatDateTime(delivery.createdAt)}
                          {clean(delivery.toAddress) ? ` - ${delivery.toAddress}` : ""}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }) : (
              <p className="text-sm font-semibold text-slate-500">No reminders are attached to this page.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
