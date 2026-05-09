"use client";

import {
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

type DashboardVariant = "generic" | "weddings";
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

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return "";
}

function normalizeCategory(value: unknown): string {
  return readString(value).toLowerCase().replace(/[_-]+/g, " ");
}

function resolveDashboardVariant(eventData: Record<string, unknown> | null): DashboardVariant {
  const category = normalizeCategory(firstString(eventData?.category, eventData?.eventType));
  const templateId = normalizeCategory(eventData?.templateId);
  if (category === "weddings" || category === "wedding" || templateId === "wedding") {
    return "weddings";
  }
  return "generic";
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

function responseContact(row: RsvpResponse): string {
  return firstString(row.email, row.phone);
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
  rsvpEnabled,
  editHref,
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

  const variant = resolveDashboardVariant(eventData);

  const displayStats: RsvpStats = stats || {
    yes: 0,
    no: 0,
    maybe: 0,
    filled: 0,
    remaining: numberOfGuests,
    numberOfGuests,
  };
  const hasResponses = responses.length > 0;
  const responseTarget = displayStats.numberOfGuests || numberOfGuests || displayStats.filled;
  const responseRate =
    responseTarget > 0
      ? Math.min(100, Math.round((displayStats.filled / responseTarget) * 100))
      : hasResponses
        ? 100
        : 0;
  const recentResponses = responses.slice(0, 3);
  const messageResponses = responses.filter((row) => responseMessage(row));
  const hasRsvpSurface = Boolean(rsvpEnabled || responseTarget > 0 || hasResponses);
  const isWedding = variant === "weddings";
  const responseSummary = loading
    ? "Checking guest response activity."
    : hasResponses
      ? `${displayStats.filled} ${displayStats.filled === 1 ? "guest has" : "guests have"} responded${
          responseTarget ? ` out of ${responseTarget}` : ""
        }.`
      : "No guest replies yet. Share the event when the page is ready.";
  const statusLabel = loading
    ? "Updating"
    : hasResponses
      ? responseRate >= 70
        ? "Healthy response pace"
        : "Collecting responses"
      : "Ready for first guests";

  const shellClass = "relative bg-transparent";
  const eyebrowClass = isWedding ? "text-[#9d7d51]" : "text-[#786bd6]";

  if (!hasRsvpSurface && !loading) {
    return (
      <section className="owner-workspace-glass relative overflow-hidden rounded-[28px] border border-dashed border-slate-300 bg-white/82 p-6 text-center shadow-[0_20px_58px_rgba(79,70,128,0.10)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Users size={22} />
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-slate-950">No RSVP collection yet</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          RSVP collection has not been configured for this event.
        </p>
        <Link
          href={editHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <Pencil size={15} />
          Add RSVP
        </Link>
      </section>
    );
  }

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
            <section className="owner-workspace-glass-panel relative overflow-hidden rounded-[24px] border border-black/5 bg-white/82 p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="min-w-0">
                  <p
                    className={`text-[0.66rem] font-black uppercase tracking-[0.18em] ${eyebrowClass}`}
                  >
                    Response overview
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                    {loading
                      ? "Loading RSVP status"
                      : hasResponses
                        ? `${responseRate}% complete`
                        : "No responses yet"}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    {responseSummary}
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-[width] ${
                      isWedding ? "bg-[#596046]" : "bg-[#6c60db]"
                    }`}
                    style={{ width: `${loading ? 0 : responseRate}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  {statusLabel}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <MetricCard label="Responses" value={loading ? "--" : displayStats.filled} />
              <MetricCard label="Going" value={loading ? "--" : displayStats.yes} tone="emerald" />
              <MetricCard label="Maybe" value={loading ? "--" : displayStats.maybe} tone="amber" />
              <MetricCard label="Pending" value={loading ? "--" : displayStats.remaining} />
            </section>

            <div className="grid gap-4 2xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.35fr)]">
              <RecentResponsesCard
                responses={recentResponses}
                loading={loading}
                isWedding={isWedding}
              />
              <GuestBreakdownCard
                stats={displayStats}
                responseRate={responseRate}
                loading={loading}
                isWedding={isWedding}
              />
            </div>
          </>
        ) : null}

        {activeTab === "rsvps" ? (
          <RsvpResponsesPanel
            responses={responses}
            stats={displayStats}
            responseRate={responseRate}
            loading={loading}
            editHref={editHref}
          />
        ) : null}

        {activeTab === "messages" ? (
          <RsvpMessagesPanel
            responses={messageResponses}
            allResponseCount={responses.length}
            loading={loading}
          />
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
  const toneClass =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
      : tone === "amber"
        ? "border-amber-100 bg-amber-50 text-amber-800"
        : "border-black/5 bg-white/78 text-slate-950";

  return (
    <article
      className={`owner-workspace-glass-panel relative overflow-hidden rounded-[20px] border p-3.5 shadow-sm sm:rounded-[22px] sm:p-4 ${toneClass}`}
    >
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] opacity-60">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">{value}</p>
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
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-600">
          <Mail size={13} aria-hidden="true" />
          <span className="truncate">{email}</span>
        </span>
      ) : null}
      {phone ? (
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-600">
          <Phone size={13} aria-hidden="true" />
          <span className="truncate">{phone}</span>
        </span>
      ) : null}
    </div>
  );
}

