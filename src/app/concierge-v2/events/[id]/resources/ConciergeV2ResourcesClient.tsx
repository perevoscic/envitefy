"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type ResourceRecord = Record<string, any>;

const RESOURCE_TYPES = [
  ["room", "Room"],
  ["coach", "Coach"],
  ["teacher", "Teacher"],
  ["equipment", "Equipment"],
  ["apparatus", "Apparatus"],
  ["bus", "Bus"],
  ["volunteer", "Volunteer"],
  ["other", "Other"],
];

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

function statusClass(status: any) {
  const value = clean(status).toLowerCase();
  if (value === "present") return "bg-emerald-50 text-emerald-700";
  if (value === "late") return "bg-amber-50 text-amber-700";
  if (value === "absent") return "bg-rose-50 text-rose-700";
  if (value === "excused") return "bg-slate-100 text-slate-600";
  if (value === "conflict") return "bg-rose-50 text-rose-700";
  return "bg-violet-50 text-violet-700";
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-violet-700" aria-hidden="true" />
      <p className="mt-4 text-3xl font-black text-slate-950">{Number(value || 0)}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function Pill({ children, status = "default" }: { children: string; status?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusClass(status)}`}>
      {children}
    </span>
  );
}

export default function ConciergeV2ResourcesClient({
  eventId,
  initialResources,
}: {
  eventId: string;
  initialResources: ResourceRecord;
}) {
  const [resources, setResources] = useState(initialResources);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resourceDraft, setResourceDraft] = useState({
    name: "",
    resourceType: "room",
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
      setResourceDraft({ name: "", resourceType: "room", venueName: "", capacity: "", notes: "" });
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

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Resources</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {clean(resources.event?.title) || "Resource planning"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              Assign rooms, coaches, equipment, and buses, then track check-in status on the day.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/hub`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Hub
            </Link>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/schedule`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Schedule
            </Link>
            <Link
              href={`/concierge-v2/events/${encodeURIComponent(eventId)}/imports`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
            >
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              Imports
            </Link>
            <button
              type="button"
              onClick={() => {
                void refreshResources().catch((err) =>
                  setError(err instanceof Error ? err.message : "Unable to refresh resources."),
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
          <SummaryCard icon={Warehouse} label="Resources" value={counts.resources} />
          <SummaryCard icon={ClipboardCheck} label="Assignments" value={counts.assignments} />
          <SummaryCard icon={AlertTriangle} label="Conflicts" value={counts.conflicts} />
          <SummaryCard icon={UserCheck} label="Checked status" value={counts.attendanceMarked} />
        </section>

        {conflicts.length ? (
          <section className="rounded-lg border border-rose-200 bg-rose-50 p-5">
            <h2 className="text-xl font-black text-rose-950">Double-bookings to resolve</h2>
            <div className="mt-4 grid gap-3">
              {conflicts.map((conflict, index) => (
                <div key={`${conflict.resourceId}-${index}`} className="rounded-lg bg-white p-4 text-sm">
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
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Resource board</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {resourceRows.map((resource) => (
                  <article key={resource.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950">{clean(resource.name) || "Resource"}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {clean(resource.type).replace(/_/g, " ") || "resource"}
                        </p>
                      </div>
                      <Pill status={resource.status}>{clean(resource.status) || "active"}</Pill>
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
                  </article>
                ))}
                {!resourceRows.length ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    No resources have been added yet.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Assignments</h2>
              <div className="mt-5 grid gap-3">
                {assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className={`rounded-lg border p-4 ${
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
                      <Pill status={assignment.hasConflict ? "conflict" : assignment.status}>
                        {assignment.hasConflict ? "Conflict" : clean(assignment.status) || "Assigned"}
                      </Pill>
                    </div>
                  </article>
                ))}
                {!assignments.length ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    No resource assignments yet.
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          <div className="grid gap-6">
            {canManageResources ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">Add resource</h2>
                <div className="mt-5 grid gap-3">
                  <input
                    value={resourceDraft.name}
                    onChange={(event) => setResourceDraft((current) => ({ ...current, name: event.target.value }))}
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    placeholder="Room, coach, bus, apparatus, equipment"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={resourceDraft.resourceType}
                      onChange={(event) => setResourceDraft((current) => ({ ...current, resourceType: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    >
                      {RESOURCE_TYPES.map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <input
                      value={resourceDraft.capacity}
                      onChange={(event) => setResourceDraft((current) => ({ ...current, capacity: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder="Capacity"
                    />
                  </div>
                  <input
                    value={resourceDraft.venueName}
                    onChange={(event) => setResourceDraft((current) => ({ ...current, venueName: event.target.value }))}
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    placeholder="Venue or location"
                  />
                  <button
                    type="button"
                    onClick={() => void createResource()}
                    disabled={pending === "resource"}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-700 px-4 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Warehouse className="h-4 w-4" aria-hidden="true" />
                    {pending === "resource" ? "Saving..." : "Save resource"}
                  </button>
                </div>
              </section>
            ) : null}

            {canManageResources ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">Assign resource</h2>
                <div className="mt-5 grid gap-3">
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
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="">Choose schedule item</option>
                    {occurrences.map((occurrence) => (
                      <option key={occurrence.id} value={occurrence.id}>{clean(occurrence.title) || "Schedule item"}</option>
                    ))}
                  </select>
                  <select
                    value={assignmentDraft.resourceId}
                    onChange={(event) => setAssignmentDraft((current) => ({ ...current, resourceId: event.target.value }))}
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="">Choose resource</option>
                    {resourceRows.map((resource) => (
                      <option key={resource.id} value={resource.id}>{clean(resource.name) || "Resource"}</option>
                    ))}
                  </select>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="datetime-local"
                      value={assignmentDraft.startAt}
                      onChange={(event) => setAssignmentDraft((current) => ({ ...current, startAt: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    />
                    <input
                      type="datetime-local"
                      value={assignmentDraft.endAt}
                      onChange={(event) => setAssignmentDraft((current) => ({ ...current, endAt: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void assignResource()}
                    disabled={pending === "assignment"}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {pending === "assignment" ? "Assigning..." : "Assign resource"}
                  </button>
                </div>
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Day-of check-in</h2>
              <div className="mt-5 grid gap-3">
                <select
                  value={selectedOccurrence?.id || ""}
                  onChange={(event) => setAttendanceOccurrenceId(event.target.value)}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                >
                  {occurrences.map((occurrence) => (
                    <option key={occurrence.id} value={occurrence.id}>{clean(occurrence.title) || "Schedule item"}</option>
                  ))}
                </select>
                {participants.map((participant) => {
                  const row = attendanceFor(participant.id);
                  const status = clean(row?.status) || "expected";
                  return (
                    <div key={participant.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">{clean(participant.name) || "Participant"}</p>
                          {clean(participant.groupName) ? (
                            <p className="text-sm font-semibold text-slate-500">{participant.groupName}</p>
                          ) : null}
                        </div>
                        <Pill status={status}>{status}</Pill>
                      </div>
                      {canMarkAttendance ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ATTENDANCE_ACTIONS.map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => void markAttendance(participant.id, key)}
                              disabled={pending === `${selectedOccurrence?.id}:${participant.id}:${key}`}
                              className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {!participants.length ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    Add roster participants in the Hub before marking attendance.
                    <Link
                      href={`/concierge-v2/events/${encodeURIComponent(eventId)}/hub`}
                      className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-violet-700"
                    >
                      <Users className="h-4 w-4" aria-hidden="true" />
                      Open Hub
                    </Link>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
