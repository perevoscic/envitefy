"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  Lightbulb,
  MapPin,
  Sparkles,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";
import type { BirthdayExperienceProfile } from "@/data/birthday-experience-profiles.mjs";
import { attachAmazonAffiliateTag } from "@/lib/affiliate/amazon";
import { formatMonthDayOrdinalEn } from "@/utils/format-month-day-ordinal";
import { getRegistrySectionCopyForCategory } from "@/utils/registry-links";

type ExperienceTheme = {
  colors: { primary: string; secondary: string };
  fonts: { headline: string; body?: string };
  experience: BirthdayExperienceProfile;
};

type ExperienceEvent = {
  headlineTitle?: string;
  date?: string;
  end?: string;
  story?: string;
  thingsToDo?: string;
  goodToKnow?: string;
  birthdayName?: string;
  age?: number | string;
  schedule?: Array<{ title: string; time?: string; location?: string }>;
  gallery?: string[];
  hosts?: Array<{ name?: string; email?: string; phone?: string }>;
  registry?: Array<{ label?: string; url: string }>;
  registries?: Array<{ label?: string; url: string }>;
  party?: { theme?: string; activities?: string; notes?: string };
  partyDetails?: { theme?: string; activities?: string; notes?: string };
  rsvpEnabled?: boolean;
  rsvpDeadline?: string;
};

type BirthdayExperienceBodyProps = {
  theme: ExperienceTheme;
  event: ExperienceEvent;
  userRsvpResponse?: string | null;
  onRsvpClick?: () => void;
};

type Fact = { label: string; value: string };

const registryCopy = getRegistrySectionCopyForCategory("birthdays");

const SURFACE_CLASSES: Record<string, string> = {
  paper: "border border-black/10 bg-white/82 shadow-[0_16px_45px_rgba(15,23,42,0.08)]",
  glass: "border border-white/35 bg-white/58 shadow-xl backdrop-blur-xl",
  ink: "border border-white/10 bg-[var(--birthday-body-ink)] text-[var(--birthday-body-bg)] shadow-2xl",
  canvas: "border-2 border-[var(--birthday-body-ink)]/25 bg-white/68",
  outlined: "border-2 border-[var(--birthday-body-accent)] bg-transparent",
  soft: "border border-white/40 bg-white/48 shadow-sm",
  metallic: "border border-white/35 bg-[linear-gradient(135deg,rgba(255,255,255,.86),rgba(255,255,255,.42))] shadow-xl",
  neon: "border border-[var(--birthday-body-accent)]/55 bg-black/82 text-white shadow-[0_0_34px_var(--birthday-body-accent-soft)]",
};

const FACT_WRAPPER_CLASSES: Record<string, string> = {
  "index-cards": "grid grid-cols-2 gap-3 md:grid-cols-4",
  "ticker-tape": "flex snap-x gap-0 overflow-x-auto border-y-2 border-[var(--birthday-body-ink)]",
  "numbered-rail": "grid gap-0 border-l-4 border-[var(--birthday-body-accent)] md:grid-cols-4",
  "party-seals": "flex flex-wrap justify-center gap-4",
  "ticket-stubs": "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
  "score-cells": "grid grid-cols-2 gap-px overflow-hidden border-2 border-[var(--birthday-body-ink)] bg-[var(--birthday-body-ink)] md:grid-cols-4",
  "taped-notes": "grid grid-cols-2 gap-5 md:grid-cols-4",
  "editorial-columns": "grid divide-y border-y border-[var(--birthday-body-ink)]/25 md:grid-cols-4 md:divide-x md:divide-y-0",
  "menu-lines": "grid gap-2 md:grid-cols-2",
  "postage-marks": "flex flex-wrap items-center justify-around gap-5",
  "chapter-tabs": "grid gap-2 sm:grid-cols-2 lg:grid-cols-4",
  "orbit-nodes": "grid grid-cols-2 gap-5 md:grid-cols-4",
  "ribbon-labels": "grid gap-2 md:grid-cols-4",
};

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (date.getHours() === 0 && date.getMinutes() === 0) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatEventTime(start?: string, end?: string) {
  const startTime = formatTime(start);
  const endTime = formatTime(end);
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  return startTime || endTime;
}

function formatAge(age?: number | string) {
  if (age === undefined || age === null || age === "") return "";
  const value = typeof age === "string" ? Number.parseInt(age, 10) : age;
  if (Number.isNaN(value)) return String(age);
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) return `${value}st`;
  if (lastDigit === 2 && lastTwoDigits !== 12) return `${value}nd`;
  if (lastDigit === 3 && lastTwoDigits !== 13) return `${value}rd`;
  return `${value}th`;
}

