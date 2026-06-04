"use client";

import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileSearch,
  GraduationCap,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type HubRecord = Record<string, any>;

const ROLE_OPTIONS = [
  ["program_manager", "Program manager"],
  ["scheduler", "Scheduler"],
  ["coach_teacher", "Coach / teacher"],
  ["front_desk_checkin", "Check-in"],
  ["parent_guardian", "Parent / guardian"],
  ["participant", "Participant"],
  ["guest", "Guest"],
];

function clean(value: any): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function roleLabel(value: any): string {
  const role = clean(value);
  return ROLE_OPTIONS.find(([key]) => key === role)?.[1] || role.replace(/_/g, " ") || "Member";
}

function modeCopy(mode: string) {
  if (mode === "team") {
    return {
      label: "Team hub",
      title: "Roster, practices, signups, payments, and parent updates in one place.",
      participantLabel: "Roster",
      groupLabel: "Group / level",
      familyLabel: "Family",
    };
  }
  if (mode === "class") {
    return {
      label: "Class hub",
      title: "Families, forms, snack signups, trip details, and teacher reminders stay organized.",
      participantLabel: "Students",
      groupLabel: "Group / table",
      familyLabel: "Family",
    };
  }
  return {
    label: "Parent hub",
    title: "Family plans, deadlines, RSVPs, packing notes, and who-is-going details stay together.",
    participantLabel: "Participants",
    groupLabel: "Group",
    familyLabel: "Family",
  };
}

