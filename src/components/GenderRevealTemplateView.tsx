"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { CalendarPlus, Check, Gift, MapPin } from "lucide-react";
import AppleCalendarLink from "@/components/AppleCalendarLink";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";
import StaticMap from "@/components/StaticMap";
import {
  areGenderRevealGuessesLocked,
  buildGenderRevealLiveStrip,
  buildGenderRevealRsvpAnswers,
  canGuestSeeGenderRevealTally,
  genderRevealGuessLabel,
  genderRevealMemoryLine,
  genderRevealResultLabel,
  isGenderRevealGuessRequired,
  parseGenderRevealConfig,
  parseGenderRevealRsvpAnswers,
  shouldCollectGenderRevealGuess,
  type GenderRevealConfig,
  type GenderRevealGuess,
  type GenderRevealGuessCounts,
  type GenderRevealLiveStrip,
} from "@/lib/gender-reveal";
import type { CalendarLinkSet } from "@/utils/calendar-links";

const DEFAULT_HERO_IMAGE = "/templates/hero-images/gender reveal-hero.jpeg";

type RsvpChoice = "yes" | "no" | "maybe";

type Props = {
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown>;
  shareUrl: string;
  isOwner: boolean;
  canEdit?: boolean;
  isReadOnly: boolean;
  editHref: string;
  calendarLinks?: CalendarLinkSet | null;
};

type RsvpStatsPayload = {
  yes: number;
  no: number;
  maybe: number;
  filled: number;
  remaining: number;
  numberOfGuests: number;
  guesses?: GenderRevealGuessCounts | null;
};

type OwnerRsvpRow = {
  name?: string | null;
  email?: string | null;
  response?: string | null;
  answersJson?: Record<string, unknown> | null;
  adultCount?: number | null;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: Date | null): string | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function GuessButton({
  guess,
  selected,
  onSelect,
  disabled,
}: {
  guess: GenderRevealGuess;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const isPink = guess === "pink";
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex-1 rounded-2xl border-2 px-4 py-4 text-left transition ${
        selected
          ? isPink
            ? "border-pink-400 bg-pink-50 shadow-sm"
            : "border-sky-400 bg-sky-50 shadow-sm"
          : "border-white/30 bg-white/10 hover:bg-white/20"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <div className={`text-sm font-black uppercase tracking-[0.18em] ${isPink ? "text-pink-600" : "text-sky-700"}`}>
        {genderRevealGuessLabel(guess)}
      </div>
      <p className="mt-1 text-sm opacity-70">{isPink ? "She's on the way." : "He's on the way."}</p>
    </button>
  );
}

function LiveStrip({
  strip,
  showGuesses,
  revealed,
  memoryLine,
}: {
  strip: GenderRevealLiveStrip;
  showGuesses: boolean;
  revealed: boolean;
  memoryLine: string;
}) {
  const chips = [
    { label: "coming", value: strip.coming },
    { label: "pending", value: strip.pending },
    ...(showGuesses ? [{ label: revealed ? "guesses" : "guesses", value: strip.guesses }] : []),
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-slate-800 shadow-sm"
        >
          <span className="tabular-nums">{chip.value}</span>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {chip.label}
          </span>
        </span>
      ))}
      {revealed && memoryLine ? (
        <span className="w-full text-center text-sm font-medium text-white/90 drop-shadow">
          {memoryLine}
        </span>
      ) : null}
    </div>
  );
}