function StoryCard({
  title,
  children,
  icon,
  profile,
  className = "",
}: {
  title: string;
  children: ReactNode;
  icon: ReactNode;
  profile: BirthdayExperienceProfile;
  className?: string;
}) {
  const headingColorClass =
    profile.surface === "ink"
      ? "text-[var(--birthday-body-bg)]"
      : "text-[var(--birthday-body-accent)]";

  return (
    <section
      data-birthday-body-card={title}
      className={`rounded-[1.75rem] p-6 sm:p-8 ${SURFACE_CLASSES[profile.surface] || SURFACE_CLASSES.paper} ${className}`}
    >
      <div className={`mb-4 flex items-center gap-3 ${headingColorClass}`}>
        {icon}
        <h2
          className="text-2xl font-bold leading-none sm:text-3xl"
          style={{ fontFamily: "var(--birthday-body-headline)" }}
        >
          {title}
        </h2>
      </div>
      <div className="text-base leading-relaxed opacity-82 sm:text-lg">{children}</div>
    </section>
  );
}

function ExperienceFacts({ facts, treatment }: { facts: Fact[]; treatment: string }) {
  if (facts.length === 0) return null;

  return (
    <section
      data-birthday-fact-treatment={treatment}
      className={FACT_WRAPPER_CLASSES[treatment] || FACT_WRAPPER_CLASSES["index-cards"]}
      aria-label="Party at a glance"
    >
      {facts.map((fact, index) => {
        const shared = (
          <>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-52">
              {fact.label}
            </span>
            <strong
              className="mt-1 block text-base leading-tight text-[var(--birthday-body-accent)] sm:text-lg"
              style={{ fontFamily: "var(--birthday-body-headline)" }}
            >
              {fact.value}
            </strong>
          </>
        );

        if (treatment === "party-seals" || treatment === "orbit-nodes") {
          return (
            <div
              key={`${fact.label}-${fact.value}`}
              className="flex aspect-square w-36 flex-col items-center justify-center rounded-full border-2 border-[var(--birthday-body-accent)] bg-white/72 p-4 text-center shadow-lg"
            >
              {shared}
            </div>
          );
        }
        if (treatment === "ticket-stubs") {
          return (
            <div
              key={`${fact.label}-${fact.value}`}
              className="relative border-2 border-dashed border-[var(--birthday-body-ink)]/35 bg-white/72 p-5 before:absolute before:-left-2 before:top-1/2 before:h-4 before:w-4 before:-translate-y-1/2 before:rounded-full before:bg-[var(--birthday-body-bg)] after:absolute after:-right-2 after:top-1/2 after:h-4 after:w-4 after:-translate-y-1/2 after:rounded-full after:bg-[var(--birthday-body-bg)]"
            >
              {shared}
            </div>
          );
        }
        if (treatment === "score-cells") {
          return (
            <div
              key={`${fact.label}-${fact.value}`}
              className="bg-[var(--birthday-body-bg)] p-5 text-center"
            >
              <span className="mb-2 block font-mono text-xs opacity-55">0{index + 1}</span>
              {shared}
            </div>
          );
        }
        if (treatment === "taped-notes") {
          return (
            <div
              key={`${fact.label}-${fact.value}`}
              className={`${index % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"} relative bg-white/82 p-5 text-center shadow-lg before:absolute before:-top-2 before:left-1/2 before:h-5 before:w-16 before:-translate-x-1/2 before:rotate-[-2deg] before:bg-[var(--birthday-body-accent)]/24`}
            >
              {shared}
            </div>
          );
        }
        if (treatment === "menu-lines") {
          return (
            <div
              key={`${fact.label}-${fact.value}`}
              className="flex items-end gap-3 border-b border-dotted border-[var(--birthday-body-ink)]/35 py-3"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-55">
                {fact.label}
              </span>
              <span className="mb-1 flex-1 border-b border-dotted border-[var(--birthday-body-ink)]/25" />
              <strong className="text-right text-[var(--birthday-body-accent)]">{fact.value}</strong>
            </div>
          );
        }
        if (treatment === "postage-marks") {
          return (
            <div
              key={`${fact.label}-${fact.value}`}
              className="flex min-h-32 w-40 rotate-[-2deg] flex-col items-center justify-center border-4 border-double border-[var(--birthday-body-accent)] bg-white/60 p-4 text-center uppercase"
            >
              {shared}
            </div>
          );
        }
        if (treatment === "chapter-tabs") {
          return (
            <div
              key={`${fact.label}-${fact.value}`}
              className="border-l-8 border-[var(--birthday-body-accent)] bg-white/66 p-4"
            >
              <span className="mb-2 block text-xs font-black">CH. {String(index + 1).padStart(2, "0")}</span>
              {shared}
            </div>
          );
        }
        if (treatment === "ribbon-labels") {
          return (
            <div
              key={`${fact.label}-${fact.value}`}
              className={`${index % 2 === 0 ? "md:-skew-x-3" : "md:skew-x-3"} bg-[var(--birthday-body-accent)] px-5 py-4 text-center text-white shadow-md`}
            >
              <div className={index % 2 === 0 ? "md:skew-x-3" : "md:-skew-x-3"}>{shared}</div>
            </div>
          );
        }

        return (
          <div
            key={`${fact.label}-${fact.value}`}
            className={`${treatment === "ticker-tape" ? "min-w-52 flex-1 snap-start border-r-2 border-[var(--birthday-body-ink)] px-6 py-4" : treatment === "numbered-rail" ? "border-b border-[var(--birthday-body-ink)]/15 p-5 md:border-b-0" : treatment === "editorial-columns" ? "p-5" : "rounded-2xl border border-white/35 bg-white/68 p-5 text-center shadow-sm"}`}
          >
            {treatment === "numbered-rail" ? (
              <span className="mb-2 block font-mono text-xs opacity-45">{String(index + 1).padStart(2, "0")}</span>
            ) : null}
            {shared}
          </div>
        );
      })}
    </section>
  );
}

