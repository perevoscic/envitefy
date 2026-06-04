"use client";

import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSearch,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EmptyState,
  FriendlyError,
  ModeBadge,
  PageHeader,
  PremiumCard,
  SectionHeader,
  StatusChip,
  SummaryMetricCard,
} from "@/components/ui/premium-shell";
import { getResourceModeCopy, resolveConciergeEventMode } from "@/lib/concierge-v2/mode-copy";

type ResourceRecord = Record<string, any>;

const ATTENDANCE_ACTIONS = [
  ["present", "Present"],
  ["late", "Late"],
  ["absent", "Absent"],
  ["excused", "Excused"],
];

function clean(value: any): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function formatDateTime(value: any) {
  const raw = clean(value);
  if (!raw) return "Time needed";
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

function toDatetimeLocal(value: any) {
  const raw = clean(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function statusTone(status: any): "violet" | "slate" | "emerald" | "amber" | "rose" {
  const value = clean(status).toLowerCase();
  if (value === "present" || value === "active" || value === "assigned") return "emerald";
  if (value === "late" || value === "expected") return "amber";
  if (value === "absent" || value === "conflict") return "rose";
  if (value === "excused" || value === "archived") return "slate";
  return "violet";
}

function typeLabel(value: any, options: Array<{ key: string; label: string }>) {
  const raw = clean(value);
  return options.find((option) => option.key === raw)?.label || raw.replace(/_/g, " ") || "Item";
}

export default function ConciergeV2ResourcesClient({
  eventId,
  initialResources,
}: {
  eventId: string;
  initialResources: ResourceRecord;
}) {
  const initialCopy = getResourceModeCopy(
    resolveConciergeEventMode({
      mode: initialResources.event?.mode,
      title: initialResources.event?.title,
    }),
  );
  const [resources, setResources] = useState(initialResources);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resourceDraft, setResourceDraft] = useState({
    name: "",
    resourceType: initialCopy.options[0]?.key || "other",
    venueName: "",
    capacity: "",
    notes: "",
  });
  const occurrences = list(resources.occurrences);
  const resourceRows = list(resources.resources);
  const assignments = list(resources.assignments);
  const conflicts = list(resources.conflicts);
  const participants = list(resources.participants);
  const attendance = list(resources.attendance);
  const counts = resources.counts || {};
  const canManageResources = Boolean(resources.currentUser?.canManageResources);
  const canMarkAttendance = Boolean(resources.currentUser?.canMarkAttendance);
  const mode = resolveConciergeEventMode({
    mode: resources.event?.mode,
    title: resources.event?.title,
  });
  const modeCopy = getResourceModeCopy(mode);
  const [assignmentDraft, setAssignmentDraft] = useState({
    occurrenceId: occurrences[0]?.id || "",
    resourceId: resourceRows[0]?.id || "",
    startAt: toDatetimeLocal(occurrences[0]?.startAt),
    endAt: toDatetimeLocal(occurrences[0]?.endAt),
    notes: "",
  });
  const [attendanceOccurrenceId, setAttendanceOccurrenceId] = useState(occurrences[0]?.id || "");

  const selectedOccurrence = useMemo(
    () => occurrences.find((item) => item.id === attendanceOccurrenceId) || occurrences[0] || null,
    [attendanceOccurrenceId, occurrences],
  );
  const selectedAttendance = attendance.filter((item) => item.occurrenceId === selectedOccurrence?.id);

  function attendanceFor(participantId: string) {
    return selectedAttendance.find((item) => item.participantId === participantId) || null;
  }

  async function refreshResources() {
    setError(null);
    const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/resources`);
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || "Unable to refresh resources.");
    setResources(json.resources);
  }

  async function createResource() {
    setPending("resource");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resourceDraft),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to create resource.");
      setResources(json.resources);
      setAssignmentDraft((current) => ({ ...current, resourceId: current.resourceId || json.resource?.id || "" }));
      setResourceDraft({
        name: "",
        resourceType: modeCopy.options[0]?.key || "other",
        venueName: "",
        capacity: "",
        notes: "",
      });
      setNotice("Resource saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create resource.");
    } finally {
      setPending(null);
    }
  }

  async function assignResource() {
    setPending("assignment");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/resources/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentDraft),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to assign resource.");
      setResources(json.resources);
      setNotice("Resource assigned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign resource.");
    } finally {
      setPending(null);
    }
  }

  async function markAttendance(participantId: string, status: string) {
    if (!selectedOccurrence) return;
    setPending(`${selectedOccurrence.id}:${participantId}:${status}`);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/resources/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrenceId: selectedOccurrence.id, participantId, status }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to update attendance.");
      setResources(json.resources);
      setNotice("Attendance updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update attendance.");
    } finally {
      setPending(null);
    }
  }

  async function checkOutAttendance(participantId: string) {
    if (!selectedOccurrence) return;
    setPending(`${selectedOccurrence.id}:${participantId}:checkout`);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/resources/attendance/checkout`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrenceId: selectedOccurrence.id, participantId }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to check out participant.");
      setResources(json.resources);
      setNotice("Participant checked out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check out participant.");
    } finally {
      setPending(null);
    }
  }

  async function archiveResource(resourceId: string) {
    setPending(`archive:${resourceId}`);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/concierge/events/${encodeURIComponent(eventId)}/resources/${encodeURIComponent(resourceId)}`,
        { method: "DELETE" },
      );
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to archive resource.");
      setResources(json.resources);
      setNotice("Resource archived.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to archive resource.");
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf9ff] text-slate-950">
      <PageHeader
        eyebrow={modeCopy.pageEyebrow}
        title={clean(resources.event?.title) || modeCopy.pageTitleFallback}
        subtitle={modeCopy.pageSubtitle}
        badge={<ModeBadge label={modeCopy.badge} />}
        actions={[
          {
            label: "Hub",
            href: `/concierge-v2/events/${encodeURIComponent(eventId)}/hub`,
            icon: ShieldCheck,
          },
          {
            label: "Schedule",
            href: `/concierge-v2/events/${encodeURIComponent(eventId)}/schedule`,
            icon: CalendarDays,
          },
          {
            label: "Imports",
            href: `/concierge-v2/events/${encodeURIComponent(eventId)}/imports`,
            icon: FileSearch,
          },
          {
            label: "Refresh",
            icon: RefreshCw,
            primary: true,
            onClick: () => {
              void refreshResources().catch((err) =>
                setError(err instanceof Error ? err.message : "Unable to refresh setup details."),
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
          <SummaryMetricCard icon={Warehouse} label={modeCopy.metrics.items} value={Number(counts.resources || 0)} />
          <SummaryMetricCard icon={ClipboardCheck} label={modeCopy.metrics.assignments} value={Number(counts.assignments || 0)} />
          <SummaryMetricCard
            icon={AlertTriangle}
            label={modeCopy.metrics.conflicts}
            value={Number(counts.conflicts || 0)}
            tone={Number(counts.conflicts || 0) ? "rose" : "emerald"}
            detail={Number(counts.conflicts || 0) ? "Resolve before event day." : "No double-booking found."}
          />
          <SummaryMetricCard icon={UserCheck} label={modeCopy.metrics.attendance} value={Number(counts.attendanceMarked || 0)} />
        </section>

        {conflicts.length ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <h2 className="text-xl font-black text-rose-950">Double-bookings to resolve</h2>
            <div className="mt-4 grid gap-3">
              {conflicts.map((conflict, index) => (
                <div key={`${conflict.resourceId}-${index}`} className="rounded-xl bg-white p-4 text-sm">
                  <p className="font-black text-rose-950">{clean(conflict.resourceName) || "Resource"}</p>
                  <p className="mt-1 font-semibold text-rose-700">
                    Overlaps {formatDateTime(conflict.window?.startsAt)} to {formatDateTime(conflict.window?.endsAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="grid gap-6">
            <PremiumCard>
              <SectionHeader title={modeCopy.boardTitle} subtitle={modeCopy.boardSubtitle} />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {resourceRows.map((resource) => (
                  <article key={resource.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950">{clean(resource.name) || modeCopy.itemLabel}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {typeLabel(resource.type, modeCopy.options)}
                        </p>
                      </div>
                      <StatusChip tone={statusTone(resource.status)}>{clean(resource.status) || "active"}</StatusChip>
                    </div>
                    {clean(resource.venueName) ? (
                      <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <MapPin className="h-4 w-4 text-violet-700" aria-hidden="true" />
                        {resource.venueName}
                      </p>
                    ) : null}
                    {resource.capacity ? (
                      <p className="mt-2 text-sm font-semibold text-slate-500">Capacity {Number(resource.capacity)}</p>
                    ) : null}
                    {canManageResources && clean(resource.status) !== "archived" ? (
                      <button
                        type="button"
                        onClick={() => void archiveResource(resource.id)}
                        disabled={pending === `archive:${resource.id}`}
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Archive className="h-4 w-4" aria-hidden="true" />
                        Archive
                      </button>
                    ) : null}
                  </article>
                ))}
                {!resourceRows.length ? (
                  <EmptyState
                    icon={Plus}
                    title={modeCopy.emptyItemsTitle}
                    description={modeCopy.emptyItemsDescription}
                  />
                ) : null}
              </div>
            </PremiumCard>

            <PremiumCard>
              <SectionHeader title={modeCopy.assignmentTitle} subtitle={modeCopy.assignmentSubtitle} />
              <div className="mt-5 grid gap-3">
                {assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className={`rounded-2xl border p-4 ${
                      assignment.hasConflict ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950">{assignment.resourceName}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{assignment.occurrenceTitle}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-600">
                          {formatDateTime(assignment.startsAt)} - {formatDateTime(assignment.endsAt)}
                        </p>
                      </div>
                      <StatusChip tone={statusTone(assignment.hasConflict ? "conflict" : assignment.status)}>
                        {assignment.hasConflict ? "Conflict" : clean(assignment.status) || "Assigned"}
                      </StatusChip>
                    </div>
                  </article>
                ))}
                {!assignments.length ? (
                  <EmptyState
                    icon={ClipboardCheck}
                    title={modeCopy.emptyAssignmentsTitle}
                    description={modeCopy.emptyAssignmentsDescription}
                  />
                ) : null}
              </div>
            </PremiumCard>
          </div>

          <div className="grid gap-6">
            {canManageResources ? (
              <PremiumCard>
                <SectionHeader title={modeCopy.addTitle} subtitle={modeCopy.addSubtitle} />
                <div className="mt-5 grid gap-3">
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    {modeCopy.itemLabel}
                    <input
                      value={resourceDraft.name}
                      onChange={(event) => setResourceDraft((current) => ({ ...current, name: event.target.value }))}
                      className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder={modeCopy.itemPlaceholder}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      {modeCopy.typeLabel}
                      <select
                        value={resourceDraft.resourceType}
                        onChange={(event) =>
                          setResourceDraft((current) => ({ ...current, resourceType: event.target.value }))
                        }
                        className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      >
                        {modeCopy.options.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      {modeCopy.capacityLabel}
                      <input
                        value={resourceDraft.capacity}
                        onChange={(event) => setResourceDraft((current) => ({ ...current, capacity: event.target.value }))}
                        className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                        placeholder={modeCopy.capacityPlaceholder}
                      />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    {modeCopy.locationLabel}
                    <input
                      value={resourceDraft.venueName}
                      onChange={(event) => setResourceDraft((current) => ({ ...current, venueName: event.target.value }))}
                      className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder={modeCopy.locationPlaceholder}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    {modeCopy.notesLabel}
                    <textarea
                      value={resourceDraft.notes}
                      onChange={(event) => setResourceDraft((current) => ({ ...current, notes: event.target.value }))}
                      className="min-h-24 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder="Add timing, owner, or setup details."
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void createResource()}
                    disabled={pending === "resource"}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-700 px-4 text-sm font-black text-white transition hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Warehouse className="h-4 w-4" aria-hidden="true" />
                    {pending === "resource" ? "Saving..." : modeCopy.addButton}
                  </button>
                </div>
              </PremiumCard>
            ) : null}

            {canManageResources ? (
              <PremiumCard>
                <SectionHeader title={modeCopy.assignmentTitle} subtitle="Choose the schedule item and time window this needs to cover." />
                <div className="mt-5 grid gap-3">
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Schedule item
                    <select
                      value={assignmentDraft.occurrenceId}
                      onChange={(event) => {
                        const occurrence = occurrences.find((item) => item.id === event.target.value);
                        setAssignmentDraft((current) => ({
                          ...current,
                          occurrenceId: event.target.value,
                          startAt: toDatetimeLocal(occurrence?.startAt),
                          endAt: toDatetimeLocal(occurrence?.endAt),
                        }));
                      }}
                      className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="">Choose schedule item</option>
                      {occurrences.map((occurrence) => (
                        <option key={occurrence.id} value={occurrence.id}>
                          {clean(occurrence.title) || "Schedule item"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    {modeCopy.itemLabel}
                    <select
                      value={assignmentDraft.resourceId}
                      onChange={(event) => setAssignmentDraft((current) => ({ ...current, resourceId: event.target.value }))}
                      className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="">Choose item</option>
                      {resourceRows.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {clean(resource.name) || modeCopy.itemLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Needed from
                      <input
                        type="datetime-local"
                        value={assignmentDraft.startAt}
                        onChange={(event) => setAssignmentDraft((current) => ({ ...current, startAt: event.target.value }))}
                        className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-black text-slate-700">
                      Needed until
                      <input
                        type="datetime-local"
                        value={assignmentDraft.endAt}
                        onChange={(event) => setAssignmentDraft((current) => ({ ...current, endAt: event.target.value }))}
                        className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => void assignResource()}
                    disabled={pending === "assignment"}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {pending === "assignment" ? "Assigning..." : modeCopy.assignButton}
                  </button>
                </div>
              </PremiumCard>
            ) : null}

            <PremiumCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionHeader title={modeCopy.attendanceTitle} subtitle={modeCopy.attendanceSubtitle} />
                <a
                  href={`/api/concierge/events/${encodeURIComponent(eventId)}/resources/attendance/export${
                    selectedOccurrence?.id ? `?occurrenceId=${encodeURIComponent(selectedOccurrence.id)}` : ""
                  }`}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-violet-700 ring-1 ring-slate-200 transition hover:ring-violet-200 focus:outline-none focus:ring-4 focus:ring-violet-100"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export CSV
                </a>
              </div>
              <div className="mt-5 grid gap-3">
                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Schedule item
                  <select
                    value={selectedOccurrence?.id || ""}
                    onChange={(event) => setAttendanceOccurrenceId(event.target.value)}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  >
                    {occurrences.map((occurrence) => (
                      <option key={occurrence.id} value={occurrence.id}>
                        {clean(occurrence.title) || "Schedule item"}
                      </option>
                    ))}
                  </select>
                </label>
                {participants.map((participant) => {
                  const row = attendanceFor(participant.id);
                  const status = clean(row?.status) || "expected";
                  return (
                    <div key={participant.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">{clean(participant.name) || "Participant"}</p>
                          {clean(participant.groupName) ? (
                            <p className="text-sm font-semibold text-slate-500">{participant.groupName}</p>
                          ) : null}
                        </div>
                        <StatusChip tone={statusTone(status)}>{status}</StatusChip>
                      </div>
                      {canMarkAttendance ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ATTENDANCE_ACTIONS.map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => void markAttendance(participant.id, key)}
                              disabled={pending === `${selectedOccurrence?.id}:${participant.id}:${key}`}
                              className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700 shadow-sm transition hover:bg-violet-100 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {label}
                            </button>
                          ))}
                          {row && !row.checkedOutAt ? (
                            <button
                              type="button"
                              onClick={() => void checkOutAttendance(participant.id)}
                              disabled={pending === `${selectedOccurrence?.id}:${participant.id}:checkout`}
                              className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-700 shadow-sm transition hover:bg-violet-100 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <LogOut className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                              Check out
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {!participants.length ? (
                  <EmptyState
                    icon={Users}
                    title={modeCopy.emptyAttendanceTitle}
                    description={modeCopy.emptyAttendanceDescription}
                    action={
                      <Link
                        href={`/concierge-v2/events/${encodeURIComponent(eventId)}/hub`}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-violet-700 shadow-sm transition hover:text-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-100"
                      >
                        <Users className="h-4 w-4" aria-hidden="true" />
                        Open Hub
                      </Link>
                    }
                  />
                ) : null}
              </div>
            </PremiumCard>
          </div>
        </section>
      </div>
    </main>
  );
}