function formatDateTime(value: any) {
  const raw = clean(value);
  if (!raw) return "No time set";
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

function CountCard({
  icon: Icon,
  label,
  value,
  tone = "violet",
}: {
  icon: any;
  label: string;
  value: any;
  tone?: "violet" | "emerald" | "amber" | "slate";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : tone === "slate"
          ? "bg-slate-100 text-slate-700"
          : "bg-violet-50 text-violet-700";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-3xl font-black text-slate-950">{Number(value || 0)}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

export default function ConciergeV2TeamClassHubClient({
  eventId,
  initialHub,
}: {
  eventId: string;
  initialHub: HubRecord;
}) {
  const [hub, setHub] = useState(initialHub);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("parent_guardian");
  const [participant, setParticipant] = useState({
    firstName: "",
    lastName: "",
    familyName: "",
    groupName: "",
    grade: "",
    schoolName: "",
    allergies: "",
    notes: "",
    role: "participant",
  });

  const mode = clean(hub.hubMode) || "parent";
  const copy = useMemo(() => modeCopy(mode), [mode]);
  const summary = hub.summary || {};
  const members = list(hub.members);
  const participants = list(hub.participants);
  const upcoming = list(hub.upcoming);
  const canManagePeople = Boolean(hub.currentUser?.canManagePeople);
  const canManageRoles = Boolean(hub.currentUser?.canManageRoles);

  async function refreshHub() {
    setError(null);
    const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/hub`);
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || "Unable to refresh hub.");
    setHub(json.hub);
  }

  async function inviteMember() {
    setPending("member");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/hub/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberEmail, role: memberRole }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to add member.");
      setHub(json.hub);
      setMemberEmail("");
      setNotice("Workspace member saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add member.");
    } finally {
      setPending(null);
    }
  }

  async function addParticipant() {
    setPending("participant");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/concierge/events/${encodeURIComponent(eventId)}/hub/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(participant),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to add participant.");
      setHub(json.hub);
      setParticipant({
        firstName: "",
        lastName: "",
        familyName: "",
        groupName: "",
        grade: "",
        schoolName: "",
        allergies: "",
        notes: "",
        role: "participant",
      });
      setNotice("Participant added to this program.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add participant.");
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">{copy.label}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {clean(hub.event?.title) || "Team and class hub"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-bold leading-6 text-slate-500">{copy.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
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
                void refreshHub().catch((err) =>
                  setError(err instanceof Error ? err.message : "Unable to refresh hub."),
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
          <CountCard icon={Users} label="Workspace members" value={summary.memberCount} />
          <CountCard icon={GraduationCap} label={copy.participantLabel} value={summary.participantCount} tone="emerald" />
          <CountCard icon={ClipboardCheck} label="Open deadlines" value={summary.deadlineCount} tone="amber" />
          <CountCard icon={HeartHandshake} label="Signup claims" value={summary.claimCount} tone="slate" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="grid gap-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">{copy.participantLabel}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">People connected to this program.</p>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-violet-700">
                  {roleLabel(hub.currentUser?.role)}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {participants.map((item) => (
                  <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950">{clean(item.name) || "Participant"}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {[clean(item.groupName), clean(item.grade), clean(item.schoolName)].filter(Boolean).join(" / ") || clean(item.role) || "Active"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
                        {clean(item.status) || "active"}
                      </span>
                    </div>
                    {clean(item.familyName) ? (
                      <p className="mt-3 text-sm font-semibold text-slate-600">{copy.familyLabel}: {item.familyName}</p>
                    ) : null}
                    {clean(item.allergies) ? (
                      <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-800">
                        Allergies: {item.allergies}
                      </p>
                    ) : null}
                  </article>
                ))}
                {!participants.length ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    No participants have been added yet.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Upcoming coordination</h2>
              <div className="mt-5 grid gap-3">
                {upcoming.map((item) => (
                  <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950">{clean(item.title) || "Schedule item"}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{formatDateTime(item.startAt)}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
                        {clean(item.type) || "event"}
                      </span>
                    </div>
                    {clean(item.locationText) ? (
                      <p className="mt-3 text-sm font-semibold text-slate-600">{item.locationText}</p>
                    ) : null}
                  </article>
                ))}
                {!upcoming.length ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    No active schedule items are connected yet.
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          <div className="grid gap-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Workspace roles</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Role labels control who can help manage this program.</p>
              <div className="mt-5 grid gap-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">
                        {clean(member.invitedEmail) || clean(member.userId) || "Workspace member"}
                      </p>
                      <p className="text-sm font-semibold text-slate-500">{roleLabel(member.role)}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
                      {clean(member.status) || "active"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {canManageRoles ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-slate-950">Add a role</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Invite a helper or assign an existing user to this workspace.</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Email
                    <input
                      value={memberEmail}
                      onChange={(event) => setMemberEmail(event.target.value)}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder="coach@example.com"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Role
                    <select
                      value={memberRole}
                      onChange={(event) => setMemberRole(event.target.value)}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    >
                      {ROLE_OPTIONS.map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void inviteMember()}
                    disabled={pending === "member"}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-700 px-4 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    {pending === "member" ? "Saving..." : "Save member"}
                  </button>
                </div>
              </section>
            ) : null}

            {canManagePeople ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">Add {copy.participantLabel.toLowerCase()}</h2>
                <div className="mt-5 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={participant.firstName}
                      onChange={(event) => setParticipant((current) => ({ ...current, firstName: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder="First name"
                    />
                    <input
                      value={participant.lastName}
                      onChange={(event) => setParticipant((current) => ({ ...current, lastName: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder="Last name"
                    />
                  </div>
                  <input
                    value={participant.familyName}
                    onChange={(event) => setParticipant((current) => ({ ...current, familyName: event.target.value }))}
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    placeholder={`${copy.familyLabel} name`}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={participant.groupName}
                      onChange={(event) => setParticipant((current) => ({ ...current, groupName: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder={copy.groupLabel}
                    />
                    <input
                      value={participant.grade}
                      onChange={(event) => setParticipant((current) => ({ ...current, grade: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      placeholder="Grade / level"
                    />
                  </div>
                  <input
                    value={participant.allergies}
                    onChange={(event) => setParticipant((current) => ({ ...current, allergies: event.target.value }))}
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    placeholder="Allergies or important notes"
                  />
                  <button
                    type="button"
                    onClick={() => void addParticipant()}
                    disabled={pending === "participant"}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <GraduationCap className="h-4 w-4" aria-hidden="true" />
                    {pending === "participant" ? "Adding..." : "Add participant"}
                  </button>
                </div>
              </section>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Link
                href={`/concierge-v2/events/${encodeURIComponent(eventId)}/ops`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
              >
                <span className="inline-flex items-center gap-2"><WalletCards className="h-4 w-4" aria-hidden="true" /> Payments</span>
                <span>{Number(summary.unpaidPaymentCount || 0)}</span>
              </Link>
              <Link
                href={`/concierge-v2/events/${encodeURIComponent(eventId)}/ops#reminders`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
              >
                <span className="inline-flex items-center gap-2"><Bell className="h-4 w-4" aria-hidden="true" /> Reminders</span>
                <span>{Number(summary.reminderCount || 0)}</span>
              </Link>
              <Link
                href={`/concierge-v2/events/${encodeURIComponent(eventId)}/rsvp`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
              >
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" /> RSVPs</span>
                <span>{Number(summary.rsvpCount || 0)}</span>
              </Link>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