function ExperienceGallery({ photos, treatment }: { photos: string[]; treatment: string }) {
  if (photos.length === 0) return null;

  const imageClass =
    treatment === "orbit-circles"
      ? "aspect-square rounded-full"
      : treatment === "arched-triptych"
        ? "aspect-[4/5] rounded-t-[999px] rounded-b-2xl"
        : treatment === "cinema-strip"
          ? "aspect-[4/3] rounded-sm border-y-[12px] border-black"
          : treatment === "postcard-stack"
            ? "aspect-[4/3] rounded-sm border-[10px] border-white border-b-[28px]"
            : "aspect-square rounded-2xl";

  return (
    <section data-birthday-gallery-treatment={treatment} className="py-4">
      <div className="mb-7 flex items-center gap-3">
        <Camera className="h-6 w-6 text-[var(--birthday-body-accent)]" aria-hidden="true" />
        <h2
          className="text-2xl font-bold sm:text-3xl"
          style={{ fontFamily: "var(--birthday-body-headline)" }}
        >
          Birthday memories
        </h2>
      </div>
      <div
        className={
          treatment === "full-bleed-wall"
            ? "grid grid-cols-2 gap-0 overflow-hidden md:grid-cols-3"
            : treatment === "editorial-mosaic"
              ? "grid auto-rows-[150px] grid-cols-2 gap-3 md:grid-cols-4 [&>*:first-child]:col-span-2 [&>*:first-child]:row-span-2"
              : treatment === "comic-grid"
                ? "grid grid-cols-2 gap-2 border-4 border-[var(--birthday-body-ink)] bg-[var(--birthday-body-ink)] md:grid-cols-3"
                : "flex flex-wrap items-center justify-center gap-4"
        }
      >
        {photos.map((photo, index) => (
          <figure
            key={`${photo}-${index}`}
            className={`${imageClass} ${treatment === "polaroid-scatter" || treatment === "postcard-stack" ? (index % 2 === 0 ? "rotate-[-2deg]" : "rotate-[2deg]") : ""} ${treatment === "full-bleed-wall" || treatment === "comic-grid" || treatment === "editorial-mosaic" ? "w-full" : "w-44 sm:w-52"} overflow-hidden bg-white shadow-xl`}
          >
            <img
              src={photo}
              alt={`Birthday memory ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transition-none"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}

function ExperienceHosts({
  hosts,
  treatment,
}: {
  hosts: NonNullable<ExperienceEvent["hosts"]>;
  treatment: string;
}) {
  if (hosts.length === 0) return null;
  const wrapperClass: Record<string, string> = {
    "signature-line": "flex flex-wrap justify-center gap-4 border-y border-[var(--birthday-body-ink)]/18 py-7",
    "host-badges": "flex flex-wrap justify-center gap-4",
    "calling-card": "grid gap-4 sm:grid-cols-2",
    "credit-roll": "space-y-2 border-l-4 border-[var(--birthday-body-accent)] pl-6",
    "ticket-holders": "grid gap-3 sm:grid-cols-2",
    "editorial-byline": "flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t-2 border-[var(--birthday-body-ink)] pt-4",
    "portrait-labels": "flex flex-wrap justify-center gap-5",
    "ribbon-names": "flex flex-wrap justify-center gap-2",
  };

  return (
    <section data-birthday-host-treatment={treatment}>
      <div className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] opacity-55">
        <Heart className="h-4 w-4" aria-hidden="true" /> Hosted with care
      </div>
      <div className={wrapperClass[treatment] || wrapperClass["signature-line"]}>
        {hosts.map((host, index) => (
          <div
            key={`${host.name || "Host"}-${index}`}
            className={`${treatment === "host-badges" || treatment === "portrait-labels" ? "rounded-full" : treatment === "ticket-holders" ? "border-2 border-dashed" : "border"} border-[var(--birthday-body-ink)]/15 bg-white/66 px-6 py-4 shadow-sm`}
          >
            <p
              className="text-lg font-bold text-[var(--birthday-body-accent)]"
              style={{ fontFamily: "var(--birthday-body-headline)" }}
            >
              {host.name || "Your host"}
            </p>
            {host.email || host.phone ? (
              <p className="mt-1 text-xs opacity-60">{[host.email, host.phone].filter(Boolean).join(" · ")}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ExperienceSchedule({
  items,
  treatment,
}: {
  items: NonNullable<ExperienceEvent["schedule"]>;
  treatment: string;
}) {
  if (items.length === 0) return null;
  return (
    <section data-birthday-schedule-treatment={treatment} className="py-4">
      <div className="mb-6 flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-[var(--birthday-body-accent)]" aria-hidden="true" />
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--birthday-body-headline)" }}>
          Run of celebration
        </h2>
      </div>
      <div
        className={
          treatment === "stepped-times"
            ? "space-y-3"
            : treatment === "route-stops"
              ? "grid gap-5 border-l-4 border-dotted border-[var(--birthday-body-accent)] pl-6"
              : treatment === "scoreboard-periods"
                ? "grid gap-px overflow-hidden border-2 border-[var(--birthday-body-ink)] bg-[var(--birthday-body-ink)] sm:grid-cols-2"
                : "grid gap-4 sm:grid-cols-2"
        }
      >
        {items.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            className={`${treatment === "scoreboard-periods" ? "rounded-none" : treatment === "stepped-times" && index % 2 ? "sm:ml-12" : "rounded-2xl"} bg-white/68 p-5 shadow-sm`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold">{item.title}</h3>
              {item.time ? (
                <span className="flex items-center gap-1 text-xs font-black text-[var(--birthday-body-accent)]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {item.time}
                </span>
              ) : null}
            </div>
            {item.location ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm opacity-62">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {item.location}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function ExperienceRegistry({
  registries,
}: {
  registries: Array<{ label?: string; url: string }>;
}) {
  if (registries.length === 0) return null;
  return (
    <section className="border-t border-[var(--birthday-body-ink)]/15 pt-7 text-center">
      <h2 className="mb-5 text-sm font-black uppercase tracking-[0.18em] opacity-55">
        {registryCopy.sectionLabel}
      </h2>
      <div className="flex flex-wrap justify-center gap-3">
        {registries.map((registry, index) => (
          <a
            key={`${registry.url}-${index}`}
            href={attachAmazonAffiliateTag(registry.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--birthday-body-ink)]/15 bg-white/72 px-5 py-3 text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--birthday-body-accent)] motion-reduce:transition-none"
          >
            <Gift className="h-4 w-4" aria-hidden="true" />
            {registry.label || registryCopy.itemFallbackLabel}
          </a>
        ))}
      </div>
    </section>
  );
}

function ExperienceRsvp({
  enabled,
  response,
  deadline,
  onRsvpClick,
}: {
  enabled?: boolean;
  response?: string | null;
  deadline?: string;
  onRsvpClick?: () => void;
}) {
  if (!enabled) return null;
  if (response) {
    const Icon = response === "yes" ? CheckCircle2 : response === "no" ? XCircle : HelpCircle;
    return (
      <section className="text-center">
        <div className="inline-flex items-center gap-3 border-2 border-[var(--birthday-body-accent)] bg-white/65 px-7 py-4 shadow-lg">
          <Icon className="h-6 w-6" aria-hidden="true" />
          <strong className="text-lg text-[var(--birthday-body-accent)]">
            {response === "yes" ? "You’re going!" : response === "no" ? "You’ve declined" : "You responded maybe"}
          </strong>
        </div>
      </section>
    );
  }
  return (
    <section className="py-5 text-center">
      <button
        type="button"
        onClick={onRsvpClick}
        className="min-h-12 bg-[var(--birthday-body-accent)] px-9 py-4 text-base font-black uppercase tracking-[0.12em] text-white shadow-xl transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--birthday-body-ink)] focus-visible:ring-offset-4 motion-reduce:transition-none"
      >
        RSVP to celebrate
      </button>
      {deadline ? (
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.15em] opacity-55">
          Please RSVP by {formatMonthDayOrdinalEn(deadline, { utc: true, includeYearIfNotCurrent: true })}
        </p>
      ) : null}
    </section>
  );
}

function Chapter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-t border-[var(--birthday-body-ink)]/18 pt-5 md:grid-cols-[150px_1fr]">
      <p className="font-mono text-xs font-black uppercase tracking-[0.18em] opacity-48">{label}</p>
      <div>{children}</div>
    </div>
  );
}

function renderBodyComposition(
  profile: BirthdayExperienceProfile,
  blocks: Record<string, ReactNode>,
) {
  const { facts, story, notes, schedule, gallery, hosts, registry, rsvp } = blocks;
  const tail = (
    <div className="space-y-10">
      {registry}
      {rsvp}
    </div>
  );

  switch (profile.bodyComposition) {
    case "celebration-bento":
      return (
        <div className="space-y-8">
          {facts}
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">{story}</div>
            <div className="lg:col-span-5">{notes}</div>
            <div className="lg:col-span-12">{gallery}</div>
            <div className="lg:col-span-5">{hosts}</div>
            <div className="lg:col-span-7">{schedule}</div>
          </div>
          {tail}
        </div>
      );
    case "editorial-ledger":
      return (
        <div className="space-y-10">
          <div className="border-y-4 border-double border-[var(--birthday-body-ink)] py-6">{facts}</div>
          <div className="grid gap-10 lg:grid-cols-[1.5fr_.7fr]">
            <div className="space-y-8">{story}{gallery}</div>
            <aside className="space-y-8 border-l border-[var(--birthday-body-ink)]/22 pl-0 lg:pl-8">{notes}{hosts}</aside>
          </div>
          {schedule}
          {tail}
        </div>
      );
    case "party-timeline":
      return (
        <div className="space-y-8">
          {facts}
          <div className="relative space-y-8 border-l-4 border-[var(--birthday-body-accent)] pl-7 before:absolute before:-left-[10px] before:top-0 before:h-4 before:w-4 before:rounded-full before:bg-[var(--birthday-body-accent)]">
            <Chapter label="01 · The invitation">{story}</Chapter>
            <Chapter label="02 · Before you arrive">{notes}</Chapter>
            <Chapter label="03 · The party plan">{schedule}</Chapter>
            <Chapter label="04 · The people">{hosts}</Chapter>
          </div>
          {gallery}
          {tail}
        </div>
      );
    case "storybook-chapters":
      return (
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center"><BookOpen className="mx-auto mb-3 h-8 w-8" aria-hidden="true" />{facts}</div>
          <Chapter label="Chapter one">{story}</Chapter>
          <Chapter label="Chapter two">{notes}</Chapter>
          <Chapter label="Chapter three">{gallery}</Chapter>
          <Chapter label="The cast">{hosts}</Chapter>
          {schedule}{tail}
        </div>
      );
    case "scrapbook-wall":
      return (
        <div className="space-y-12">
          <div className="rotate-[-1deg]">{facts}</div>
          <div className="grid items-start gap-8 md:grid-cols-2 [&>*:first-child]:rotate-[-1deg] [&>*:last-child]:rotate-[1deg]">{story}{notes}</div>
          <div className="border-[10px] border-white/42 bg-white/20 p-4 shadow-2xl">{gallery}</div>
          <div className="grid gap-8 lg:grid-cols-2">{hosts}{schedule}</div>
          {tail}
        </div>
      );
    case "ticket-program":
      return (
        <div className="space-y-8">
          {facts}
          <div className="border-2 border-dashed border-[var(--birthday-body-ink)]/40 p-4 sm:p-8">
            <div className="mb-7 flex items-center gap-3 border-b-2 border-dashed border-[var(--birthday-body-ink)]/30 pb-5"><Ticket className="h-6 w-6" aria-hidden="true" /><strong className="uppercase tracking-[0.2em]">Admit one unforgettable celebration</strong></div>
            <div className="grid gap-6 lg:grid-cols-2">{story}{notes}</div>
          </div>
          {schedule}{gallery}<div className="grid gap-8 md:grid-cols-2">{hosts}{registry}</div>{rsvp}
        </div>
      );
    case "scoreboard-grid":
      return (
        <div className="space-y-8 border-4 border-[var(--birthday-body-ink)] p-4 sm:p-7">
          <div className="bg-[var(--birthday-body-ink)] p-4 text-[var(--birthday-body-bg)]">{facts}</div>
          <div className="grid gap-1 bg-[var(--birthday-body-ink)] lg:grid-cols-2 [&>*]:rounded-none">{story}{notes}</div>
          <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">{schedule}{gallery}</div>
          {hosts}{registry}{rsvp}
        </div>
      );
    case "gallery-exhibition":
      return (
        <div className="space-y-12">
          <div className="border-b border-[var(--birthday-body-ink)]/20 pb-8">{gallery}</div>
          {facts}
          <div className="grid gap-10 lg:grid-cols-2 [&_section]:rounded-none [&_section]:border-x-0">{story}{notes}</div>
          <div className="grid items-start gap-10 lg:grid-cols-2">{hosts}{schedule}</div>
          {tail}
        </div>
      );
    case "postcard-route":
      return (
        <div className="space-y-10">
          {facts}
          <div className="grid gap-8 lg:grid-cols-2 [&_section]:rounded-sm [&_section]:border-[10px] [&_section]:border-white/60">{story}{notes}</div>
          <div className="rotate-[-1deg] border-2 border-dashed border-[var(--birthday-body-ink)]/35 p-5">{gallery}</div>
          <div className="grid gap-8 md:grid-cols-2">{schedule}{hosts}</div>{tail}
        </div>
      );
    case "magazine-columns":
      return (
        <div className="space-y-10">
          <div className="flex items-end justify-between border-b-8 border-[var(--birthday-body-ink)] pb-3"><strong className="text-4xl uppercase tracking-[-0.06em] sm:text-6xl">The birthday edit</strong><span className="font-mono text-xs">SPECIAL ISSUE</span></div>
          {facts}
          <div className="columns-1 gap-8 lg:columns-2 [&>section]:mb-8 [&>section]:break-inside-avoid [&_section]:rounded-none">{story}{notes}{hosts}</div>
          {gallery}{schedule}{tail}
        </div>
      );
    case "menu-table":
      return (
        <div className="mx-auto max-w-5xl space-y-10 border-2 border-[var(--birthday-body-ink)]/30 bg-white/28 p-5 sm:p-10">
          <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.35em] opacity-55">Today’s celebration menu</p><Sparkles className="mx-auto my-4 h-6 w-6" aria-hidden="true" /></div>
          {facts}
          <Chapter label="First course · the story">{story}</Chapter>
          <Chapter label="House notes">{notes}</Chapter>
          <Chapter label="Today’s specials">{schedule}</Chapter>
          <Chapter label="Sweet finish">{gallery}</Chapter>
          {hosts}{tail}
        </div>
      );
    case "constellation-map":
      return (
        <div className="space-y-12 rounded-[3rem] bg-[var(--birthday-body-ink)] p-6 text-[var(--birthday-body-bg)] sm:p-10">
          <div className="relative before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_15%_25%,white_0_1px,transparent_2px),radial-gradient(circle_at_80%_35%,white_0_1px,transparent_2px),radial-gradient(circle_at_40%_75%,white_0_1px,transparent_2px)] before:opacity-40"><div className="relative">{facts}</div></div>
          <div className="grid gap-8 lg:grid-cols-2 [&_section]:border-white/20 [&_section]:bg-white/8 [&_section]:text-white">{story}{notes}</div>
          {gallery}{schedule}{hosts}{tail}
        </div>
      );
    case "minimal-rail":
      return (
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-7 border-r border-[var(--birthday-body-ink)]/25 pr-0 lg:sticky lg:top-8 lg:self-start lg:pr-8">{facts}{hosts}</aside>
          <div className="space-y-10 [&_section]:rounded-none [&_section]:border-x-0 [&_section]:shadow-none">{story}{notes}{gallery}{schedule}{tail}</div>
        </div>
      );
    case "arched-suite":
      return (
        <div className="space-y-10">
          {facts}
          <div className="grid gap-6 lg:grid-cols-2 [&_section]:rounded-t-[999px] [&_section]:pt-24">{story}{notes}</div>
          <div className="rounded-t-[12rem] border border-[var(--birthday-body-accent)]/35 bg-white/26 px-5 pt-20">{gallery}</div>
          <div className="grid gap-8 lg:grid-cols-2">{hosts}{schedule}</div>{tail}
        </div>
      );
    case "ribbon-run":
      return (
        <div className="space-y-5">
          {facts}
          <div className="-mx-4 -skew-x-2 bg-[var(--birthday-body-accent)] p-3 sm:-mx-10"><div className="skew-x-2 text-white">{story}</div></div>
          <div className="-mx-4 skew-x-2 border-y-4 border-[var(--birthday-body-ink)]/40 p-3 sm:-mx-10"><div className="-skew-x-2">{notes}</div></div>
          {gallery}<div className="grid gap-8 md:grid-cols-2">{schedule}{hosts}</div>{tail}
        </div>
      );
    case "festival-lineup":
      return (
        <div className="space-y-10">
          <div className="border-y-[12px] border-double border-[var(--birthday-body-accent)] py-5">{facts}</div>
          <div className="grid gap-4 lg:grid-cols-[.7fr_1.3fr]"><div className="space-y-4">{story}{notes}</div><div className="border-l-8 border-[var(--birthday-body-accent)] pl-5">{schedule}{hosts}</div></div>
          <div className="bg-[var(--birthday-body-ink)] p-5 text-white">{gallery}</div>{registry}{rsvp}
        </div>
      );
    case "passport-stamps":
      return (
        <div className="space-y-10 rounded-[2rem] border-[10px] border-double border-[var(--birthday-body-ink)]/30 bg-white/30 p-5 sm:p-9">
          {facts}
          <div className="grid gap-0 overflow-hidden rounded-xl bg-white/62 shadow-2xl lg:grid-cols-2 [&>*]:rounded-none [&>*]:shadow-none">{story}{notes}</div>
          <Chapter label="Destination memories">{gallery}</Chapter>
          <Chapter label="Travel party">{hosts}</Chapter>
          {schedule}{tail}
        </div>
      );
    case "newspaper-front":
      return (
        <div className="space-y-8">
          <div className="border-y-4 border-[var(--birthday-body-ink)] py-3 text-center text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl">The party times</div>
          {facts}
          <div className="grid gap-8 lg:grid-cols-[1.4fr_.8fr] [&_section]:rounded-none [&_section]:border-x-0 [&_section]:shadow-none"><div className="space-y-8">{story}{gallery}</div><aside className="space-y-8 border-l border-[var(--birthday-body-ink)]/25 pl-6">{notes}{schedule}{hosts}</aside></div>
          {tail}
        </div>
      );
    case "neon-club":
      return (
        <div className="space-y-8 bg-black p-5 text-white shadow-[0_0_70px_var(--birthday-body-accent-soft)] sm:p-9">
          <div className="border border-[var(--birthday-body-accent)] p-4">{facts}</div>
          <div className="grid gap-6 lg:grid-cols-2 [&_section]:rounded-none [&_section]:border-[var(--birthday-body-accent)]/60 [&_section]:bg-white/5 [&_section]:text-white">{story}{notes}</div>
          {gallery}<div className="grid gap-8 md:grid-cols-2">{schedule}{hosts}</div>{tail}
        </div>
      );
    case "garden-path":
      return (
        <div className="space-y-10">
          {facts}
          <div className="relative space-y-8 before:absolute before:bottom-0 before:left-1/2 before:top-0 before:hidden before:w-px before:bg-[var(--birthday-body-accent)]/40 md:before:block">
            <div className="md:mr-[52%]">{story}</div><div className="md:ml-[52%]">{notes}</div><div className="md:mr-[52%]">{hosts}</div><div className="md:ml-[52%]">{schedule}</div>
          </div>
          {gallery}{tail}
        </div>
      );
    case "memory-book":
      return (
        <div className="space-y-10">
          {facts}
          <div className="grid overflow-hidden rounded-[2rem] bg-white/62 shadow-2xl lg:grid-cols-2 [&>*]:rounded-none [&>*]:border-0 [&>*]:shadow-none"><div className="border-r border-[var(--birthday-body-ink)]/15">{story}{hosts}</div><div>{notes}{schedule}</div></div>
          <div className="border-t-2 border-[var(--birthday-body-ink)]/20 pt-8">{gallery}</div>{tail}
        </div>
      );
    case "comic-panels":
      return (
        <div className="space-y-5 border-4 border-[var(--birthday-body-ink)] bg-[var(--birthday-body-ink)] p-1">
          <div className="bg-[var(--birthday-body-bg)] p-4">{facts}</div>
          <div className="grid gap-1 lg:grid-cols-12 [&>*]:rounded-none [&>*]:border-4 [&>*]:border-[var(--birthday-body-ink)] [&>*]:shadow-none"><div className="lg:col-span-7">{story}</div><div className="lg:col-span-5">{notes}</div><div className="lg:col-span-12">{gallery}</div><div className="lg:col-span-5">{hosts}</div><div className="lg:col-span-7">{schedule}</div></div>
          <div className="space-y-7 bg-[var(--birthday-body-bg)] p-5">{tail}</div>
        </div>
      );
    case "polaroid-desk":
      return (
        <div className="space-y-12">
          <div className="-rotate-1 border-[14px] border-white border-b-[40px] bg-white shadow-2xl">{gallery}</div>
          {facts}
          <div className="grid gap-8 md:grid-cols-2 [&>*:first-child]:rotate-[-1deg] [&>*:last-child]:rotate-[1deg]">{story}{notes}</div>
          <div className="grid gap-8 md:grid-cols-2">{hosts}{schedule}</div>{tail}
        </div>
      );
    case "stage-program":
      return (
        <div className="space-y-10 border-x-[18px] border-[var(--birthday-body-accent)]/30 px-4 text-center sm:px-10">
          <div className="mx-auto max-w-4xl">{facts}</div>
          <div className="mx-auto max-w-3xl space-y-7 [&_section]:rounded-t-[8rem] [&_section]:pt-16">{story}{notes}</div>
          {schedule}<div className="border-y border-[var(--birthday-body-ink)]/20 py-8">{gallery}</div>{hosts}{tail}
        </div>
      );
    case "cake-layers":
      return (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-full">{facts}</div>
          <div className="w-full max-w-6xl">{story}</div>
          <div className="w-[92%] max-w-5xl">{notes}</div>
          <div className="w-[84%] max-w-4xl">{gallery}</div>
          <div className="w-[76%] max-w-3xl">{schedule}</div>
          <div className="w-[68%] max-w-2xl">{hosts}</div>
          <div className="w-full max-w-4xl">{tail}</div>
        </div>
      );
    case "orbit-dashboard":
      return (
        <div className="space-y-12">
          <div className="relative mx-auto max-w-6xl rounded-full border-2 border-dashed border-[var(--birthday-body-accent)]/45 p-7 sm:p-12"><div className="mx-auto max-w-3xl">{gallery}</div><div className="mt-8">{facts}</div></div>
          <div className="grid gap-8 lg:grid-cols-2 [&>*:first-child]:rounded-[4rem_1rem] [&>*:last-child]:rounded-[1rem_4rem]">{story}{notes}</div>
          <div className="grid gap-8 md:grid-cols-2">{schedule}{hosts}</div>{tail}
        </div>
      );
    default:
      return (
        <div className="space-y-10">{facts}<div className="grid gap-7 md:grid-cols-2">{story}{notes}</div>{gallery}{schedule}{hosts}{tail}</div>
      );
  }
}

export default function BirthdayExperienceBody({
  theme,
  event,
  userRsvpResponse,
  onRsvpClick,
}: BirthdayExperienceBodyProps) {
  const profile = theme.experience;
  const darkMode = profile.tone === "dark";
  const childName =
    event.birthdayName ||
    (event.headlineTitle?.includes("'s") ? event.headlineTitle.split("'s")[0] : "");
  const partyTheme = event.party?.theme || event.partyDetails?.theme || "";
  const goodToKnow =
    event.goodToKnow ||
    event.thingsToDo ||
    event.party?.activities ||
    event.partyDetails?.activities ||
    event.party?.notes ||
    event.partyDetails?.notes;
  const facts: Fact[] = [
    childName ? { label: "Guest of honor", value: childName } : null,
    event.age ? { label: "Turning", value: formatAge(event.age) } : null,
    formatEventTime(event.date, event.end)
      ? { label: "Starts at", value: formatEventTime(event.date, event.end) }
      : null,
    partyTheme ? { label: "Party theme", value: partyTheme } : null,
  ].filter((fact): fact is Fact => Boolean(fact));
  const registries = event.registries || event.registry || [];

  const bodyStyle = {
    "--birthday-body-bg": darkMode
      ? `color-mix(in srgb, ${theme.colors.primary} 72%, #050505)`
      : `color-mix(in srgb, ${theme.colors.primary} 88%, ${theme.colors.secondary})`,
    "--birthday-body-card": darkMode ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.72)",
    "--birthday-body-ink": darkMode ? "#f8fafc" : "#243049",
    "--birthday-body-accent": theme.colors.secondary,
    "--birthday-body-accent-soft": `${theme.colors.secondary}55`,
    "--birthday-body-headline": theme.fonts.headline,
    background: "var(--birthday-body-bg)",
    color: "var(--birthday-body-ink)",
    fontFamily: theme.fonts.body || "inherit",
  } as CSSProperties;

  const blocks: Record<string, ReactNode> = {
    facts: <ExperienceFacts facts={facts} treatment={profile.factTreatment} />,
    story: event.story ? (
      <StoryCard
        title="Party details"
        icon={<FileText className="h-6 w-6" aria-hidden="true" />}
        profile={profile}
      >
        <p>{event.story}</p>
      </StoryCard>
    ) : null,
    notes: goodToKnow ? (
      <StoryCard
        title="Good to know"
        icon={<Lightbulb className="h-6 w-6" aria-hidden="true" />}
        profile={profile}
      >
        <p>{goodToKnow}</p>
      </StoryCard>
    ) : null,
    schedule: (
      <ExperienceSchedule items={event.schedule || []} treatment={profile.scheduleTreatment} />
    ),
    gallery: (
      <ExperienceGallery photos={event.gallery || []} treatment={profile.galleryTreatment} />
    ),
    hosts: <ExperienceHosts hosts={event.hosts || []} treatment={profile.hostTreatment} />,
    registry: <ExperienceRegistry registries={registries} />,
    rsvp: (
      <ExperienceRsvp
        enabled={event.rsvpEnabled}
        response={userRsvpResponse}
        deadline={event.rsvpDeadline}
        onRsvpClick={onRsvpClick}
      />
    ),
  };

  return (
    <main
      data-birthday-body-composition={profile.bodyComposition}
      data-birthday-body-experience={profile.bodySignature}
      data-birthday-section-order={profile.sectionOrder}
      className="w-full px-5 py-12 sm:px-8 lg:px-12 lg:py-16"
      style={bodyStyle}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 flex items-center justify-between gap-5 border-b border-[var(--birthday-body-ink)]/14 pb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[var(--birthday-body-accent)]" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-58">
              {profile.bodyCompositionLabel}
            </p>
          </div>
          <div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] opacity-45 sm:flex">
            <Users className="h-4 w-4" aria-hidden="true" /> Guest experience
          </div>
        </div>
        {renderBodyComposition(profile, blocks)}
      </div>
    </main>
  );
}
