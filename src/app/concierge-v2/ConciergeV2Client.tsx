"use client";

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FileSearch,
  FileText,
  HeartHandshake,
  LinkIcon,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  Warehouse,
  WalletCards,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { ConciergeV2Flags } from "@/config/concierge-v2-flags";
import { cn } from "@/lib/utils";

type DraftRecord = Record<string, any>;

type SessionRecord = {
  id: string;
  status: string;
};

type ApplyResult = {
  eventPath: string;
  eventHistoryId: string;
  occurrenceCount: number;
  formCount: number;
  volunteerSlotCount: number;
  paymentRequestCount: number;
  reminderCount: number;
  checklistCount: number;
};

const EXAMPLES = [
  {
    label: "Gymnastics season",
    prompt:
      "Lara has gymnastics every Tuesday and Thursday at 5:30, meet on March 12 in Orlando, team dinner the night before, and I need to invite grandparents.",
  },
  {
    label: "Spirit week",
    prompt:
      "Lara has spirit week next week: Monday pajamas, Tuesday crazy hair, Wednesday bring canned food, Thursday team shirt, Friday early dismissal.",
  },
  {
    label: "Birthday party",
    prompt: "Plan Lara's 8th birthday, cat theme, pool party.",
  },
  {
    label: "Class party signup",
    prompt: "We need a Valentine's class party signup for 22 kids.",
  },
];

const CAPABILITY_CARDS = [
  { key: "event_page", label: "Event Page", icon: FileText },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "rsvp", label: "RSVP", icon: Users },
  { key: "forms", label: "Forms", icon: ClipboardList },
  { key: "volunteer", label: "Signup", icon: HeartHandshake },
  { key: "payments", label: "Payments", icon: WalletCards },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "checklist", label: "Checklist", icon: ClipboardCheck },
];

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

function formatCurrency(cents: any, currency = "USD") {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: clean(currency) || "USD",
  }).format(amount);
}

function SectionCard({
  title,
  eyebrow,
  icon: Icon,
  children,
  muted = false,
}: {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-[0_18px_54px_rgba(88,64,150,0.09)] sm:p-5",
        muted ? "border-slate-200/80" : "border-violet-100",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">{title}</h2>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
      {children}
    </div>
  );
}

