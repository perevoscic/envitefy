"use client";

import {
  AlertTriangle,
  Baby,
  CalendarDays,
  Download,
  HelpCircle,
  LinkIcon,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  UserX,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type BoardRecord = Record<string, any>;
type FilterMode = "all" | "yes" | "maybe" | "no" | "allergies";

function clean(value: any): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(value: any) {
  const raw = clean(value);
  if (!raw) return "Not updated";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function responseLabel(value: any) {
  const status = clean(value).toLowerCase();
  if (status === "yes") return "Attending";
  if (status === "maybe") return "Maybe";
  if (status === "no") return "Not attending";
  return "No response";
}

function responseClass(value: any) {
  const status = clean(value).toLowerCase();
  if (status === "yes") return "bg-emerald-50 text-emerald-700";
  if (status === "maybe") return "bg-amber-50 text-amber-700";
  if (status === "no") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function answerValue(value: any): string {
  if (Array.isArray(value)) return value.map((item) => clean(item) || String(item)).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${responseClass(status)}`}>
      {responseLabel(status)}
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "violet",
}: {
  icon: any;
  label: string;
  value: number;
  tone?: "violet" | "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 bg-emerald-50"
      : tone === "amber"
        ? "text-amber-700 bg-amber-50"
        : tone === "rose"
          ? "text-rose-700 bg-rose-50"
          : "text-violet-700 bg-violet-50";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

export default function ConciergeV2RsvpBoardClient({
  eventId,
  initialBoard,
}: {
  eventId: string;
  initialBoard: BoardRecord;
}) {
  const [board, setBoard] = useState(initialBoard);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(list(initialBoard.responses)[0]?.id || null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const responses = list(board.responses);
  const summary = board.summary || {};
  const answerFields = list(board.answerFields);
  const selected = responses.find((response) => response.id === selectedId) || responses[0] || null;

  const filtered = useMemo(() => {
    const query = clean(search).toLowerCase();
    return responses.filter((response) => {
      if (filter !== "all" && filter !== "allergies" && clean(response.response).toLowerCase() !== filter) return false;
      if (filter === "allergies" && !clean(response.allergyNotes)) return false;
      if (!query) return true;
      const haystack = [
        response.name,
        response.email,
        response.phone,
        response.message,
        response.allergyNotes,
        response.foodChoice,
        ...Object.values(response.answers || {}),
      ]
        .map(answerValue)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [responses, filter, search]);

  async function reloadBoard() {
    setError(null);
    const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/rsvps`);
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || "Unable to refresh RSVP board.");
    setBoard(json.board);
    if (!selectedId && list(json.board.responses)[0]?.id) setSelectedId(list(json.board.responses)[0].id);
  }

  async function updateResponse(rsvpId: string, responseValue: string) {
    setPendingId(rsvpId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/rsvps/${encodeURIComponent(rsvpId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response: responseValue }),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to update RSVP.");
      setBoard(json.board);
      setSelectedId(rsvpId);
      setNotice("RSVP updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update RSVP.");
    } finally {
      setPendingId(null);
    }
  }

  function GuestCard({ response }: { response: BoardRecord }) {
    const active = selected?.id === response.id;
    return (
      <button
        type="button"
        onClick={() => setSelectedId(response.id)}
        className={`w-full rounded-lg border bg-white p-4 text-left shadow-sm transition ${
          active ? "border-violet-300 ring-4 ring-violet-100" : "border-slate-200 hover:border-violet-200"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-black text-slate-950">{clean(response.name) || "Guest"}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {clean(response.email) || clean(response.phone) || "No contact saved"}
            </p>
          </div>
          <StatusPill status={clean(response.response)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          {Number(response.adultCount || 0) ? <span>{Number(response.adultCount || 0)} adults</span> : null}
          {Number(response.kidCount || 0) ? <span>{Number(response.kidCount || 0)} kids</span> : null}
          {clean(response.allergyNotes) ? <span className="text-rose-700">Allergy note</span> : null}
        </div>
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">RSVP Board</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {clean(board.event?.title) || "Event RSVPs"}
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {clean(board.event?.mode) || "event"} response tracking
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/event/${encodeURIComponent(eventId)}`}
              className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              Guest page
            </Link>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/schedule`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Schedule
            </Link>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/calendar`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <LinkIcon className="h-4 w-4" aria-hidden="true" />
              Calendar
            </Link>
            <Link
              href={`/api/concierge/events/${encodeURIComponent(eventId)}/rsvps/export`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </Link>
            <button
              type="button"
              onClick={() => {
                void reloadBoard().catch((err) =>
                  setError(err instanceof Error ? err.message : "Unable to refresh RSVP board."),
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
          <SummaryCard icon={UserCheck} label="Attending" value={Number(summary.yes || 0)} tone="emerald" />
          <SummaryCard icon={HelpCircle} label="Maybe" value={Number(summary.maybe || 0)} tone="amber" />
          <SummaryCard icon={UserX} label="Not attending" value={Number(summary.no || 0)} tone="rose" />
          <SummaryCard icon={Mail} label="Pending" value={Number(summary.pending || 0)} />
          <SummaryCard icon={Baby} label="Kids" value={Number(summary.kids || 0)} />
          <SummaryCard icon={Users} label="Adults" value={Number(summary.adults || 0)} />
          <SummaryCard icon={AlertTriangle} label="Allergy notes" value={Number(summary.allergies || 0)} tone="rose" />
          <SummaryCard icon={MessageSquare} label="Responses" value={Number(summary.filled || 0)} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search guests, notes, allergies, meals"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                </label>
                <Link
                  href={`/concierge-v2/events/${encodeURIComponent(eventId)}/ops#reminders`}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
                >
                  Open reminders
                </Link>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {[
                  ["all", "All"],
                  ["yes", "Attending"],
                  ["maybe", "Maybe"],
                  ["no", "No"],
                  ["allergies", "Allergies"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key as FilterMode)}
                    className={`h-10 shrink-0 rounded-full px-4 text-xs font-black uppercase tracking-[0.12em] transition ${
                      filter === key
                        ? "bg-violet-700 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {filter === "all" || filter === "allergies" || filter === "yes" || filter === "maybe" || filter === "no" ? (
                filtered.length ? (
                  filtered.map((response) => <GuestCard key={response.id} response={response} />)
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-lg font-black text-slate-950">No matching RSVPs yet.</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Share the guest page or use reminders once guest contacts are available.
                    </p>
                  </div>
                )
              ) : null}
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5 lg:self-start">
            {selected ? (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Guest detail</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">{clean(selected.name) || "Guest"}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Updated {formatDateTime(selected.updatedAt)}
                    </p>
                  </div>
                  <StatusPill status={clean(selected.response)} />
                </div>

                <div className="mt-5 grid gap-2 text-sm font-semibold text-slate-600">
                  {clean(selected.email) ? <p>{selected.email}</p> : null}
                  {clean(selected.phone) ? <p>{selected.phone}</p> : null}
                  {!clean(selected.email) && !clean(selected.phone) ? <p>No contact saved.</p> : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {["yes", "maybe", "no"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={pendingId === selected.id}
                      onClick={() => void updateResponse(selected.id, status)}
                      className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        clean(selected.response) === status
                          ? responseClass(status)
                          : "border border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:text-violet-700"
                      }`}
                    >
                      {responseLabel(status)}
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Party count</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {Number(selected.adultCount || 0)} adult(s), {Number(selected.kidCount || 0)} kid(s)
                    </p>
                  </div>
                  {clean(selected.allergyNotes) ? (
                    <div className="rounded-lg bg-rose-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">Allergy note</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-rose-900">{selected.allergyNotes}</p>
                    </div>
                  ) : null}
                  {clean(selected.foodChoice) ? (
                    <div className="rounded-lg bg-violet-50 p-4">
                      <div className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-violet-700" aria-hidden="true" />
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">Food choice</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-violet-950">{selected.foodChoice}</p>
                    </div>
                  ) : null}
                  {clean(selected.message) ? (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Host note</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selected.message}</p>
                    </div>
                  ) : null}
                </div>

                {answerFields.length ? (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Answers</h3>
                    <div className="mt-3 grid gap-2">
                      {answerFields.map((field) => {
                        const value = answerValue(selected.answers?.[field.key]);
                        if (!value) return null;
                        return (
                          <div key={field.key} className="rounded-lg border border-slate-200 p-3">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                              {field.label}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                <p className="text-lg font-black text-slate-950">No RSVP selected.</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">Responses will appear here as guests reply.</p>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
