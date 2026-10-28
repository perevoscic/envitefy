"use client";

import {
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Search,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import EventMessagesPanel from "@/components/EventMessagesPanel";
import OwnerRsvpEditor from "@/components/OwnerRsvpEditor";
import styles from "./EventResponseDashboard.module.css";

type RsvpStats = {
  yes: number;
  no: number;
  maybe: number;
  filled: number;
  remaining: number;
  numberOfGuests: number;
};

type RsvpResponse = {
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email: string | null;
  message?: string | null;
  response: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type EventResponseDashboardTab = "dashboard" | "rsvps" | "messages";

type EventResponseDashboardProps = {
  activeTab?: EventResponseDashboardTab;
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown> | null;
  numberOfGuests: number;
  rsvpEnabled: boolean;
  editHref: string;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeResponse(value: unknown): "yes" | "maybe" | "no" {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "no") return "no";
  if (normalized === "maybe") return "maybe";
  return "yes";
}

function displayName(row: RsvpResponse): string {
  const fullName = [row.firstName, row.lastName]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
  return fullName || row.name?.trim() || row.email?.trim() || "Guest";
}

function responseKey(row: RsvpResponse, index: number): string {
  return `${row.email || row.phone || displayName(row)}-${row.updatedAt || row.createdAt || index}`;
}

function responseMessage(row: RsvpResponse): string {
  return readString(row.message);
}

function displayUpdatedAt(value: string | null): string {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function statusMeta(value: unknown) {
  const normalized = normalizeResponse(value);
  if (normalized === "yes") {
    return {
      label: "Going",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  if (normalized === "no") {
    return {
      label: "Declined",
      icon: XCircle,
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  return {
    label: "Maybe",
    icon: Clock3,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  };
}

export default function EventResponseDashboard({
  activeTab = "dashboard",
  eventId,
  eventTitle,
  eventData,
  numberOfGuests,
}: EventResponseDashboardProps) {
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [responses, setResponses] = useState<RsvpResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshRsvpData = useCallback(async () => {
    if (!eventId) return;
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "RSVP data is unavailable.");
        return;
      }
      setStats({
        yes: Number(data.stats?.yes || 0),
        no: Number(data.stats?.no || 0),
        maybe: Number(data.stats?.maybe || 0),
        filled: Number(data.filled || 0),
        remaining: Number(data.remaining ?? data.numberOfGuests ?? numberOfGuests),
        numberOfGuests: Number(data.numberOfGuests || numberOfGuests || 0),
      });
      setResponses(Array.isArray(data.responses) ? data.responses : []);
    } catch {
      setError("RSVP data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [eventId, numberOfGuests]);

  useEffect(() => {
    if (!eventId) return;
    void refreshRsvpData();
    const interval = window.setInterval(refreshRsvpData, 5 * 60 * 1000);
    const handleRsvpSubmit = () => {
      window.setTimeout(() => void refreshRsvpData(), 500);
    };
    window.addEventListener("rsvp-submitted", handleRsvpSubmit);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("rsvp-submitted", handleRsvpSubmit);
    };
  }, [eventId, refreshRsvpData]);

  const displayStats: RsvpStats = stats || {
    yes: 0,
    no: 0,
    maybe: 0,
    filled: 0,
    remaining: numberOfGuests,
    numberOfGuests,
  };
  const hasResponses = responses.length > 0;
  const responseTarget = displayStats.numberOfGuests || numberOfGuests;
  const responseRate =
    responseTarget > 0
      ? Math.min(100, Math.round((displayStats.filled / responseTarget) * 100))
      : hasResponses
        ? 100
        : 0;
  const recentResponses = responses.slice(0, 3);
  const shellClass = styles.dashboard;



  return (
    <section className={shellClass} aria-label={`Event dashboard for ${eventTitle || "event"}`}>
      <div className="space-y-4 p-0">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {activeTab === "dashboard" ? (
          <>
            <div className={styles.dashboardDetails}>
              <RecentResponsesCard
                responses={recentResponses}
                loading={loading}
              />
              <GuestBreakdownCard stats={displayStats} responseRate={responseRate} loading={loading} />
            </div>
          </>
        ) : null}

        {activeTab === "rsvps" ? (
          <>
            <section className={styles.metrics} aria-label="Response summary">
              <MetricCard label="Responses" value={loading ? "--" : displayStats.filled} />
              <MetricCard label="Going" value={loading ? "--" : displayStats.yes} tone="emerald" />
              <MetricCard label="Maybe" value={loading ? "--" : displayStats.maybe} tone="amber" />
              <MetricCard label={displayStats.numberOfGuests > 0 ? "Pending" : "Not attending"} value={loading ? "--" : displayStats.numberOfGuests > 0 ? displayStats.remaining : displayStats.no} />
            </section>
            <RsvpResponsesPanel
              key={eventId}
              eventId={eventId}
              eventData={eventData}
              responses={responses}
              loading={loading}
            />
          </>
        ) : null}

        {activeTab === "messages" ? (
          <EventMessagesPanel key={eventId} eventId={eventId} eventTitle={eventTitle} />
        ) : null}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  tone?: "slate" | "emerald" | "amber";
}) {
  return (
    <article className={styles.metric} data-tone={tone === "emerald" ? "going" : tone === "amber" ? "maybe" : "neutral"}>
      <p><span aria-hidden="true" />{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function ContactCell({ row }: { row: RsvpResponse }) {
  const email = readString(row.email);
  const phone = readString(row.phone);
  if (!email && !phone) return <span className="text-slate-400">-</span>;

  return (
    <div className="space-y-1.5">
      {email ? (
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <Mail size={13} aria-hidden="true" />
          <span className="truncate">{email}</span>
        </span>
      ) : null}
      {phone ? (
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <Phone size={13} aria-hidden="true" />
          <span className="truncate">{phone}</span>
        </span>
      ) : null}
    </div>
  );
}

function RsvpResponsesPanel({
  eventId,
  eventData,
  responses,
  loading,
}: {
  eventId: string;
  eventData: Record<string, unknown> | null;
  responses: RsvpResponse[];
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const query = search.trim().toLocaleLowerCase();
  const filtered = responses.filter((row) =>
    (statusFilter === "all" || normalizeResponse(row.response) === statusFilter) &&
    (!query || [displayName(row), row.email, row.phone, responseMessage(row)]
      .some((value) => value?.toLocaleLowerCase().includes(query))),
  );
  return (
    <section className={styles.rsvps} aria-label="RSVP responses">
      <section className={styles.guestPanel} aria-label="Guest responses">
        <div className={styles.panelHeader}>
          <OwnerRsvpEditor key={eventId} eventId={eventId} eventData={eventData} />
        </div>
        {responses.length > 0 ? (
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search guests</span>
              <input type="search" placeholder="Search guests…" value={search}
                onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label>
              <span className="sr-only">Filter RSVP status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="yes">Going</option>
                <option value="maybe">Maybe</option>
                <option value="no">Not attending</option>
              </select>
            </label>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.loading} role="status" aria-label="Loading guest responses">
            {[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />)}
          </div>
        ) : filtered.length ? (
          <>
            <div className={styles.desktopTable}>
              <table>
                <caption className="sr-only">Guest responses</caption>
                <thead><tr>
                  <th scope="col">Guest</th><th scope="col">Contact</th>
                  <th scope="col">RSVP</th><th scope="col">Message</th><th scope="col">Updated</th>
                </tr></thead>
                <tbody>
                  {filtered.map((row, index) => (
                    <tr key={responseKey(row, index)}>
                      <th scope="row">{displayName(row)}</th>
                      <td><ContactCell row={row} /></td>
                      <td><ResponseStatus response={row.response} /></td>
                      <td className={styles.message}>{responseMessage(row) || "—"}</td>
                      <td className={styles.updated}>{displayUpdatedAt(row.updatedAt || row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.mobileGuests}>
              {filtered.map((row, index) => (
                <article key={responseKey(row, index)} className={styles.guest}>
                  <div className={styles.guestHeading}>
                    <h4>{displayName(row)}</h4>
                    <ResponseStatus response={row.response} />
                  </div>
                  <ContactCell row={row} />
                  {responseMessage(row) ? <p className={styles.message}>{responseMessage(row)}</p> : null}
                  <p className={styles.updated}>Updated {displayUpdatedAt(row.updatedAt || row.createdAt)}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.empty} role="status">
            <div className={styles.emptyIcon}><Mail size={27} strokeWidth={1.4} aria-hidden="true" /></div>
            <h4>{responses.length ? "No guests match this view" : "Awaiting your first RSVP"}</h4>
            <p>{responses.length ? "Try another status or search term." : "Guest responses will appear here after you share your invitation."}</p>
            {responses.length ? <button type="button" className={styles.clearFilters} onClick={() => { setSearch(""); setStatusFilter("all"); }}>Clear filters</button> : null}
          </div>
        )}
      </section>
    </section>
  );
}

function ResponseStatus({ response }: { response: string }) {
  const status = statusMeta(response);
  const Icon = status.icon;
  return <span className={`${styles.status} ${status.className}`}>
    <Icon size={13} aria-hidden="true" />{status.label}
  </span>;
}

function GuestBreakdownCard({ stats, responseRate, loading }: {
  stats: RsvpStats;
  responseRate: number;
  loading: boolean;
}) {
  const hasTarget = stats.numberOfGuests > 0;
  const pending = hasTarget ? stats.remaining : 0;
  const total = Math.max(1, stats.yes + stats.maybe + stats.no + pending);
  const yesStop = stats.yes / total * 100;
  const maybeStop = yesStop + stats.maybe / total * 100;
  const noStop = maybeStop + stats.no / total * 100;
  const rows = [
    { label: "Going", value: stats.yes, color: "var(--rsvp-accent)" },
    { label: "Maybe", value: stats.maybe, color: "#f2c76a" },
    { label: "Declined", value: stats.no, color: "#df6f7c" },
    ...(hasTarget ? [{ label: "Pending", value: pending, color: "var(--rsvp-line)" }] : []),
  ];
  const chartStyle = {
    background: `conic-gradient(var(--rsvp-accent) 0 ${yesStop}%, #f2c76a ${yesStop}% ${maybeStop}%, #df6f7c ${maybeStop}% ${noStop}%, var(--rsvp-line) ${noStop}% 100%)`,
  };
  return (
    <section className={styles.detailPanel} aria-label="RSVP breakdown">
      <p className={styles.overviewLabel}>Guest breakdown</p>
      <h4>{loading ? "Loading responses" : stats.filled ? hasTarget ? `${responseRate}% complete` : `${stats.filled} responses` : "No responses yet"}</h4>
      <div className={styles.breakdown}>
        <div className={styles.chart} style={chartStyle} role="img"
          aria-label={loading ? "Loading RSVP breakdown" : rows.map(row => `${row.label}: ${row.value}`).join(", ")}>
          <div className={styles.chartCenter}>
            <strong>{loading ? "—" : stats.filled}</strong>
            <span>replies</span>
          </div>
        </div>
        <dl className={styles.legend}>
          {rows.map(row => <div key={row.label}>
            <dt><span style={{ background: row.color }} />{row.label}</dt>
            <dd>{loading ? "—" : row.value}</dd>
          </div>)}
        </dl>
      </div>
    </section>
  );
}

function RecentResponsesCard({
  responses,
  loading,
}: {
  responses: RsvpResponse[];
  loading: boolean;
}) {
  return (
    <article
      className={styles.detailPanel}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Recent activity</h4>
        <span
          className={styles.liveLabel}
        >
          Live
        </span>
      </div>

      <div className="mt-5 space-y-1">
        {loading ? (
          [0, 1, 2].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />
          ))
        ) : responses.length > 0 ? (
          responses.map((row, index) => {
            const status = statusMeta(row.response);
            return (
              <div
                key={`${displayName(row)}-${row.updatedAt || row.createdAt || index}`}
                className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {displayName(row)}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {displayUpdatedAt(row.updatedAt || row.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.68rem] font-black ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
            );
          })
        ) : (
          <div className={styles.activityEmpty}>
            Responses will appear here as guests reply.
          </div>
        )}
      </div>
    </article>
  );
}