function RsvpResponsesPanel({
  responses,
  stats,
  responseRate,
  loading,
  editHref,
}: {
  responses: RsvpResponse[];
  stats: RsvpStats;
  responseRate: number;
  loading: boolean;
  editHref: string;
}) {
  return (
    <section className="space-y-4" aria-label="RSVP responses">
      <div className="owner-workspace-glass-panel relative overflow-hidden rounded-[24px] border border-black/5 bg-white/82 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-[#786bd6]">
              RSVPs
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
              {loading ? "Loading guest list" : `${stats.filled} responses`}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review every guest response, contact detail, and RSVP note in one place.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm sm:text-right">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-400">
              Complete
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {loading ? "--" : `${responseRate}%`}
            </p>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Total" value={loading ? "--" : stats.numberOfGuests || stats.filled} />
        <MetricCard label="Going" value={loading ? "--" : stats.yes} tone="emerald" />
        <MetricCard label="Maybe" value={loading ? "--" : stats.maybe} tone="amber" />
        <MetricCard label="Pending" value={loading ? "--" : stats.remaining} />
      </section>

      <section className="owner-workspace-glass-panel relative overflow-hidden rounded-[28px] border border-black/5 bg-white/86 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h4 className="text-lg font-semibold text-slate-950">Guest responses</h4>
          <Link
            href={editHref}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Pencil size={13} />
            Edit RSVP
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50/80">
              <tr className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-400">
                <th className="px-4 py-3 sm:px-5">Guest</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">RSVP</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [0, 1, 2].map((item) => (
                  <tr key={item}>
                    <td className="px-4 py-4 sm:px-5" colSpan={5}>
                      <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : responses.length ? (
                responses.map((row, index) => {
                  const status = statusMeta(row.response);
                  const StatusIcon = status.icon;
                  const message = responseMessage(row);
                  return (
                    <tr key={responseKey(row, index)} className="text-sm">
                      <td className="px-4 py-4 font-semibold text-slate-900 sm:px-5">
                        {displayName(row)}
                      </td>
                      <td className="max-w-[220px] px-4 py-4">
                        <ContactCell row={row} />
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-black ${status.className}`}
                        >
                          <StatusIcon size={13} aria-hidden="true" />
                          {status.label}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-4 py-4 text-slate-500">
                        {message ? <span className="line-clamp-2">{message}</span> : "-"}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-400">
                        {displayUpdatedAt(row.updatedAt || row.createdAt)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center sm:px-5" colSpan={5}>
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <Users size={22} />
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-950">
                        No RSVP responses yet
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Guest details will populate here after the event page is shared.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function RsvpMessagesPanel({
  responses,
  allResponseCount,
  loading,
}: {
  responses: RsvpResponse[];
  allResponseCount: number;
  loading: boolean;
}) {
  return (
    <section className="space-y-4" aria-label="RSVP messages">
      <div className="owner-workspace-glass-panel relative overflow-hidden rounded-[24px] border border-black/5 bg-white/82 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <MessageSquare size={21} />
          </div>
          <div className="min-w-0">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-[#786bd6]">
              Messages
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
              {loading ? "Loading guest notes" : `${responses.length} messages`}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              RSVP notes from guests appear here so follow-ups stay separate from the response
              count.
            </p>
          </div>
        </div>
      </div>

      <section className="owner-workspace-glass-panel relative overflow-hidden rounded-[28px] border border-black/5 bg-white/86 p-4 shadow-sm sm:p-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : responses.length ? (
          <div className="space-y-3">
            {responses.map((row, index) => {
              const status = statusMeta(row.response);
              const StatusIcon = status.icon;
              const contact = responseContact(row);
              return (
                <article
                  key={responseKey(row, index)}
                  className="owner-workspace-glass-panel relative overflow-hidden rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-950">{displayName(row)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
                        {contact ? <span>{contact}</span> : null}
                        <span>{displayUpdatedAt(row.updatedAt || row.createdAt)}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-black ${status.className}`}
                    >
                      <StatusIcon size={13} aria-hidden="true" />
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    {responseMessage(row)}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <MessageSquare size={22} />
            </div>
            <p className="mt-3 text-base font-semibold text-slate-950">No messages yet</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {allResponseCount
                ? "Guests have responded, but none have left a message yet."
                : "Guest messages will appear here when someone adds a note to their RSVP."}
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

function GuestBreakdownCard({
  stats,
  responseRate,
  loading,
  isWedding,
}: {
  stats: RsvpStats;
  responseRate: number;
  loading: boolean;
  isWedding: boolean;
}) {
  const total = Math.max(1, stats.yes + stats.maybe + stats.no + stats.remaining);
  const yesStop = (stats.yes / total) * 100;
  const maybeStop = yesStop + (stats.maybe / total) * 100;
  const noStop = maybeStop + (stats.no / total) * 100;
  const chartColors = isWedding
    ? {
        yes: "#c9975a",
        maybe: "#e6e9c7",
        no: "#cf6d6a",
        pending: "#e8e5dc",
      }
    : {
        yes: "#6c60db",
        maybe: "#f2c76a",
        no: "#df6f7c",
        pending: "#e9e4f5",
      };
  const chartStyle = {
    background: `conic-gradient(${chartColors.yes} 0 ${yesStop}%, ${chartColors.maybe} ${yesStop}% ${maybeStop}%, ${chartColors.no} ${maybeStop}% ${noStop}%, ${chartColors.pending} ${noStop}% 100%)`,
  };

  return (
    <article className="owner-workspace-glass-panel relative overflow-hidden rounded-[28px] border border-black/5 bg-white/78 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
            Guest breakdown
          </p>
          <h4 className="mt-1 text-xl font-semibold text-slate-950">
            {loading
              ? "Loading responses"
              : stats.filled > 0
                ? `${responseRate}% complete`
                : "No replies yet"}
          </h4>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Users size={20} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
        <div className="mx-auto grid h-44 w-44 place-items-center rounded-full" style={chartStyle}>
          <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-inner">
            <span className="text-3xl font-semibold text-slate-950">{stats.filled}</span>
            <span className="-mt-5 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              replies
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <BreakdownRow label="Going" value={stats.yes} color={chartColors.yes} />
          <BreakdownRow label="Maybe" value={stats.maybe} color={chartColors.maybe} />
          <BreakdownRow label="Declined" value={stats.no} color={chartColors.no} />
          <BreakdownRow label="Pending" value={stats.remaining} color={chartColors.pending} />
          {isWedding ? (
            <p className="pt-2 text-sm leading-6 text-slate-500">
              Use this dashboard to keep guest counts, confirmations, and wedding details aligned.
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function BreakdownRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}

function RecentResponsesCard({
  responses,
  loading,
  isWedding,
}: {
  responses: RsvpResponse[];
  loading: boolean;
  isWedding: boolean;
}) {
  const activityShellClass = isWedding
    ? "border border-[#e7e1d4] bg-[#fffdf8] text-slate-950"
    : "border border-[#ded8ff] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(249,247,255,0.94)_100%)] text-slate-950";
  const livePillClass = isWedding
    ? "border-[#e2d7c1] bg-[#fbfaf4] text-[#9d7d51]"
    : "border-[#d9d3ff] bg-[#f5f2ff] text-[#6c60db]";
  const loadingClass = isWedding ? "bg-[#efe8d9]" : "bg-[#eeeaff]";
  const emptyClass = isWedding
    ? "border-[#e7e1d4] bg-[#fbfaf7] text-slate-600"
    : "border-[#e1dcff] bg-white/78 text-slate-600";

  return (
    <article
      className={`owner-workspace-glass-panel relative overflow-hidden rounded-[28px] p-5 shadow-sm ${activityShellClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xl font-semibold text-slate-950">Recent activity</h4>
        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] ${livePillClass}`}
        >
          Live
        </span>
      </div>

      <div className="mt-5 space-y-1">
        {loading ? (
          [0, 1, 2].map((item) => (
            <div key={item} className={`h-16 animate-pulse rounded-2xl ${loadingClass}`} />
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
          <div className={`rounded-2xl border p-4 text-sm leading-6 ${emptyClass}`}>
            Responses will appear here as guests reply.
          </div>
        )}
      </div>
    </article>
  );
}