export default function ConciergeV2Client({ flags }: { flags: ConciergeV2Flags }) {
  const [input, setInput] = useState(EXAMPLES[0].prompt);
  const [draft, setDraft] = useState<DraftRecord | null>(null);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const scheduleItems = list(draft?.occurrences);
  const seriesItems = list(draft?.series);
  const forms = list(draft?.forms);
  const volunteerSlots = list(draft?.volunteerSlots);
  const paymentItems = list(draft?.paymentItems);
  const reminders = list(draft?.reminders);
  const checklistItems = list(draft?.checklistItems);
  const missingFields = list(draft?.missingFields).map(String).filter(Boolean);
  const canApply = Boolean(session?.id && draft && !isApplying);

  const activeCapabilities = useMemo(() => {
    const active = new Set(["event_page", "rsvp"]);
    if (seriesItems.length || scheduleItems.length) active.add("schedule");
    if (forms.length) active.add("forms");
    if (volunteerSlots.length) active.add("volunteer");
    if (paymentItems.length) active.add("payments");
    if (reminders.length) active.add("reminders");
    if (checklistItems.length) active.add("checklist");
    return active;
  }, [
    checklistItems.length,
    forms.length,
    paymentItems.length,
    reminders.length,
    scheduleItems.length,
    seriesItems.length,
    volunteerSlots.length,
  ]);

  function updateDraft(patch: DraftRecord) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function updateOccurrence(index: number, patch: DraftRecord) {
    setDraft((current) => {
      if (!current) return current;
      const next = list(current.occurrences).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      );
      return { ...current, occurrences: next };
    });
  }

  async function createSession() {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Tell Envitefy what is happening first.");
      return;
    }
    setIsParsing(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/concierge/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: trimmed }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to create draft.");
      setDraft(json.draft);
      setSession(json.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create draft.");
    } finally {
      setIsParsing(false);
    }
  }

  async function applyDraft() {
    if (!session?.id || !draft) return;
    setIsApplying(true);
    setError(null);
    try {
      const response = await fetch(`/api/concierge/sessions/${session.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "Unable to publish draft.");
      setResult(json.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to publish draft.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6ff] text-slate-950">
      <section className="border-b border-violet-100/80 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.14),transparent_34%),linear-gradient(180deg,#ffffff,#f8f6ff)] px-4 py-8 sm:px-6 lg:py-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-700 shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Concierge V2
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Tell Envitefy what is happening.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Concierge turns messy event details into a guest page, schedule, RSVP board, forms,
              reminders, signup slots, and a planning checklist.
            </p>
          </div>
          <div className="rounded-2xl border border-white bg-white/88 p-4 shadow-[0_24px_80px_rgba(88,64,150,0.14)] backdrop-blur">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                Event brief
              </span>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={6}
                className="mt-3 min-h-36 w-full resize-none rounded-2xl border border-violet-100 bg-[#fbfaff] p-4 text-base font-semibold leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                placeholder="Describe the schedule, event, form, RSVP, reminders, and anything guests need to know."
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => setInput(example.prompt)}
                  className="rounded-full border border-violet-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
                >
                  {example.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void createSession()}
              disabled={isParsing}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isParsing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <WandSparkles className="h-4 w-4" aria-hidden="true" />}
              Review event draft
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:py-8">
        <div className="space-y-5">
          <SectionCard title="Detected mode" eyebrow="Concierge read" icon={MessageSquareText}>
            {draft ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-violet-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
                      Mode
                    </p>
                    <p className="mt-1 text-lg font-black capitalize">{clean(draft.mode)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Confidence
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {Math.round(Number(draft.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <TextInput
                    label="Page title"
                    value={clean(draft.title)}
                    onChange={(value) => updateDraft({ title: value })}
                  />
                  <TextInput
                    label="Timezone"
                    value={clean(draft.timezone) || "America/Chicago"}
                    onChange={(value) => updateDraft({ timezone: value })}
                  />
                </div>
                {missingFields.length ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-black text-amber-950">Still helpful to confirm</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {missingFields.map((field) => (
                        <span
                          key={field}
                          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-900"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Ready to create the event page.
                  </div>
                )}
              </div>
            ) : (
              <EmptyLine>Describe the event to see the detected mode, draft details, and what still needs confirmation.</EmptyLine>
            )}
          </SectionCard>

          <SectionCard title="Creation package" eyebrow="What will be built" icon={Sparkles}>
            <div className="grid grid-cols-2 gap-2">
              {CAPABILITY_CARDS.map((card) => {
                const Icon = card.icon;
                const active = activeCapabilities.has(card.key);
                return (
                  <div
                    key={card.key}
                    className={cn(
                      "rounded-xl border px-3 py-3",
                      active
                        ? "border-violet-100 bg-violet-50 text-violet-950"
                        : "border-slate-200 bg-slate-50 text-slate-400",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <p className="mt-2 text-sm font-black">{card.label}</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Feature flags" eyebrow="Workspace setup" icon={ClipboardCheck} muted>
            <div className="grid gap-2">
              {Object.entries(flags).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-slate-600">{key}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-black",
                      enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {enabled ? "On" : "Off"}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
              {error}
            </div>
          ) : null}

          {result ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-[0_18px_54px_rgba(16,185,129,0.12)]">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Ready to share
                  </p>
                  <h2 className="mt-1 text-xl font-black text-emerald-950">Public event page created.</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-900">
                    Created {result.occurrenceCount} schedule items, {result.formCount} form set,
                    {result.volunteerSlotCount} signup slots, {result.paymentRequestCount} payment
                    requests, {result.reminderCount} reminders, and {result.checklistCount}
                    checklist items.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={result.eventPath}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-emerald-800"
                >
                  View guest page
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/hub`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-sm font-black uppercase tracking-[0.14em] text-emerald-800 transition hover:bg-emerald-100"
                >
                  Hub
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/resources`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-sm font-black uppercase tracking-[0.14em] text-emerald-800 transition hover:bg-emerald-100"
                >
                  Setup
                  <Warehouse className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/imports`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-sm font-black uppercase tracking-[0.14em] text-emerald-800 transition hover:bg-emerald-100"
                >
                  Imports
                  <FileSearch className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/rsvp`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-sm font-black uppercase tracking-[0.14em] text-emerald-800 transition hover:bg-emerald-100"
                >
                  RSVP Board
                  <Users className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/ops`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-sm font-black uppercase tracking-[0.14em] text-emerald-800 transition hover:bg-emerald-100"
                >
                  Manage ops
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/schedule`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-sm font-black uppercase tracking-[0.14em] text-emerald-800 transition hover:bg-emerald-100"
                >
                  Schedule
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/calendar`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-sm font-black uppercase tracking-[0.14em] text-emerald-800 transition hover:bg-emerald-100"
                >
                  Calendar
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          ) : null}

          <SectionCard title="Schedule Hub" eyebrow="Agenda" icon={CalendarDays}>
            {seriesItems.length ? (
              <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 p-3">
                <p className="text-sm font-black text-violet-950">Recurring schedule</p>
                <div className="mt-2 grid gap-2">
                  {seriesItems.map((series, index) => (
                    <div key={`${series.title}-${index}`} className="text-sm font-semibold text-violet-900">
                      {clean(series.title)} at {clean(series.startTimeLocal) || "time to confirm"} -{" "}
                      {clean(series.recurrenceRule)}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {scheduleItems.length ? (
              <div className="grid gap-3">
                {scheduleItems.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-xl border border-slate-200 p-3">
                    <TextInput
                      label="Schedule title"
                      value={clean(item.title)}
                      onChange={(value) => updateOccurrence(index, { title: value })}
                    />
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <TextInput
                        label="When (ISO)"
                        value={clean(item.startAt)}
                        onChange={(value) => updateOccurrence(index, { startAt: value })}
                      />
                      <TextInput
                        label="Location"
                        value={clean(item.locationText)}
                        onChange={(value) => updateOccurrence(index, { locationText: value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyLine>No dated schedule items yet. You can still create the event page and fill them in later.</EmptyLine>
            )}
          </SectionCard>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard title="Smart Forms" eyebrow="Questions" icon={FileText}>
              {forms.length ? (
                <div className="space-y-3">
                  {forms.map((form, index) => (
                    <div key={`${form.title}-${index}`} className="rounded-xl bg-slate-50 p-3">
                      <p className="font-black">{clean(form.title)}</p>
                      <p className="mt-1 text-sm text-slate-600">{clean(form.description)}</p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        {list(form.fields).length} questions
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyLine>No form questions generated for this brief.</EmptyLine>
              )}
            </SectionCard>

            <SectionCard title="Volunteer Signup" eyebrow="Slots" icon={HeartHandshake}>
              {volunteerSlots.length ? (
                <div className="space-y-2">
                  {volunteerSlots.map((slot, index) => (
                    <div
                      key={`${slot.title}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                    >
                      <span>
                        <span className="block font-black">{clean(slot.title)}</span>
                        <span className="text-sm text-slate-500">{clean(slot.group)}</span>
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">
                        {Number(slot.quantityNeeded || 1)} needed
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyLine>No signup slots generated for this brief.</EmptyLine>
              )}
            </SectionCard>

            <SectionCard title="Payment Tracker" eyebrow="Manual" icon={WalletCards}>
              {paymentItems.length ? (
                <div className="space-y-2">
                  {paymentItems.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-xl bg-slate-50 p-3">
                      <p className="font-black">{clean(item.title)}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatCurrency(item.amountCents, item.currency)} - {clean(item.status) || "unpaid"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyLine>No payment requests generated. Manual tracking stays hidden.</EmptyLine>
              )}
            </SectionCard>

            <SectionCard title="Reminders" eyebrow="Timeline" icon={Bell}>
              {reminders.length ? (
                <div className="space-y-2">
                  {reminders.map((reminder, index) => (
                    <div key={`${reminder.title}-${index}`} className="rounded-xl bg-slate-50 p-3">
                      <p className="font-black">{clean(reminder.title)}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatDateTime(reminder.scheduledFor)} - {clean(reminder.channel) || "email"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyLine>No reminder dates yet. Add dates to generate a timeline.</EmptyLine>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Planning Checklist" eyebrow="Next actions" icon={ClipboardList}>
            {checklistItems.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {checklistItems.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-xl bg-slate-50 p-3">
                    <p className="font-black">{clean(item.title)}</p>
                    <p className="mt-1 text-sm text-slate-500">{clean(item.category)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyLine>The checklist will appear after Concierge understands the event type.</EmptyLine>
            )}
          </SectionCard>

          <div className="sticky bottom-0 z-20 -mx-4 border-t border-violet-100 bg-[#f8f6ff]/92 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <button
              type="button"
              onClick={() => void applyDraft()}
              disabled={!canApply}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-violet-700 px-5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_18px_40px_rgba(109,40,217,0.24)] transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {isApplying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              Create event page
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
