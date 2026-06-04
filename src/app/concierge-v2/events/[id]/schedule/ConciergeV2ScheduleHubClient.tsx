"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileSearch,
  LinkIcon,
  ListChecks,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
  Warehouse,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  EmptyState,
  FriendlyError,
  PageHeader,
  PremiumCard,
  ResponsiveTabs,
  SectionHeader,
  SummaryMetricCard,
} from "@/components/ui/premium-shell";

type RecordValue = Record<string, any>;
type ViewMode = "agenda" | "list" | "conflicts";

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

function formatDateGroup(value: any) {
  const raw = clean(value);
  if (!raw) return "Unscheduled";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function toDatetimeLocal(value: any) {
  const raw = clean(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (value === "canceled") return "bg-rose-50 text-rose-700";
  if (value === "done") return "bg-emerald-50 text-emerald-700";
  if (value === "tentative") return "bg-amber-50 text-amber-700";
  return "bg-violet-50 text-violet-700";
}

function TypePill({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusClass(status)}`}>
      {status || "scheduled"}
    </span>
  );
}

function emptyDraft() {
  return {
    title: "",
    occurrenceType: "event",
    startAt: "",
    endAt: "",
    locationText: "",
    timezone: "America/Chicago",
    notes: "",
  };
}

export default function ConciergeV2ScheduleHubClient({
  eventId,
  initialSchedule,
}: {
  eventId: string;
  initialSchedule: RecordValue;
}) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [view, setView] = useState<ViewMode>("agenda");
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<Record<string, RecordValue>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const occurrences = list(schedule.occurrences);
  const series = list(schedule.series);
  const conflicts = list(schedule.conflicts);
  const counts = schedule.counts || {};

  const grouped = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const occurrence of occurrences) {
      const key = formatDateGroup(occurrence.startAt);
      groups.set(key, [...(groups.get(key) || []), occurrence]);
    }
    return [...groups.entries()];
  }, [occurrences]);

  async function reloadSchedule() {
    setError(null);
    const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/schedule`);
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || "Unable to load schedule.");
    setSchedule(json.schedule);
  }

  async function addOccurrence() {
    setPendingId("new");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to add schedule item.");
      setSchedule(json.schedule);
      setDraft(emptyDraft());
      setNotice("Schedule item added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add schedule item.");
    } finally {
      setPendingId(null);
    }
  }

  async function updateOccurrence(occurrenceId: string, patch: RecordValue, success = "Schedule updated.") {
    setPendingId(occurrenceId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/schedule/occurrences/${encodeURIComponent(occurrenceId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to update schedule item.");
      setSchedule(json.schedule);
      setEditing((current) => {
        const next = { ...current };
        delete next[occurrenceId];
        return next;
      });
      setNotice(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update schedule item.");
    } finally {
      setPendingId(null);
    }
  }

  function editable(occurrence: RecordValue) {
    return {
      title: clean(occurrence.title),
      occurrenceType: clean(occurrence.type) || "event",
      startAt: toDatetimeLocal(occurrence.startAt),
      endAt: toDatetimeLocal(occurrence.endAt),
      locationText: clean(occurrence.locationText),
      timezone: clean(occurrence.timezone) || "America/Chicago",
      status: clean(occurrence.status) || "scheduled",
      notes: clean(occurrence.notes),
      ...editing[occurrence.id],
    };
  }

  function updateEdit(occurrenceId: string, patch: RecordValue) {
    setEditing((current) => ({
      ...current,
      [occurrenceId]: {
        ...current[occurrenceId],
        ...patch,
      },
    }));
  }

  function ScheduleItem({ occurrence, compact = false }: { occurrence: RecordValue; compact?: boolean }) {
    const edit = editable(occurrence);
    const isEditing = Boolean(editing[occurrence.id]);
    return (
      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TypePill>{clean(occurrence.type) || "event"}</TypePill>
              <StatusPill status={clean(occurrence.status) || "scheduled"} />
            </div>
            <h3 className="mt-3 text-lg font-black text-slate-950">{clean(occurrence.title) || "Schedule item"}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {formatDateTime(occurrence.startAt)}
              {clean(occurrence.locationText) ? ` at ${clean(occurrence.locationText)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateEdit(occurrence.id, editable(occurrence))}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={pendingId === occurrence.id}
              onClick={() =>
                void updateOccurrence(
                  occurrence.id,
                  { status: clean(occurrence.status) === "canceled" ? "scheduled" : "canceled" },
                  clean(occurrence.status) === "canceled" ? "Schedule item restored." : "Schedule item canceled.",
                )
              }
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clean(occurrence.status) === "canceled" ? "Restore" : "Cancel"}
            </button>
          </div>
        </div>
        {clean(occurrence.notes) && !isEditing ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">{clean(occurrence.notes)}</p>
        ) : null}
        {isEditing ? (
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Title
                <input
                  value={clean(edit.title)}
                  onChange={(event) => updateEdit(occurrence.id, { title: event.target.value })}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </label>
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Type
                <select
                  value={clean(edit.occurrenceType)}
                  onChange={(event) => updateEdit(occurrence.id, { occurrenceType: event.target.value })}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="event">Event</option>
                  <option value="practice">Practice</option>
                  <option value="meet">Meet</option>
                  <option value="deadline">Deadline</option>
                  <option value="team_dinner">Team dinner</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Starts
                <input
                  type="datetime-local"
                  value={clean(edit.startAt)}
                  onChange={(event) => updateEdit(occurrence.id, { startAt: event.target.value })}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </label>
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Ends
                <input
                  type="datetime-local"
                  value={clean(edit.endAt)}
                  onChange={(event) => updateEdit(occurrence.id, { endAt: event.target.value })}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </label>
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Location
                <input
                  value={clean(edit.locationText)}
                  onChange={(event) => updateEdit(occurrence.id, { locationText: event.target.value })}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </label>
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Status
                <select
                  value={clean(edit.status || occurrence.status) || "scheduled"}
                  onChange={(event) => updateEdit(occurrence.id, { status: event.target.value })}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="tentative">Tentative</option>
                  <option value="canceled">Canceled</option>
                  <option value="done">Done</option>
                </select>
              </label>
            </div>
            {!compact ? (
              <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Notes
                <textarea
                  rows={3}
                  value={clean(edit.notes)}
                  onChange={(event) => updateEdit(occurrence.id, { notes: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </label>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pendingId === occurrence.id}
                onClick={() => void updateOccurrence(occurrence.id, edit)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-violet-700 px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                Save
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditing((current) => {
                    const next = { ...current };
                    delete next[occurrence.id];
                    return next;
                  })
                }
                className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf9ff] text-slate-950">
      <PageHeader
        eyebrow="Schedule Hub"
        title={clean(schedule.event?.title) || "Event schedule"}
        subtitle="Build the agenda, review deadlines, and spot anything that needs attention before guests or families see it."
        actions={[
          { label: "Guest page", href: `/event/${encodeURIComponent(eventId)}` },
          { label: "Hub", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/hub`, icon: ShieldCheck },
          { label: "Setup", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/resources`, icon: Warehouse },
          { label: "RSVPs", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/rsvp`, icon: Users },
          { label: "Imports", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/imports`, icon: FileSearch },
          { label: "Calendar", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/calendar`, icon: LinkIcon },
          { label: "Reminders", href: `/concierge-v2/events/${encodeURIComponent(eventId)}/ops` },
          {
            label: "Refresh",
            icon: RefreshCw,
            primary: true,
            onClick: () => {
              void reloadSchedule().catch((err) =>
                setError(err instanceof Error ? err.message : "Unable to refresh schedule."),
              );
            },
          },
        ]}
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6">
        {error ? (
          <FriendlyError message={error} />
        ) : null}
        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {notice}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryMetricCard icon={CalendarDays} label="Active items" value={Number(counts.active || 0)} />
          <SummaryMetricCard icon={Clock} label="Recurring series" value={series.length} />
          <SummaryMetricCard icon={ListChecks} label="Deadlines" value={Number(counts.deadlines || 0)} />
          <SummaryMetricCard
            icon={AlertTriangle}
            label="Needs attention"
            value={conflicts.length}
            tone={conflicts.length ? "rose" : "emerald"}
            detail={conflicts.length ? "Review overlaps before sharing." : "No conflicts detected."}
          />
        </section>

        {series.length ? (
          <PremiumCard>
            <SectionHeader title="Recurring schedule" subtitle="Repeated practices, classes, sessions, or reminders that Envitefy keeps together." />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {series.map((item) => (
                <div key={item.id} className="rounded-2xl bg-violet-50/70 p-4">
                  <p className="font-black text-slate-950">{clean(item.title) || "Recurring series"}</p>
                  <p className="mt-1 text-sm font-semibold text-violet-700">
                    {clean(item.recurrenceRule) || "Rule to confirm"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {clean(item.startTimeLocal) || "Time to confirm"}
                    {item.durationMinutes ? ` for ${Number(item.durationMinutes)} min` : ""}
                  </p>
                </div>
              ))}
            </div>
          </PremiumCard>
        ) : null}

        <PremiumCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionHeader
              title="Add schedule item"
              subtitle="Add a one-off event, deadline, practice, travel block, meal, or parent reminder."
            />
            <button
              type="button"
              disabled={pendingId === "new"}
              onClick={() => void addOccurrence()}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-violet-700 px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add schedule item
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Title
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Practice, party setup, field trip bus, RSVP deadline"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Type
              <select
                value={draft.occurrenceType}
                onChange={(event) => setDraft((current) => ({ ...current, occurrenceType: event.target.value }))}
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              >
                <option value="event">Event</option>
                <option value="practice">Practice</option>
                <option value="meet">Meet</option>
                <option value="deadline">Deadline</option>
                <option value="team_dinner">Team dinner</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Starts
              <input
                type="datetime-local"
                value={draft.startAt}
                onChange={(event) => setDraft((current) => ({ ...current, startAt: event.target.value }))}
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Ends
              <input
                type="datetime-local"
                value={draft.endAt}
                onChange={(event) => setDraft((current) => ({ ...current, endAt: event.target.value }))}
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Location
              <input
                value={draft.locationText}
                onChange={(event) => setDraft((current) => ({ ...current, locationText: event.target.value }))}
                placeholder="Gym, classroom, pool, field, venue"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Notes
              <input
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="What families, guests, or helpers should know"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </label>
          </div>
        </PremiumCard>

        <ResponsiveTabs
          active={view}
          onSelect={(id) => setView(id as ViewMode)}
          tabs={[
            { id: "agenda", label: "Agenda", icon: CalendarDays },
            { id: "list", label: "List", icon: ListChecks },
            { id: "conflicts", label: "Needs attention", icon: AlertTriangle },
          ]}
        />

        {view === "agenda" ? (
          <section className="grid gap-5">
            {grouped.length ? grouped.map(([date, items]) => (
              <div key={date}>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">{date}</h2>
                <div className="mt-3 grid gap-3">
                  {items.map((occurrence) => (
                    <ScheduleItem key={occurrence.id} occurrence={occurrence} />
                  ))}
                </div>
              </div>
            )) : (
              <EmptyState
                icon={CalendarDays}
                title="No schedule items yet"
                description="Add the first practice, party block, deadline, trip detail, or event-day moment so the plan has a clear agenda."
              />
            )}
          </section>
        ) : null}

        {view === "list" ? (
          <section className="grid gap-3">
            {occurrences.map((occurrence) => (
              <ScheduleItem key={occurrence.id} occurrence={occurrence} compact />
            ))}
          </section>
        ) : null}

        {view === "conflicts" ? (
          <section className="grid gap-3">
            {conflicts.length ? conflicts.map((conflict, index) => (
              <div key={`${conflict.reason}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" aria-hidden="true" />
                  <div>
                    <h2 className="font-black text-amber-950">{clean(conflict.reason).replace(/_/g, " ")}</h2>
                    <p className="mt-1 text-sm font-semibold text-amber-800">
                      {list(conflict.occurrenceIds).join(" and ")}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-emerald-800">
                  No conflicts detected. Your schedule is ready for the next review.
                </p>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