function HostBar({
  config,
  stats,
  responses,
  onReveal,
  revealing,
}: {
  config: GenderRevealConfig;
  stats: RsvpStatsPayload;
  responses: OwnerRsvpRow[];
  onReveal: (result: GenderRevealGuess) => void;
  revealing: boolean;
}) {
  const guesses = stats.guesses || { pink: 0, blue: 0, total: 0 };
  const notGuessed = responses.filter((row) => {
    const response = String(row.response || "").toLowerCase();
    if (response === "no") return false;
    return !parseGenderRevealRsvpAnswers(row.answersJson).genderGuess;
  });
  const yesHeadcount = responses.reduce((sum, row) => {
    if (String(row.response || "").toLowerCase() !== "yes") return sum;
    const answers = parseGenderRevealRsvpAnswers(row.answersJson);
    return sum + (answers.partySize || (typeof row.adultCount === "number" && row.adultCount > 0 ? row.adultCount : 1));
  }, 0);

  return (
    <section className="mx-auto mb-4 w-full max-w-5xl rounded-[28px] border border-pink-100/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(79,70,128,0.12)] backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-pink-500">
            Host counts
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Same page, live operation</h2>
        </div>
        {!config.revealed && config.guessesEnabled ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={revealing}
              onClick={() => onReveal("pink")}
              className="rounded-full bg-pink-500 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white disabled:opacity-60"
            >
              Reveal girl
            </button>
            <button
              type="button"
              disabled={revealing}
              onClick={() => onReveal("blue")}
              className="rounded-full bg-sky-600 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white disabled:opacity-60"
            >
              Reveal boy
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <HostChip label="Coming" value={String(stats.yes)} tone="emerald" />
        <HostChip label="Declined" value={String(stats.no)} tone="rose" />
        <HostChip label="Pending" value={String(stats.remaining)} tone="amber" />
        <HostChip
          label="Team Pink vs Blue"
          value={`${guesses.pink} vs ${guesses.blue}`}
          tone="violet"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        {stats.numberOfGuests > 0 ? (
          <span className="rounded-full bg-slate-100 px-3 py-1">
            Headcount {yesHeadcount || stats.yes} / {stats.numberOfGuests}
          </span>
        ) : null}
        {notGuessed.length > 0 ? (
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {notGuessed.length} {notGuessed.length === 1 ? "guest has" : "guests have"} not guessed
          </span>
        ) : null}
        {stats.remaining > 0 ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
            Reminder: {stats.remaining} still pending
          </span>
        ) : null}
        <a href="#rsvp" className="rounded-full bg-slate-900 px-3 py-1 text-white">
          Jump to RSVP
        </a>
      </div>
    </section>
  );
}

function HostChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "amber" | "violet";
}) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    violet: "border-violet-100 bg-violet-50 text-violet-800",
  };
  return (
    <div className={`rounded-2xl border px-3 py-3 ${tones[tone]}`}>
      <div className="text-[0.65rem] font-black uppercase tracking-[0.16em] opacity-70">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function GenderRevealTemplateView({
  eventId,
  eventTitle,
  eventData,
  shareUrl,
  isOwner,
  canEdit: canEditProp,
  isReadOnly,
  editHref,
  calendarLinks,
}: Props) {
  const canEdit = canEditProp ?? isOwner;
  const config = useMemo(() => parseGenderRevealConfig(eventData), [eventData]);
  const [liveConfig, setLiveConfig] = useState(config);
  useEffect(() => {
    setLiveConfig(config);
  }, [config]);

  const [stats, setStats] = useState<RsvpStatsPayload>({
    yes: 0,
    no: 0,
    maybe: 0,
    filled: 0,
    remaining: 0,
    numberOfGuests: Number(eventData.numberOfGuests) || 0,
    guesses: { pink: 0, blue: 0, total: 0 },
  });
  const [responses, setResponses] = useState<OwnerRsvpRow[]>([]);
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [rsvpChoice, setRsvpChoice] = useState<RsvpChoice | null>(null);
  const [genderGuess, setGenderGuess] = useState<GenderRevealGuess | null>(null);
  const [giftNote, setGiftNote] = useState("");
  const [bringingGift, setBringingGift] = useState<boolean | null>(null);
  const [partySize, setPartySize] = useState("1");
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const refreshStats = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/rsvp?t=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) return;
    setStats({
      yes: Number(json.stats?.yes || 0),
      no: Number(json.stats?.no || 0),
      maybe: Number(json.stats?.maybe || 0),
      filled: Number(json.filled || 0),
      remaining: Number(json.remaining || 0),
      numberOfGuests: Number(json.numberOfGuests || eventData.numberOfGuests || 0),
      guesses: json.guesses || { pink: 0, blue: 0, total: 0 },
    });
    if (Array.isArray(json.responses)) setResponses(json.responses);
  }, [eventData.numberOfGuests, eventId]);

  useEffect(() => {
    void refreshStats();
    const onSubmit = () => {
      window.setTimeout(() => void refreshStats(), 400);
    };
    window.addEventListener("rsvp-submitted", onSubmit);
    const interval = window.setInterval(() => void refreshStats(), 60 * 1000);
    return () => {
      window.removeEventListener("rsvp-submitted", onSubmit);
      window.clearInterval(interval);
    };
  }, [refreshStats]);

  const savedTheme = asTheme(eventData.theme);
  const textClass = readString(savedTheme.text) || "text-slate-900";
  const accentClass = readString(savedTheme.accent) || "text-pink-600";
  const headingFont =
    readString(eventData.fontFamily) || readString(savedTheme.fontFamily) || "var(--font-playfair)";
  const heroImage =
    readString(eventData.heroImage) ||
    readString(eventData.customHeroImage) ||
    readString(asRecord(eventData.images)?.hero) ||
    DEFAULT_HERO_IMAGE;
  const parentsName = readString(eventData.parentsName) || readString(eventData.eventTitle);
  const hosts = Array.isArray(eventData.hosts) ? eventData.hosts : [];
  const gallery = Array.isArray(eventData.gallery) ? eventData.gallery : [];
  const registries = Array.isArray(eventData.registries) ? eventData.registries : [];
  const rsvpRecord = asRecord(eventData.rsvp);
  const rsvpEnabled =
    eventData.rsvpEnabled !== false &&
    (eventData.rsvpEnabled === true ||
      rsvpRecord?.isEnabled === true ||
      Boolean(eventData.rsvp) ||
      Boolean(eventData.rsvpDeadline));
  const rsvpDeadline =
    readString(eventData.rsvpDeadline) ||
    readString(rsvpRecord?.deadline) ||
    (typeof eventData.rsvp === "string" ? eventData.rsvp : "");
  const startIso = readString(eventData.startISO) || readString(eventData.start);
  const startDate = startIso
    ? new Date(startIso)
    : eventData.date
      ? new Date(`${String(eventData.date)}T${readString(eventData.time) || "14:00"}:00`)
      : null;
  const dateLabel = startDate ? formatDate(startDate.toISOString()) : formatDate(readString(eventData.date));
  const timeLabel = formatTime(startDate) || readString(eventData.time) || null;
  const locationLabel = [
    readString(eventData.address),
    readString(eventData.venue),
    readString(eventData.city),
    readString(eventData.state),
    readString(eventData.location),
  ]
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(", ");
  const notes =
    readString(asRecord(eventData.eventDetails)?.notes) || readString(eventData.description);
  const expectingDate =
    readString(asRecord(eventData.eventDetails)?.expectingDate) ||
    readString(asRecord(eventData.babyDetails)?.expectingDate);
  const guessesLocked = areGenderRevealGuessesLocked(liveConfig, rsvpDeadline);
  const collectGuess = shouldCollectGenderRevealGuess({
    config: liveConfig,
    response: rsvpChoice,
    deadline: rsvpDeadline,
  });
  const guessRequired = isGenderRevealGuessRequired({
    config: liveConfig,
    response: rsvpChoice,
    deadline: rsvpDeadline,
  });
  const showGuestTally = canGuestSeeGenderRevealTally(liveConfig);
  const strip = buildGenderRevealLiveStrip({
    yes: stats.yes,
    filled: stats.filled,
    numberOfGuests: stats.numberOfGuests,
    guesses: stats.guesses?.total || 0,
  });
  const memoryLine = genderRevealMemoryLine({
    config: liveConfig,
    counts: stats.guesses || { pink: 0, blue: 0, total: 0 },
  });
  const revealed = liveConfig.revealed && liveConfig.revealedResult;
  const overlayClass = revealed
    ? liveConfig.revealedResult === "pink"
      ? "from-pink-700/55 via-pink-500/35 to-rose-900/55"
      : "from-sky-800/55 via-sky-500/35 to-indigo-900/55"
    : "from-[#2b1748]/45 via-pink-500/25 to-sky-700/40";

  const detailItems = [
    liveConfig.revealMethod ? { label: "Reveal", value: liveConfig.revealMethod } : null,
    liveConfig.dressCode ? { label: "Dress", value: liveConfig.dressCode } : null,
    liveConfig.parking ? { label: "Parking", value: liveConfig.parking } : null,
    liveConfig.virtualOption ? { label: "Virtual", value: liveConfig.virtualOption } : null,
    expectingDate ? { label: "Due date", value: formatDate(expectingDate) || expectingDate } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const updateItems = [
    liveConfig.rainPlan ? { label: "Rain plan", value: liveConfig.rainPlan } : null,
    liveConfig.spoilersNote ? { label: "Don't spoil it", value: liveConfig.spoilersNote } : null,
    notes ? { label: "Notes", value: notes } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  async function handleReveal(result: GenderRevealGuess) {
    setRevealing(true);
    try {
      const nextConfig = {
        ...liveConfig,
        revealed: true,
        revealedResult: result,
        revealedAt: new Date().toISOString(),
      };
      const res = await fetch(`/api/history/${eventId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { genderReveal: nextConfig } }),
      });
      if (!res.ok) throw new Error("Could not update the reveal.");
      setLiveConfig(nextConfig);
      await refreshStats();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not update the reveal.");
    } finally {
      setRevealing(false);
    }
  }

  async function handleRsvpSubmit(event: FormEvent) {
    event.preventDefault();
    if (!rsvpChoice) {
      setRsvpError("Please choose if you are coming.");
      return;
    }
    if (!rsvpName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rsvpEmail.trim())) {
      setRsvpError("Name and a valid email are required.");
      return;
    }
    if (guessRequired && !genderGuess) {
      setRsvpError("Team Pink or Team Blue?");
      return;
    }
    setRsvpSubmitting(true);
    setRsvpError(null);
    try {
      const answersJson = buildGenderRevealRsvpAnswers({
        genderGuess: collectGuess ? genderGuess : null,
        giftNote,
        bringingGift,
        partySize: rsvpChoice === "yes" ? partySize : null,
      });
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: rsvpChoice,
          name: rsvpName.trim(),
          email: rsvpEmail.trim(),
          message: giftNote.trim() || undefined,
          answersJson,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setRsvpError(json?.error || "Could not save your RSVP.");
        return;
      }
      try {
        localStorage.setItem("envitefy_rsvp_guest_info", JSON.stringify({
          name: rsvpName.trim(),
          email: rsvpEmail.trim(),
        }));
        localStorage.setItem(`envitefy_rsvp_${eventId}`, rsvpChoice);
      } catch {
        // ignore storage failures
      }
      window.dispatchEvent(
        new CustomEvent("rsvp-submitted", { detail: { eventId, response: rsvpChoice } }),
      );
      setRsvpSubmitted(true);
      await refreshStats();
    } catch {
      setRsvpError("Could not save your RSVP.");
    } finally {
      setRsvpSubmitting(false);
    }
  }

  const titleStyle: CSSProperties = { fontFamily: headingFont };

  return (
    <main className="event-modern-page font-sans text-slate-900">
      <div className="event-modern-container">
        <div className="mx-auto flex w-full max-w-5xl flex-col py-6 md:py-10">
          {isOwner && !isReadOnly ? (
            <HostBar
              config={liveConfig}
              stats={stats}
              responses={responses}
              onReveal={handleReveal}
              revealing={revealing}
            />
          ) : null}

          <div className={`relative overflow-hidden rounded-[32px] shadow-[0_35px_120px_rgba(15,23,42,0.25)] ${textClass}`}>
            <section className="relative min-h-[520px] overflow-hidden">
              <img
                src={heroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${overlayClass}`} />
              {!revealed ? (
                <div className="pointer-events-none absolute inset-0 flex">
                  <div className="w-1/2 bg-pink-400/15" />
                  <div className="w-1/2 bg-sky-400/15" />
                </div>
              ) : null}

              <div className="relative z-10 flex min-h-[520px] flex-col justify-between px-6 py-8 text-white md:px-10 md:py-12">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/80">
                    {revealed
                      ? `It's a ${genderRevealResultLabel(liveConfig.revealedResult)}`
                      : "He or she?"}
                  </p>
                  {!isReadOnly && (canEdit || isOwner) ? (
                    <div className="flex items-center gap-2">
                      {canEdit ? (
                        <Link
                          href={editHref}
                          className="rounded-full border border-white/50 bg-white/85 px-4 py-1.5 text-sm font-semibold text-slate-800"
                        >
                          Edit
                        </Link>
                      ) : null}
                      {isOwner ? <EventDeleteModal eventId={eventId} eventTitle={eventTitle} /> : null}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 text-center">
                  <h1 className="text-4xl font-semibold leading-tight md:text-6xl" style={titleStyle}>
                    {eventTitle}
                  </h1>
                  {parentsName ? (
                    <p className="text-lg font-medium text-white/90 md:text-2xl">{parentsName}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold uppercase tracking-[0.22em] text-white/85">
                    {dateLabel ? <span>{dateLabel}</span> : null}
                    {timeLabel ? <span>{timeLabel}</span> : null}
                    {locationLabel ? <span>{locationLabel}</span> : null}
                  </div>
                  <LiveStrip
                    strip={strip}
                    showGuesses={showGuestTally || isOwner}
                    revealed={Boolean(revealed)}
                    memoryLine={memoryLine}
                  />
                </div>

                <div className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                  {rsvpEnabled ? (
                    <a
                      href="#rsvp"
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-5 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-slate-900"
                    >
                      RSVP
                    </a>
                  ) : null}
                  {calendarLinks ? (
                    <div className="relative flex-1">
                      <button
                        type="button"
                        onClick={() => setCalendarOpen((open) => !open)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/15 px-5 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-white backdrop-blur"
                      >
                        <CalendarPlus size={16} />
                        Add to calendar
                      </button>
                      {calendarOpen ? (
                        <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-2xl bg-white text-slate-800 shadow-xl">
                          <AppleCalendarLink
                            href={calendarLinks.appleInline}
                            className="block px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                          >
                            Apple Calendar
                          </AppleCalendarLink>
                          <a
                            href={calendarLinks.google}
                            target="_blank"
                            rel="noreferrer"
                            className="block px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                          >
                            Google Calendar
                          </a>
                          <a
                            href={calendarLinks.outlook}
                            target="_blank"
                            rel="noreferrer"
                            className="block px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                          >
                            Outlook
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            {detailItems.length > 0 ? (
              <section id="details" className="border-t border-white/10 px-6 py-10 md:px-10">
                <h2 className={`mb-6 text-center text-2xl ${accentClass}`} style={titleStyle}>
                  Details
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {detailItems.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/40 p-4">
                      <div className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                        {item.label}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-base font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {hosts.length > 0 ? (
              <section id="hosts" className="border-t border-white/10 px-6 py-10 text-center md:px-10">
                <h2 className={`mb-6 text-2xl ${accentClass}`} style={titleStyle}>
                  Hosted by
                </h2>
                <div className="flex flex-wrap justify-center gap-6">
                  {hosts.map((host: { id?: string; name?: string; role?: string }) => (
                    <div key={host.id || host.name}>
                      <div className="text-lg font-semibold">{host.name}</div>
                      {host.role ? <div className="text-sm opacity-70">{host.role}</div> : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {registries.length > 0 ? (
              <section id="registry" className="border-t border-white/10 px-6 py-10 text-center md:px-10">
                <h2 className={`mb-6 text-2xl ${accentClass}`} style={titleStyle}>
                  Registry / gifts
                </h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {registries.map((registry: { id?: string; label?: string; url?: string }, idx: number) => (
                    <a
                      key={registry.id || idx}
                      href={registry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-current/20 px-5 py-2.5 text-sm font-semibold"
                    >
                      <Gift size={16} />
                      {registry.label || "Registry"}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {locationLabel ? (
              <section id="map" className="border-t border-white/10 px-6 py-10 md:px-10">
                <h2 className={`mb-4 text-center text-2xl ${accentClass}`} style={titleStyle}>
                  Map + calendar
                </h2>
                <p className="mb-4 flex items-center justify-center gap-2 text-center opacity-80">
                  <MapPin size={16} />
                  {locationLabel}
                </p>
                <StaticMap address={locationLabel} height={320} className="mx-auto max-w-3xl" />
              </section>
            ) : null}

            {gallery.length > 0 ? (
              <section id="photos" className="border-t border-white/10 px-6 py-10 md:px-10">
                <h2 className={`mb-6 text-center text-2xl ${accentClass}`} style={titleStyle}>
                  Photos
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {gallery.map((item: unknown, idx: number) => {
                    const record =
                      item && typeof item === "object" ? (item as Record<string, unknown>) : null;
                    const url = typeof item === "string" ? item : readString(record?.url);
                    if (!url) return null;
                    const caption = readString(record?.caption) || "Reveal photo";
                    const key = readString(record?.id) || url || String(idx);
                    return (
                      <figure key={key} className="overflow-hidden rounded-2xl">
                        <img src={url} alt={caption} className="h-44 w-full object-cover" />
                      </figure>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {updateItems.length > 0 ? (
              <section id="updates" className="border-t border-white/10 px-6 py-10 md:px-10">
                <h2 className={`mb-6 text-center text-2xl ${accentClass}`} style={titleStyle}>
                  Updates
                </h2>
                <div className="mx-auto max-w-2xl space-y-4">
                  {updateItems.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/40 p-4">
                      <div className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                        {item.label}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {rsvpEnabled ? (
              <section id="rsvp" className="scroll-mt-24 border-t border-white/10 px-6 py-10 md:px-10">
                <h2 className={`mb-6 text-center text-2xl ${accentClass}`} style={titleStyle}>
                  RSVP
                </h2>
                <form
                  onSubmit={handleRsvpSubmit}
                  className="mx-auto max-w-2xl space-y-5 rounded-3xl bg-white/50 p-6 md:p-8"
                >
                  {rsvpSubmitted ? (
                    <div className="py-10 text-center">
                      <div className="mb-3 text-4xl">🎉</div>
                      <h3 className="text-2xl font-semibold">You are on the list</h3>
                      <p className="mt-2 opacity-70">
                        {rsvpChoice === "yes" && genderGuess
                          ? `${genderRevealGuessLabel(genderGuess)} is locked in.`
                          : "Thanks for letting us know."}
                      </p>
                      <button
                        type="button"
                        className="mt-6 text-sm underline opacity-60"
                        onClick={() => setRsvpSubmitted(false)}
                      >
                        Update your response
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-center opacity-80">
                        {rsvpDeadline
                          ? `Kindly respond by ${formatDate(rsvpDeadline) || rsvpDeadline}`
                          : "Please RSVP"}
                      </p>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider opacity-70">
                          Full name
                        </span>
                        <input
                          value={rsvpName}
                          onChange={(event) => setRsvpName(event.target.value)}
                          className="w-full rounded-xl border border-current/20 bg-white/70 p-3 outline-none"
                          placeholder="Guest name"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider opacity-70">
                          Email
                        </span>
                        <input
                          type="email"
                          value={rsvpEmail}
                          onChange={(event) => setRsvpEmail(event.target.value)}
                          className="w-full rounded-xl border border-current/20 bg-white/70 p-3 outline-none"
                          placeholder="you@email.com"
                        />
                      </label>
                      <div>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider opacity-70">
                          Will you be there?
                        </span>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(
                            [
                              ["yes", "Yes"],
                              ["maybe", "Maybe"],
                              ["no", "No"],
                            ] as Array<[RsvpChoice, string]>
                          ).map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setRsvpChoice(value);
                                if (value === "no") setGenderGuess(null);
                              }}
                              className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold ${
                                rsvpChoice === value
                                  ? "border-current bg-white"
                                  : "border-current/20 bg-white/40"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {rsvpChoice === "yes" ? (
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider opacity-70">
                            Party size
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={partySize}
                            onChange={(event) => setPartySize(event.target.value)}
                            className="w-full rounded-xl border border-current/20 bg-white/70 p-3 outline-none"
                          />
                        </label>
                      ) : null}
                      {collectGuess ? (
                        <div>
                          <span className="mb-2 block text-xs font-bold uppercase tracking-wider opacity-70">
                            {guessRequired ? "Team Pink or Team Blue?" : "Want to guess? (optional)"}
                          </span>
                          <div className="flex gap-3">
                            <GuessButton
                              guess="pink"
                              selected={genderGuess === "pink"}
                              onSelect={() => setGenderGuess("pink")}
                              disabled={guessesLocked}
                            />
                            <GuessButton
                              guess="blue"
                              selected={genderGuess === "blue"}
                              onSelect={() => setGenderGuess("blue")}
                              disabled={guessesLocked}
                            />
                          </div>
                          {guessesLocked ? (
                            <p className="mt-2 text-xs opacity-60">Guesses are locked.</p>
                          ) : null}
                        </div>
                      ) : null}
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider opacity-70">
                          {rsvpChoice === "no" ? "Gift note (optional)" : "Bringing a gift?"}
                        </span>
                        {rsvpChoice !== "no" ? (
                          <div className="mb-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setBringingGift(true)}
                              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                bringingGift === true ? "bg-slate-900 text-white" : "bg-white/70"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setBringingGift(false)}
                              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                bringingGift === false ? "bg-slate-900 text-white" : "bg-white/70"
                              }`}
                            >
                              Not this time
                            </button>
                          </div>
                        ) : null}
                        <textarea
                          value={giftNote}
                          onChange={(event) => setGiftNote(event.target.value)}
                          className="w-full rounded-xl border border-current/20 bg-white/70 p-3 outline-none"
                          rows={3}
                          placeholder={
                            rsvpChoice === "no"
                              ? "Send a note even if you cannot make it."
                              : "Optional gift note"
                          }
                        />
                      </label>
                      {rsvpError ? (
                        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                          {rsvpError}
                        </p>
                      ) : null}
                      <button
                        type="submit"
                        disabled={rsvpSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-4 text-sm font-black uppercase tracking-[0.18em] text-white disabled:opacity-60"
                      >
                        <Check size={16} />
                        {rsvpSubmitting ? "Saving..." : "Send RSVP"}
                      </button>
                    </>
                  )}
                </form>
              </section>
            ) : null}

            <footer className="border-t border-white/10 px-6 py-8 text-center text-xs uppercase tracking-[0.28em] opacity-60">
              <p>Powered by Envitefy</p>
              <p>Create. Share. Enjoy.</p>
            </footer>
          </div>
        </div>
      </div>

      {!isReadOnly ? (
        <div className="event-modern-mobile-bar md:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            {rsvpEnabled ? (
              <a
                href="#rsvp"
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                RSVP
              </a>
            ) : null}
            {canEdit ? (
              <Link
                href={editHref}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Edit
              </Link>
            ) : null}
            {isOwner ? <EventDeleteModal eventId={eventId} eventTitle={eventTitle} /> : null}
            <div className="min-w-0 flex-1">
              <EventActions
                shareUrl={shareUrl}
                event={eventData as never}
                calendarTitle={eventTitle}
                historyId={eventId}
                className="w-full justify-center"
                variant="compact"
                tone={"default" as never}
                showCalendar={false}
                showEmail={false}
              />
            </div>
          </div>
        </div>
      ) : null}
      {!isReadOnly ? <div className="event-modern-mobile-spacer md:hidden" /> : null}
    </main>
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asTheme(value: unknown): Record<string, string> {
  const record = asRecord(value) || {};
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === "string") out[key] = item;
  }
  return out;
}
