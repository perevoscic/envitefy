"use client";

import { CheckCircle2, ClipboardList, HeartHandshake, RefreshCw, WalletCards } from "lucide-react";
import { useState } from "react";

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
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const forms = list(summary.forms);
  const volunteerSlots = list(summary.volunteerSlots);
  const paymentRequests = list(summary.paymentRequests);
  const reminders = list(summary.reminders);

  async function reloadSummary() {
    setError(null);
    const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/operations`);
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || "Unable to refresh operations.");
    setSummary(json.summary);
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
              void reloadSummary().catch((err) =>
                setError(err instanceof Error ? err.message : "Unable to refresh operations."),
              );
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
            {error}
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
            <CheckCircle2 className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <p className="mt-4 text-3xl font-black">{reminders.length}</p>
            <p className="text-sm font-bold text-slate-500">Draft reminders</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
      </div>
    </main>
  );
}
