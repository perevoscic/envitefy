"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Search,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

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

type RsvpFilter = "all" | "yes" | "maybe" | "no";

const FILTERS: Array<{ key: RsvpFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "yes", label: "Going" },
  { key: "maybe", label: "Maybe" },
  { key: "no", label: "Declined" },
];

function normalizeResponse(value: unknown): "yes" | "maybe" | "no" {
  const normalized = String(value || "").trim().toLowerCase();
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

function displayUpdatedAt(value: string | null): string {
  if (!value) return "No timestamp";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function buildTarget(row: RsvpResponse) {
  if (row.email?.trim()) return { email: row.email.trim() };
  if (row.name?.trim()) return { name: row.name.trim() };
  const name = displayName(row);
  return name ? { name } : {};
}

function rowIdentity(row: RsvpResponse, fallback: number | string = ""): string {
  return `${row.email || row.name || displayName(row)}-${row.createdAt || row.updatedAt || fallback}`;
}

function statusCopy(value: string) {
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

export default function EventRsvpDashboard({
  eventId,
  initialNumberOfGuests = 0,
  rsvpEnabled,
}: {
  eventId: string;
  initialNumberOfGuests?: number;
  rsvpEnabled?: boolean;
}) {
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [responses, setResponses] = useState<RsvpResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<RsvpFilter>("all");
  const [query, setQuery] = useState("");

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
        remaining: Number(data.remaining ?? data.numberOfGuests ?? initialNumberOfGuests),
        numberOfGuests: Number(data.numberOfGuests || initialNumberOfGuests || 0),
      });
      setResponses(Array.isArray(data.responses) ? data.responses : []);
    } catch {
      setError("RSVP data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [eventId, initialNumberOfGuests]);

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
    remaining: initialNumberOfGuests,
    numberOfGuests: initialNumberOfGuests,
  };
  const hasResponses = responses.length > 0;
  const hasRsvpSurface = Boolean(rsvpEnabled || displayStats.numberOfGuests > 0 || hasResponses);
  const responseRate =
    displayStats.numberOfGuests > 0
      ? Math.min(100, Math.round((displayStats.filled / displayStats.numberOfGuests) * 100))
      : hasResponses
        ? 100
        : 0;

  const filteredResponses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return responses.filter((row) => {
      const response = normalizeResponse(row.response);
      if (filter !== "all" && response !== filter) return false;
      if (!normalizedQuery) return true;
      const haystack = [displayName(row), row.email, row.phone, row.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [filter, query, responses]);

  async function mutateRsvp(
    row: RsvpResponse,
    action: "update" | "delete",
    nextResponse?: "yes" | "maybe" | "no",
  ) {
    const key = rowIdentity(row);
    setUpdatingKey(key);
    try {
      await fetch(`/api/events/${eventId}/rsvp`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(nextResponse ? { response: nextResponse } : {}),
          target: buildTarget(row),
        }),
        credentials: "include",
      });
      await refreshRsvpData();
    } finally {
      setUpdatingKey(null);
    }
  }

  if (!hasRsvpSurface && !loading) {
    return (
      <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/82 p-6 text-center shadow-[0_20px_58px_rgba(79,70,128,0.10)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Users size={22} />
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-slate-950">No RSVP board yet</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          RSVP collection has not been configured for this event.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/72 bg-white/90 shadow-[0_24px_70px_rgba(79,70,128,0.14)] backdrop-blur-xl">
      <header className="border-b border-slate-200/80 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#786bd6]">
              RSVP board
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Guest responses
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Loading responses..." : `${displayStats.filled} responses recorded`}
            </p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-100 p-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#6c60db] transition-[width]"
                style={{ width: `${responseRate}%` }}
              />
            </div>
            <p className="mt-1 px-1 text-xs font-bold text-slate-500">{responseRate}% complete</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryTile label="Going" value={displayStats.yes} tone="emerald" />
          <SummaryTile label="Maybe" value={displayStats.maybe} tone="amber" />
          <SummaryTile label="Declined" value={displayStats.no} tone="rose" />
          <SummaryTile label="Pending" value={displayStats.remaining} tone="slate" />
          <SummaryTile label="Capacity" value={displayStats.numberOfGuests || "--"} tone="violet" />
        </div>
      </header>

      <div className="border-b border-slate-200/80 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search RSVPs</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search guests, email, phone, notes"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#6c60db] focus:ring-4 focus:ring-[#6c60db]/12"
            />
          </label>
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${
                  filter === item.key
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : filteredResponses.length > 0 ? (
          <div className="space-y-3">
            {filteredResponses.map((row, index) => {
              const status = statusCopy(row.response);
              const StatusIcon = status.icon;
              const rowKey = rowIdentity(row);
              const isUpdating = updatingKey === rowKey;

              return (
                <article
                  key={rowKey}
                  className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] lg:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-base font-semibold text-slate-950">
                        {displayName(row)}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${status.className}`}
                      >
                        <StatusIcon size={13} />
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                      {row.email ? <span className="break-all">{row.email}</span> : null}
                      {row.phone ? <span>{row.phone}</span> : null}
                      <span>Updated {displayUpdatedAt(row.updatedAt || row.createdAt)}</span>
                    </div>
                    {row.message ? (
                      <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                        {row.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 lg:justify-end">
                    <label className="relative flex-1 lg:w-36 lg:flex-none">
                      <span className="sr-only">Change RSVP status</span>
                      <select
                        value={normalizeResponse(row.response)}
                        disabled={isUpdating}
                        onChange={(event) =>
                          void mutateRsvp(
                            row,
                            "update",
                            event.target.value as "yes" | "maybe" | "no",
                          )
                        }
                        className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-700 outline-none transition focus:border-[#6c60db] focus:ring-4 focus:ring-[#6c60db]/12 disabled:opacity-60"
                      >
                        <option value="yes">Going</option>
                        <option value="maybe">Maybe</option>
                        <option value="no">Declined</option>
                      </select>
                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label="Delete RSVP"
                      title="Delete RSVP"
                      disabled={isUpdating}
                      onClick={() => void mutateRsvp(row, "delete")}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-white text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
              <Users size={22} />
            </div>
            <h4 className="mt-4 text-lg font-semibold text-slate-950">
              {hasResponses ? "No guests match this view" : "No responses yet"}
            </h4>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasResponses
                ? "Try another status filter or search term."
                : "As guests respond, their answers and notes will appear here."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "emerald" | "amber" | "rose" | "slate" | "violet";
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
  }[tone];

  return (
    <article className={`rounded-3xl border p-4 ${toneClass}`}>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-normal">{value}</p>
    </article>
  );
}
