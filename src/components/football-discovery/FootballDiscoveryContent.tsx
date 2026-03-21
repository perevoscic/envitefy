// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronRight, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";
import { buildEditLink } from "@/utils/event-edit-route";
import { normalizeFootballEventData } from "./normalizeFootballEventData.mjs";

type Props = {
  eventData: any;
  eventTitle: string;
  eventId?: string;
  shareUrl?: string;
  sessionEmail?: string | null;
  isOwner?: boolean;
  isReadOnly?: boolean;
  editHref?: string;
  pageTemplateId?: string | null;
  hideOwnerActions?: boolean;
  chrome?: {
    id: string;
    name: string;
    pageClass: string;
    shellClass: string;
    headerClass: string;
    headerOverlayClass: string;
    titleClass: string;
    titleStyle?: React.CSSProperties;
    textClass: string;
    mutedClass: string;
    accentClass: string;
    heroBadgeClass: string;
    navShellClass: string;
    navActiveClass: string;
    navIdleClass: string;
    sectionClass: string;
    sectionCardClass: string;
    summaryCardClass: string;
    sectionMutedClass: string;
    sectionTitleClass: string;
    sectionTitleStyle?: React.CSSProperties;
    titleTypography: {
      heroClassName: string;
      fontStyle: React.CSSProperties;
    };
    isDark: boolean;
  } | null;
};

