"use client";

import {
  CalendarDays,
  Clipboard,
  Download,
  ExternalLink,
  FileSearch,
  LinkIcon,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type CalendarRecord = Record<string, any>;

function clean(value: any): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(value: any) {
  const raw = clean(value);
  if (!raw) return "Time to confirm";
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

function StatusPill({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-violet-700">
      {children}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-violet-700" aria-hidden="true" />
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

export default function ConciergeV2CalendarCenterClient({
  eventId,
  initialCalendar,
}: {
  eventId: string;
  initialCalendar: CalendarRecord;
}) {
  const [calendar, setCalendar] = useState(initialCalendar);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const feed = calendar.feed || {};
  const counts = calendar.counts || {};
  const preview = list(calendar.preview);

  async function reloadCalendar() {
    setError(null);
    const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/calendar`);
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || "Unable to refresh calendar feed.");
    setCalendar(json.calendar);
  }

  async function regenerateFeed() {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/calendar`, {
        method: "POST",
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to regenerate calendar feed.");
      setCalendar((current) => ({
        ...current,
        feed: json.calendar.feed,
        counts: json.calendar.counts,
        preview: json.calendar.preview,
      }));
      setNotice("Calendar feed link regenerated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to regenerate calendar feed.");
    } finally {
      setPending(false);
    }
  }

  async function copyFeedUrl() {
    setError(null);
    setNotice(null);
    try {
      await navigator.clipboard.writeText(clean(feed.feedUrl));
      setNotice("Calendar feed link copied.");
    } catch {
      setError("Copy failed. Select the feed link and copy it manually.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Calendar Center</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {clean(calendar.event?.title) || "Event calendar"}
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-500">Shareable schedule feed for families and guests.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/event/${encodeURIComponent(eventId)}`}
              className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              Guest page
            </Link>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/hub`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Hub
            </Link>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/imports`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              Imports
            </Link>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/resources`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <Warehouse className="h-4 w-4" aria-hidden="true" />
              Resources
            </Link>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/schedule`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Schedule
            </Link>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/ops`}
              className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              Ops
            </Link>
            <button
              type="button"
              onClick={() => {
                void reloadCalendar().catch((err) =>
                  setError(err instanceof Error ? err.message : "Unable to refresh calendar feed."),
                );
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-700 px-4 text-sm font-black text-white transition hover:bg-violet-800"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </div>
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
          <SummaryCard icon={CalendarDays} label="Active calendar items" value={Number(counts.active || 0)} />
          <SummaryCard icon={RefreshCw} label="Upcoming" value={Number(counts.upcoming || 0)} />
          <SummaryCard icon={ShieldCheck} label="Canceled hidden" value={Number(counts.canceled || 0)} />
          <SummaryCard icon={LinkIcon} label="Feed links" value={clean(feed.feedUrl) ? 1 : 0} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Subscription feed</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{clean(feed.name) || "Envitefy Schedule"}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Anyone with this link can subscribe to the schedule. Regenerate it if the link was shared too widely.
                </p>
              </div>
              <StatusPill>{feed.isActive === false ? "inactive" : "active"}</StatusPill>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Feed URL</p>
              <p className="mt-2 break-all text-sm font-semibold leading-6 text-slate-700">
                {clean(feed.feedUrl) || "No feed link available"}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyFeedUrl()}
                disabled={!clean(feed.feedUrl)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-violet-700 px-4 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Clipboard className="h-4 w-4" aria-hidden="true" />
                Copy link
              </button>
              <Link
                href={clean(feed.downloadUrl) || "#"}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download ICS
              </Link>
              <Link
                href={clean(feed.googleSubscribeUrl) || "#"}
                target="_blank"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Google
              </Link>
              <button
                type="button"
                onClick={() => void regenerateFeed()}
                disabled={pending}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-rose-200 bg-white px-4 text-sm font-black text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Regenerate
              </button>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Feed safety</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">Private by link</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              The feed is not indexed and does not require guest login. It should be shared only with the people who need the schedule.
            </p>
            <div className="mt-5 rounded-lg bg-violet-50 p-4">
              <p className="text-sm font-black text-violet-950">Included</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-violet-900">
                Active schedule items with title, start/end time, location, and notes.
              </p>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Hidden</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                Canceled items, RSVP answers, form responses, payment records, and private operations data.
              </p>
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Preview</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">Calendar items</h2>
            </div>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/schedule`}
              className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              Edit schedule
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {preview.length ? (
              preview.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        {clean(item.type) || "event"}
                      </p>
                      <h3 className="mt-2 text-lg font-black text-slate-950">{clean(item.title) || "Schedule item"}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {formatDateTime(item.startAt)}
                        {clean(item.locationText) ? ` at ${clean(item.locationText)}` : ""}
                      </p>
                    </div>
                    <StatusPill>{clean(item.status) || "scheduled"}</StatusPill>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-violet-700" aria-hidden="true" />
                <p className="mt-3 text-lg font-black text-slate-950">No calendar items yet.</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Add schedule items before sharing the feed.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
