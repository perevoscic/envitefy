// @ts-nocheck
"use client";

import React, { useMemo } from "react";
import FootballSectionTabs, { useFootballSectionTabs } from "@/components/football-season-templates/FootballSectionTabs";
import { CalendarDays, ChevronRight, Shield, WandSparkles } from "lucide-react";
import Link from "next/link";
import FootballSchedule from "@/components/football-season-templates/FootballSchedule";
import ScoreStreamScoreboard from "@/components/football-season-templates/ScoreStreamScoreboard";
import FootballHero from "@/components/football-season-templates/FootballHero";
import FootballPageContent from "@/components/football-season-templates/FootballPageContent";
import FootballText, { FootballPageTextProvider } from "@/components/football-season-templates/FootballPageText";
import { normalizeFootballPageText } from "@/lib/football-page-text";
import FootballPageActions from "@/components/football-season-templates/FootballPageActions";
import EnvitefyEventBranding from "@/components/branding/EnvitefyEventBranding";
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
  <div className="rounded-3xl border border-dashed border-white/16 bg-white/5 px-5 py-8 text-sm text-white">
    {text}
  </div>
);

export default function FootballDiscoveryContent(props: Props) {
  return <FootballPageTextProvider text={normalizeFootballPageText(props.eventData?.footballPageText)}><FootballDiscoveryBody {...props} /></FootballPageTextProvider>;
}

function FootballDiscoveryBody({
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
  const sectionTabs = useFootballSectionTabs(model.navItems);

  const summaryChips = [
    model.dateLabel,
    model.timeLabel,
    model.locationLabel,
  ].filter(Boolean);
  const templateChrome = chrome;
  const scheduleProps = {
    games: eventData.advancedSections?.games?.games || eventData.customFields?.advancedSections?.games?.games || eventData.discoverySource?.parseResult?.games || [],
    teamName: model.teamName,
    teamMascot: model.teamMascot,
    season: eventData.customFields?.season || eventData.extra?.season || eventData.discoverySource?.parseResult?.season,
    homeVenue: eventData.customFields?.stadium || eventData.extra?.stadium || eventData.venue,
    homeAddress: eventData.customFields?.stadiumAddress || eventData.extra?.stadiumAddress || eventData.address,
    timezone: eventData.timezone,
  };
  const showTemplateView = Boolean(templateChrome);
  const resolvedEditHref =
    editHref || (eventId ? buildEditLink(eventId, eventData, eventTitle) : "");
  const canShowOwnerToolbar = Boolean(
    showTemplateView && isOwner && !isReadOnly && !hideOwnerActions && eventId
  );
  const canShowPublicActions = Boolean(
    showTemplateView && !hideOwnerActions && shareUrl && eventId
  );


  if (showTemplateView) {
    return (
      <main
        className={templateChrome.pageClass}
        data-page-template-id={pageTemplateId || templateChrome.id}
      >
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className={templateChrome.shellClass}>
            <FootballHero
              templateId={pageTemplateId || eventData.pageTemplateId || templateChrome.id}
              title={model.title}
              subtitle={model.subtitle || "Football season"}
              details={summaryChips}
              heroSrc={eventData.heroImage || eventData.hero}
              actions={canShowPublicActions || canShowOwnerToolbar ? (
                <>
                  {canShowPublicActions || canShowOwnerToolbar ? (
                    <FootballPageActions
                      title={eventTitle}
                      start={eventData.startISO || eventData.startAt || eventData.start || (eventData.date && eventData.time ? `${eventData.date}T${eventData.time}` : null)}
                      end={eventData.endISO || eventData.endAt || eventData.end}
                      timezone={eventData.timezone || eventData.tz}
                      description={eventData.description || eventData.details}
                      location={model.locationLabel}
                      shareUrl={shareUrl}
                      editHref={canShowOwnerToolbar ? resolvedEditHref : undefined}
                      previewHref={canShowOwnerToolbar ? shareUrl || `/event/${eventId}` : undefined}
                    />
                  ) : null}
                  {canShowOwnerToolbar ? (
                    <div className="mt-2 hidden items-center justify-end gap-3 rounded-2xl bg-white/95 p-2 text-slate-800 shadow-sm backdrop-blur-sm md:flex">
                      <Link href={resolvedEditHref} className="inline-flex min-h-11 items-center rounded-full border border-current/25 px-4 text-sm font-semibold">Edit event</Link>
                      <EventDeleteModal eventId={eventId || ""} eventTitle={eventTitle} />
                    </div>
                  ) : null}
                </>
              ) : undefined}
            />
            {model.summaryItems.length > 0 ? (
              <div className="grid gap-3 px-5 py-6 sm:grid-cols-3">
                {model.summaryItems.slice(0, 3).map((item) => (
                  <div key={item.label} className={templateChrome.summaryCardClass}>
                    <p className={`text-xs font-semibold uppercase tracking-widest ${templateChrome.accentClass}`}><FootballText textKey={`field:${({ Team: "team", Season: "season", Coach: "headCoach", Stadium: "stadium", Address: "stadiumAddress" })[item.label] || item.label}:label`} fallback={item.label} /></p>
                    <p className={`mt-2 text-lg font-bold ${templateChrome.textClass}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {model.navItems.length > 0 ? (
              <div className="relative z-20 px-3 pt-4 sm:px-5">
                <FootballSectionTabs tabs={sectionTabs} shellClassName={templateChrome.navShellClass} activeClassName={templateChrome.navActiveClass} idleClassName={templateChrome.navIdleClass} />
              </div>
            ) : null}

            <FootballPageContent sections={sections} tabs={sectionTabs} chrome={templateChrome} schedule={scheduleProps} attendance={model.attendance} />
          </div>
        </div>
        <footer className="px-4 py-8 text-center"><EnvitefyEventBranding category="Football" inheritColor /></footer>
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
                <WandSparkles size={12} /> Football discovery
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
            <FootballSectionTabs tabs={sectionTabs} activeClassName="rounded-full border border-amber-300/50 bg-amber-300 px-4 py-2 text-xs font-bold text-slate-950" idleClassName="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-bold text-white/80 hover:bg-white/10" />
          </div>
        </header>

        <div className="space-y-5 py-5 sm:py-6">
          {sections.map((section) => (
            <section
              key={section.id}
              {...sectionTabs.panelProps(section.id)}
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

              {section.id === "scores" ? (
                <ScoreStreamScoreboard value={section.scorestreamWidgetUrl} />
              ) : section.id === "games" ? (
                <FootballSchedule {...scheduleProps} cardClassName="rounded-2xl border border-white/20 bg-white/5 p-5" />
              ) : section.id === "attendance" ? (
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