const SectionCard = ({
  title,
  body,
  meta,
  details,
  href,
}: {
  title: string;
  body?: string;
  meta?: string;
  details?: string[];
  href?: string;
}) => (
  <article className="rounded-3xl border border-white/10 bg-white/6 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-black uppercase tracking-[0.08em] text-white">
          {title}
        </h3>
        {body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/78">{body}</p> : null}
      </div>
      {meta ? (
        <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
          {meta}
        </span>
      ) : null}
    </div>
    {details && details.length > 0 ? (
      <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm text-white/72">
        {details.map((line) => (
          <p key={line} className="leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    ) : null}
    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/16"
      >
        Open link
        <ChevronRight size={12} />
      </a>
    ) : null}
  </article>
);

const EmptySection = ({ text }: { text: string }) => (
  <div className="rounded-3xl border border-dashed border-white/16 bg-white/5 px-5 py-8 text-sm text-white/70">
    {text}
  </div>
);

export default function FootballDiscoveryContent({
  eventData,
  eventTitle,
  eventId,
  shareUrl,
  sessionEmail,
  isOwner = false,
  isReadOnly = false,
  editHref,
  pageTemplateId = null,
  hideOwnerActions = false,
  chrome = null,
}: Props) {
  const model = useMemo(
    () => normalizeFootballEventData({ eventData, eventTitle }),
    [eventData, eventTitle]
  );
  const sections = useMemo(
    () => model.sections.filter((section) => section.hasContent),
    [model.sections]
  );
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!sections.length) return;
    if (!sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [activeSectionId, sections]);

  useEffect(() => {
    if (!sections.length || typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute("data-section-id");
          if (id) setActiveSectionId(id);
        }
      },
      {
        root: null,
        rootMargin: "-28% 0px -58% 0px",
        threshold: 0,
      }
    );

    for (const section of sections) {
      const node = sectionRefs.current[section.id];
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const node = sectionRefs.current[sectionId];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const summaryChips = [
    model.dateLabel,
    model.timeLabel,
    model.locationLabel,
  ].filter(Boolean);
  const templateChrome = chrome;
  const showTemplateView = Boolean(templateChrome);
  const actionHistoryId = sessionEmail && !isReadOnly ? eventId : undefined;
  const resolvedEditHref =
    editHref || (eventId ? buildEditLink(eventId, eventData, eventTitle) : "");
  const canShowOwnerToolbar = Boolean(
    showTemplateView && isOwner && !isReadOnly && !hideOwnerActions && eventId
  );
  const canShowPublicActions = Boolean(
    showTemplateView && !hideOwnerActions && shareUrl && eventId
  );
  const actionTone = "default" as const;

  if (showTemplateView) {
    return (
      <main
        className={templateChrome.pageClass}
        data-page-template-id={pageTemplateId || templateChrome.id}
      >
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className={templateChrome.shellClass}>
            <header
              className={`relative overflow-hidden ${templateChrome.headerClass}`}
            >
              <div className={`absolute inset-0 ${templateChrome.headerOverlayClass}`} />
              <div className="relative z-10 px-5 py-8 sm:px-8 sm:py-10">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]">
                  <span className={templateChrome.heroBadgeClass}>
                    <Sparkles size={12} />
                    Football discovery
                  </span>
                  {model.attendance.visible ? (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                        templateChrome.sectionMutedClass
                      }`}
                    >
                      <Shield size={12} />
                      {model.attendance.passcodeRequired
                        ? "Protected attendance"
                        : "Attendance open"}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-[0.3em] ${templateChrome.accentClass}`}>
                      {model.subtitle || "Season overview"}
                    </p>
                    <h1
                      className={`${templateChrome.titleTypography.heroClassName} ${templateChrome.titleClass}`}
                      style={{
                        ...templateChrome.titleTypography.fontStyle,
                        ...templateChrome.titleStyle,
                      }}
                    >
                      {model.title}
                    </h1>
                    <div
                      className={`mt-4 flex flex-wrap gap-2 text-sm ${templateChrome.mutedClass}`}
                    >
                      {summaryChips.map((chip) => (
                        <span
                          key={chip}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${templateChrome.sectionMutedClass}`}
                        >
                          <CalendarDays size={14} className={templateChrome.accentClass} />
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {model.summaryItems.slice(0, 3).map((item) => (
                      <div key={item.label} className={templateChrome.summaryCardClass}>
                        <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${templateChrome.accentClass}`}>
                          {item.label}
                        </p>
                        <p className={`mt-2 text-lg font-black leading-tight ${templateChrome.textClass}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
                <div
                  className={`flex flex-wrap items-center gap-2 rounded-2xl border px-2 py-1.5 shadow-[0_12px_28px_rgba(15,23,42,0.14)] backdrop-blur ${
                    templateChrome.isDark
                      ? "border-white/10 bg-slate-950/70"
                      : "border-white/40 bg-white/88"
                  }`}
                >
                  {canShowOwnerToolbar ? (
                    <>
                      <Link
                        href={resolvedEditHref}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-inherit transition hover:bg-black/5"
                        title="Edit event"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span className="hidden sm:inline">Edit</span>
                      </Link>
                      <EventDeleteModal eventId={eventId || ""} eventTitle={eventTitle} />
                    </>
                  ) : null}
                  {canShowPublicActions ? (
                    <EventActions
                      shareUrl={shareUrl || ""}
                      event={eventData as any}
                      historyId={actionHistoryId}
                      className="flex items-center gap-2"
                      variant="compact"
                      tone={actionTone as any}
                    />
                  ) : null}
                </div>
              </div>
            </header>

            {model.navItems.length > 0 ? (
              <div className="relative z-20 -mt-6 px-3 sm:px-5">
                <div className={templateChrome.navShellClass}>
                  <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {model.navItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const node = sectionRefs.current[item.id];
                          if (!node) return;
                          node.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={
                          activeSectionId === item.id
                            ? templateChrome.navActiveClass
                            : templateChrome.navIdleClass
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4 px-3 pb-5 pt-6 sm:px-5 sm:pb-6 sm:pt-7">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  data-section-id={section.id}
                  ref={(node) => {
                    sectionRefs.current[section.id] = node;
                  }}
                  className={`${templateChrome.sectionClass} scroll-mt-28`}
                >
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      {section.eyebrow ? (
                        <p
                          className={`text-[10px] font-black uppercase tracking-[0.26em] ${templateChrome.accentClass}`}
                        >
                          {section.eyebrow}
                        </p>
                      ) : null}
                      <h2
                        className={`mt-2 text-2xl font-black uppercase tracking-tight ${templateChrome.sectionTitleClass}`}
                        style={templateChrome.sectionTitleStyle}
                      >
                        {section.label}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${templateChrome.sectionMutedClass}`}
                    >
                      {section.id}
                    </span>
                  </div>

                  {section.id === "attendance" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <article className={templateChrome.sectionCardClass}>
                        <h3
                          className={`text-base font-black uppercase tracking-[0.08em] ${templateChrome.sectionTitleClass}`}
                          style={templateChrome.sectionTitleStyle}
                        >
                          {model.attendance.passcodeLabel}
                        </h3>
                        <p
                          className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${templateChrome.textClass}`}
                        >
                          {model.attendance.passcodeHint}
                        </p>
                        <div className="mt-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${templateChrome.sectionMutedClass}`}
                          >
                            {model.attendance.passcodeRequired ? "Locked" : "Open"}
                          </span>
                        </div>
                      </article>
                      <article className={templateChrome.sectionCardClass}>
                        <h3
                          className={`text-base font-black uppercase tracking-[0.08em] ${templateChrome.sectionTitleClass}`}
                          style={templateChrome.sectionTitleStyle}
                        >
                          Response Window
                        </h3>
                        <p
                          className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${templateChrome.textClass}`}
                        >
                          {model.attendance.helperText}
                        </p>
                        <div className="mt-4 space-y-2 text-sm">
                          {model.attendance.deadline ? (
                            <div
                              className={`inline-flex rounded-full border px-3 py-1 ${templateChrome.sectionMutedClass}`}
                            >
                              Deadline: {model.attendance.deadline}
                            </div>
                          ) : (
                            <div
                              className={`inline-flex rounded-full border px-3 py-1 ${templateChrome.sectionMutedClass}`}
                            >
                              No deadline set.
                            </div>
                          )}
                        </div>
                      </article>
                    </div>
                  ) : section.cards && section.cards.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {section.cards.map((card) => (
                        <article key={card.id} className={templateChrome.sectionCardClass}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3
                                className={`text-base font-black uppercase tracking-[0.08em] ${templateChrome.sectionTitleClass}`}
                                style={templateChrome.sectionTitleStyle}
                              >
                                {card.title}
                              </h3>
                              {card.body ? (
                                <p
                                  className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${templateChrome.textClass}`}
                                >
                                  {card.body}
                                </p>
                              ) : null}
                            </div>
                            {card.meta ? (
                              <span
                                className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${templateChrome.sectionMutedClass}`}
                              >
                                {card.meta}
                              </span>
                            ) : null}
                          </div>
                          {card.details && card.details.length > 0 ? (
                            <div
                              className={`mt-4 space-y-2 border-t pt-4 text-sm ${templateChrome.mutedClass}`}
                            >
                              {card.details.map((line) => (
                                <p key={line} className="leading-relaxed">
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : null}
                          {card.href ? (
                            <a
                              href={card.href}
                              target="_blank"
                              rel="noreferrer noopener"
                              className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${templateChrome.sectionMutedClass}`}
                            >
                              Open link
                              <ChevronRight size={12} />
                            </a>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : section.lines && section.lines.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {section.lines.map((line) => (
                        <div
                          key={line}
                          className={`${templateChrome.sectionCardClass} text-sm leading-relaxed ${templateChrome.textClass}`}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`${templateChrome.sectionCardClass} border-dashed text-sm ${templateChrome.mutedClass}`}
                    >
                      Nothing has been added to this section yet.
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.28),transparent_26%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.22),transparent_28%),linear-gradient(180deg,#050816_0%,#0f172a_34%,#111827_100%)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-white/6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] backdrop-blur">
          <div className="border-b border-white/10 px-5 py-5 sm:px-7 sm:py-7">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/65">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                <Sparkles size={12} /> Football discovery
              </span>
              {model.attendance.visible ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/12 px-3 py-1 text-emerald-100">
                  <Shield size={12} />
                  {model.attendance.passcodeRequired ? "Protected attendance" : "Attendance open"}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-200/80">
                  {model.subtitle || "Season overview"}
                </p>
                <h1 className="mt-3 max-w-4xl text-4xl font-black uppercase leading-[0.92] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {model.title}
                </h1>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/75">
                  {summaryChips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <CalendarDays size={14} className="text-amber-200" />
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {model.summaryItems.slice(0, 3).map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4 shadow-[0_10px_28px_rgba(2,6,23,0.24)]"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-black leading-tight text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-white/10 px-3 py-3 sm:px-5">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition sm:text-[11px] ${
                    activeSectionId === section.id
                      ? "border-amber-300/50 bg-amber-300 text-slate-950"
                      : "border-white/10 bg-white/6 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="space-y-5 py-5 sm:py-6">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              data-section-id={section.id}
              ref={(node) => {
                sectionRefs.current[section.id] = node;
              }}
              className="scroll-mt-24 rounded-[30px] border border-white/10 bg-white/5 px-4 py-5 shadow-[0_16px_44px_rgba(2,6,23,0.22)] backdrop-blur sm:px-5 sm:py-6"
            >
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  {section.eyebrow ? (
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/50">
                      {section.eyebrow}
                    </p>
                  ) : null}
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                    {section.label}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                  {section.id}
                </span>
              </div>

              {section.id === "attendance" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <SectionCard
                    title={model.attendance.passcodeLabel}
                    body={model.attendance.passcodeHint}
                    meta={model.attendance.passcodeRequired ? "Locked" : "Open"}
                  />
                  <SectionCard
                    title="Response Window"
                    body={model.attendance.helperText}
                    meta={model.attendance.enabled ? "Active" : "Hidden"}
                    details={[
                      model.attendance.deadline
                        ? `Deadline: ${model.attendance.deadline}`
                      : "No deadline set.",
                    ]}
                  />
                </div>
              ) : section.cards && section.cards.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {section.cards.map((card) => (
                    <SectionCard
                      key={card.id}
                      title={card.title}
                      body={card.body}
                      meta={card.meta}
                      details={card.details}
                      href={card.href}
                    />
                  ))}
                </div>
              ) : section.lines && section.lines.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {section.lines.map((line) => (
                    <div
                      key={line}
                      className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-relaxed text-white/78"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptySection text="Nothing has been added to this section yet." />
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
