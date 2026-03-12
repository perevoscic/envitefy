/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  ExternalLink,
} from "lucide-react";
import ShowcaseDiscoveryContent, {
  getShowcaseDiscoveryTabs,
} from "../ShowcaseDiscoveryContent";
import FloatingActionStrip from "../FloatingActionStrip";
import { ShowcaseThemeConfig } from "../showcaseThemes";
import { getGymMeetTitleTypography } from "../titleTypography";
import { GymMeetTemplateRendererProps } from "../types";
import { getGymMeetTitleSizeStyle } from "../titleSizing";
import { formatGymMeetTime, joinUniqueDisplayParts } from "../displayText";

const MOBILE_TAB_SAFE_EDGE_PX = 24;
const DESKTOP_TAB_SAFE_EDGE_PX = 8;

const formatStatus = (value: string) => {
  const normalized = String(value || "").replace(/_/g, " ").trim();
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : "Pending";
};

const safeUrl = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  return /^https?:\/\//i.test(text) ? text : "";
};

const Section = ({
  title,
  eyebrow,
  id,
  theme,
  children,
}: {
  title: string;
  eyebrow?: string;
  id?: string;
  theme: ShowcaseThemeConfig;
  children: React.ReactNode;
}) => (
  <section id={id} className={`${theme.sectionClass} scroll-mt-28`}>
    {eyebrow ? (
      <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${theme.accentClass}`}>
        {eyebrow}
      </p>
    ) : null}
    <h2
      className={`mt-2 text-2xl font-black leading-tight sm:text-3xl ${theme.sectionTitleClass || ""}`}
      style={theme.sectionTitleStyle}
    >
      {title}
    </h2>
    <div className="mt-5">{children}</div>
  </section>
);

const HeroDecor = ({ theme }: { theme: ShowcaseThemeConfig }) => {
  switch (theme.heroDecor) {
    case "grid":
      return (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:26px_26px] opacity-70" />
      );
    case "paper":
      return (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(24,24,27,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
      );
    case "spotlight":
      return (
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
        </div>
      );
    case "burst":
      return (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.3),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.2),transparent_22%),radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:auto,auto,14px_14px]" />
      );
    case "swiss":
      return (
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(220,38,38,0.08)_0,rgba(220,38,38,0.08)_18%,transparent_18%,transparent_100%),linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:100%_100%,28px_28px,28px_28px]" />
      );
    case "deco":
      return (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0,transparent_48%,rgba(212,175,55,0.12)_48%,rgba(212,175,55,0.12)_52%,transparent_52%,transparent_100%)]" />
      );
    case "concrete":
      return (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[size:28px_28px]" />
      );
    case "frost":
      return (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_36%)]" />
      );
    case "organic":
      return (
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-lime-100/25 blur-3xl" />
        </div>
      );
    case "holo":
      return (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.7),transparent_36%)]" />
      );
    case "glitch":
      return (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(239,68,68,0.08)_0px,rgba(239,68,68,0.08)_2px,transparent_2px,transparent_4px)] opacity-70" />
          <div className="absolute inset-y-0 left-[12%] w-px bg-cyan-300/35 shadow-[0_0_18px_rgba(34,211,238,0.5)]" />
          <div className="absolute inset-y-0 right-[18%] w-px bg-red-400/35 shadow-[0_0_18px_rgba(248,113,113,0.45)]" />
        </div>
      );
    case "pixel":
      return (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.12)_1px,transparent_1px)] bg-[size:18px_18px]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent_0%,rgba(0,255,65,0.14)_100%)]" />
        </div>
      );
    case "architect":
      return (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
      );
    case "noir":
      return (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.08)_62%,rgba(255,255,255,0.08)_64%,transparent_64%,transparent_100%)]" />
          <div className="absolute left-1/2 top-0 h-52 w-52 -translate-x-1/2 rounded-full bg-white/8 blur-3xl" />
        </div>
      );
    case "vaporwave":
      return (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(244,114,182,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(244,114,182,0.12)_1px,transparent_1px)] bg-[size:36px_36px]" />
          <div className="absolute bottom-0 left-1/2 h-40 w-[120%] -translate-x-1/2 rounded-full bg-pink-500/18 blur-3xl" />
        </div>
      );
    case "blueprint":
      return (
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.13)_1px,transparent_1px)] bg-[size:18px_18px]" />
      );
    case "toxic":
      return (
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(24,24,27,0.9)_0px,rgba(24,24,27,0.9)_14px,rgba(132,204,22,0.08)_14px,rgba(132,204,22,0.08)_28px)] opacity-35" />
      );
    default:
      return null;
  }
};

export default function ShowcaseGymMeetTemplate({
  model,
  ownerToolbar,
  rsvpProps,
  isReadOnly,
  hideOwnerActions = false,
  onShare,
  onCalendar,
  onGoogleCalendar,
  onAppleCalendar,
  onOutlookCalendar,
  theme,
}: GymMeetTemplateRendererProps & {
  theme: ShowcaseThemeConfig;
}) {
  const titleTypography = getGymMeetTitleTypography(model.pageTemplateId);
  const [activeTab, setActiveTab] = useState("");
  const tabsRailRef = useRef<HTMLDivElement | null>(null);
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const practiceBlocks = Array.isArray(model.practiceBlocks) ? model.practiceBlocks : [];
  const volunteerSlots = Array.isArray(model.volunteers?.volunteerSlots)
    ? model.volunteers.volunteerSlots
    : Array.isArray(model.volunteers?.slots)
    ? model.volunteers.slots
    : [];
  const carpools = Array.isArray(model.volunteers?.carpoolOffers)
    ? model.volunteers.carpoolOffers
    : Array.isArray(model.volunteers?.carpools)
    ? model.volunteers.carpools
    : [];
  const gearItems = Array.isArray(model.gear?.items)
    ? model.gear.items
    : Array.isArray(model.gear)
    ? model.gear
    : [];

  const topTabs = useMemo(() => {
    return getShowcaseDiscoveryTabs(model.discovery?.sections || []);
  }, [model.discovery?.sections]);

  const activeTabId = topTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : topTabs[0]?.id || "";
  const scrollActiveTabIntoView = useCallback(
    (tabId: string, behavior: ScrollBehavior = "smooth") => {
      const rail = tabsRailRef.current;
      const button = tabButtonRefs.current[tabId];
      if (!rail || !button) return;

      const isDesktop =
        typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
      const safeEdgeInset = isDesktop ? DESKTOP_TAB_SAFE_EDGE_PX : MOBILE_TAB_SAFE_EDGE_PX;
      const maxScroll = Math.max(rail.scrollWidth - rail.clientWidth, 0);
      const buttonLeft = button.offsetLeft;
      const buttonRight = buttonLeft + button.offsetWidth;
      const safeViewportLeft = rail.scrollLeft + safeEdgeInset;
      const safeViewportRight = rail.scrollLeft + rail.clientWidth - safeEdgeInset;
      const epsilon = 1;

      if (
        buttonLeft >= safeViewportLeft - epsilon &&
        buttonRight <= safeViewportRight + epsilon
      ) {
        return;
      }

      const targetScrollLeft =
        buttonLeft < safeViewportLeft
          ? buttonLeft - safeEdgeInset
          : buttonRight + safeEdgeInset - rail.clientWidth;

      rail.scrollTo({
        left: Math.min(Math.max(targetScrollLeft, 0), maxScroll),
        behavior,
      });
    },
    []
  );
  const hasQuickAccessSection = model.quickLinks.length > 0;
  const heroVenueLine = joinUniqueDisplayParts(
    [model.hostGym || model.team || model.venue, model.address || model.headerLocation],
    ", "
  );
  const heroMetaLocation =
    heroVenueLine && model.address ? "" : joinUniqueDisplayParts([model.headerLocation], ", ");

  const heroStyle = model.heroImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.18), rgba(2,6,23,0.44)), url(${model.heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  useEffect(() => {
    if (!activeTabId) return;
    const behavior =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
    const rafId = window.requestAnimationFrame(() => {
      scrollActiveTabIntoView(activeTabId, behavior);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [activeTabId, scrollActiveTabIntoView]);

  return (
    <div className={theme.pageClass}>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {!isReadOnly && !hideOwnerActions && ownerToolbar ? <div className="mb-4">{ownerToolbar}</div> : null}

        <div className={theme.shellClass}>
          <header className={theme.headerClass} style={heroStyle}>
            <div className={`absolute inset-0 ${theme.headerOverlayClass}`} />
            <HeroDecor theme={theme} />
            <div className="relative z-10">
              {model.heroBadges?.length ? (
                <div
                  className={`mb-5 flex flex-wrap gap-2 ${
                    theme.headerAlign === "center" ? "justify-center" : ""
                  }`}
                >
                  {model.heroBadges.map((badge) => (
                    <span key={badge} className={theme.heroBadgeClass}>
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}

              <div
                className={`${
                  theme.headerAlign === "center" ? "mx-auto max-w-5xl text-center" : "max-w-5xl"
                }`}
              >
                {heroVenueLine && (
                  <p className={`text-sm font-black uppercase tracking-[0.34em] ${theme.subtitleClass}`}>
                    {heroVenueLine}
                  </p>
                )}
                <h1
                  className={`${titleTypography.heroClassName} ${theme.titleClass}`}
                  style={{
                    ...titleTypography.fontStyle,
                    ...theme.titleStyle,
                    ...getGymMeetTitleSizeStyle(model.titleSize),
                  }}
                >
                  {model.title}
                </h1>
                <div
                  className={`mt-5 flex flex-wrap gap-4 text-sm font-semibold ${theme.metaClass} ${
                    theme.headerAlign === "center" ? "justify-center" : ""
                  }`}
                >
                  {model.dateLabel ? (
                    <span className="inline-flex items-center gap-2">
                      <Calendar size={16} /> {model.dateLabel}
                    </span>
                  ) : null}
                  {model.timeLabel ? (
                    <span className="inline-flex items-center gap-2">
                      <Clock size={16} /> {model.timeLabel}
                    </span>
                  ) : null}
                  {heroMetaLocation ? <span>{heroMetaLocation}</span> : null}
                </div>
              </div>

              {model.summaryItems?.length ? (
                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {model.summaryItems.map((item) => (
                    <div key={`${item.label}-${item.value}`} className={theme.summaryCardClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-black leading-tight">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </header>

          <div className="relative z-20 -mt-6 px-3 sm:px-5">
            <FloatingActionStrip
              buttonClass={theme.ctaSecondaryClass}
              onShare={onShare}
              onCalendar={onCalendar}
              resourcesHref={hasQuickAccessSection ? "#quick-access" : undefined}
            />
          </div>

          <main className="space-y-5 px-3 pb-5 pt-6 sm:px-5 sm:pb-6 sm:pt-7">
            <section className="space-y-4">
              <div className="sticky top-3 z-20">
                <div className={theme.navShellClass}>
                  <div
                    ref={tabsRailRef}
                    className="no-scrollbar flex gap-2 overflow-x-auto px-1 py-1 pr-12 md:pr-1"
                  >
                    {topTabs.map((tab) => {
                      const Icon = tab.icon;
                      const selected = tab.id === activeTabId;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          ref={(node) => {
                            tabButtonRefs.current[tab.id] = node;
                          }}
                          onClick={() => setActiveTab(tab.id)}
                          className={`${selected ? theme.navActiveClass : theme.navIdleClass} inline-flex max-w-[240px] shrink-0 items-center justify-center gap-2 whitespace-nowrap`}
                          aria-label={tab.label}
                          title={tab.label}
                        >
                          <Icon size={16} className="shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <ShowcaseDiscoveryContent
                model={model}
                theme={theme}
                activeTab={activeTabId}
              />
            </section>

            {(model.rosterAthletes.length > 0 || practiceBlocks.length > 0) ? (
              <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
                {model.rosterAthletes.length > 0 ? (
                  <Section title="Active Roster" eyebrow="Attendance" theme={theme}>
                    <div className="grid gap-3">
                      {model.rosterAthletes.map((athlete: any) => (
                        <div key={athlete.id} className={theme.sectionCardClass}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-black">{athlete.name}</p>
                              <p className="mt-1 text-sm opacity-70">
                                {[athlete.level, athlete.position || athlete.primaryEvents?.join(", ")]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${theme.sectionMutedClass}`}
                            >
                              <Check size={12} /> {formatStatus(athlete.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                ) : null}

                {practiceBlocks.length > 0 ? (
                  <Section title="Practice Planner" eyebrow="Prep" theme={theme}>
                    <div className="space-y-3">
                      {practiceBlocks.map((block: any, idx: number) => (
                        <div key={block.id || idx} className={theme.sectionCardClass}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-base font-black">{block.day}</p>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-60">
                              {block.time ||
                                [formatGymMeetTime(block.startTime), formatGymMeetTime(block.endTime)]
                                  .filter(Boolean)
                                  .join(" - ")}
                            </p>
                          </div>
                          {(Array.isArray(block.focus) ? block.focus.length : block.focus) ? (
                            <p className="mt-2 text-sm opacity-80">
                              Focus: {Array.isArray(block.focus) ? block.focus.join(", ") : block.focus}
                            </p>
                          ) : null}
                          {block.skillGoals || block.description ? (
                            <p className="mt-2 text-sm opacity-70">
                              {block.skillGoals || block.description}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </Section>
                ) : null}
              </div>
            ) : null}

            {(gearItems.length > 0 ||
              model.gear?.uniform ||
              volunteerSlots.length > 0 ||
              carpools.length > 0) ? (
              <Section title="Gear & Support" eyebrow="Operations" theme={theme}>
                <div className="grid gap-3 md:grid-cols-2">
                  {model.gear?.uniform ? (
                    <div className={theme.sectionCardClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        Uniform
                      </p>
                      <p className="mt-2 text-sm">{model.gear.uniform}</p>
                    </div>
                  ) : null}
                  {gearItems.slice(0, 6).map((item: any, idx: number) => {
                    const label = typeof item === "string" ? item : item?.name || `Gear ${idx + 1}`;
                    return (
                      <div key={label} className={theme.sectionCardClass}>
                        <p className="text-sm font-semibold">{label}</p>
                      </div>
                    );
                  })}
                  {volunteerSlots.slice(0, 4).map((slot: any, idx: number) => (
                    <div key={slot.id || idx} className={theme.sectionCardClass}>
                      <p className="text-sm font-semibold">{slot.role || `Volunteer ${idx + 1}`}</p>
                      <p className="mt-1 text-xs opacity-70">{slot.name || "Open slot"}</p>
                    </div>
                  ))}
                  {carpools.slice(0, 3).map((carpool: any, idx: number) => (
                    <div key={carpool.id || idx} className={theme.sectionCardClass}>
                      <p className="text-sm font-semibold">
                        {carpool.driverName || `Driver ${idx + 1}`}
                      </p>
                      <p className="mt-1 text-xs opacity-70">
                        {[carpool.departureLocation, carpool.departureTime]
                          .filter(Boolean)
                          .join(" • ") || "Trip details TBD"}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {rsvpProps.enabled ? (
              <Section title="RSVP" eyebrow="Attendance" theme={theme}>
                {!rsvpProps.submitted ? (
                  <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                          Your Name
                        </label>
                        <input
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                          placeholder="Parent or athlete name"
                          value={rsvpProps.nameInput}
                          onChange={(e) => rsvpProps.setNameInput(e.target.value)}
                        />
                      </div>
                      {!rsvpProps.isSignedIn && rsvpProps.allowGuestAttendanceRsvp ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                            placeholder="Email"
                            value={rsvpProps.guestEmailInput}
                            onChange={(e) => rsvpProps.setGuestEmailInput(e.target.value)}
                          />
                          <input
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                            placeholder="Phone"
                            value={rsvpProps.guestPhoneInput}
                            onChange={(e) => rsvpProps.setGuestPhoneInput(e.target.value)}
                          />
                        </div>
                      ) : null}
                      {rsvpProps.rosterAthletes.length > 0 ? (
                        <select
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                          value={rsvpProps.selectedAthleteId}
                          onChange={(e) => rsvpProps.setSelectedAthleteId(e.target.value)}
                        >
                          <option value="">Choose athlete</option>
                          {rsvpProps.rosterAthletes.map((athlete: any) => (
                            <option key={athlete.id} value={athlete.id}>
                              {[athlete.name, athlete.level].filter(Boolean).join(" • ")}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      {rsvpProps.error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {rsvpProps.error}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={() => rsvpProps.setAttending("yes")}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                          rsvpProps.attending === "yes"
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-black/10 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="font-black uppercase tracking-[0.14em]">Going</div>
                        <div className="mt-1 opacity-75">Athlete will attend this meet.</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => rsvpProps.setAttending("no")}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                          rsvpProps.attending === "no"
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-black/10 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="font-black uppercase tracking-[0.14em]">Not Going</div>
                        <div className="mt-1 opacity-75">Athlete cannot attend.</div>
                      </button>
                      <button
                        onClick={rsvpProps.onSubmit}
                        disabled={rsvpProps.submitting}
                        className={`w-full ${theme.ctaPrimaryClass} disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {rsvpProps.submitting ? "Submitting..." : "Send RSVP"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-emerald-900">
                    <p className="text-lg font-black">Attendance updated.</p>
                    <button
                      onClick={rsvpProps.onReset}
                      className="mt-3 text-sm font-semibold underline underline-offset-4"
                    >
                      Send another response
                    </button>
                  </div>
                )}
              </Section>
            ) : null}

            {model.quickLinks.length > 0 ? (
              <Section id="quick-access" title="Quick Access" eyebrow="Links" theme={theme}>
                <div className="flex flex-wrap gap-2">
                  {model.quickLinks.map((link) =>
                    safeUrl(link.url) || /^data:/i.test(link.url) ? (
                      <a
                        key={link.url}
                        href={link.url}
                        target={/^data:/i.test(link.url) ? undefined : "_blank"}
                        rel={/^data:/i.test(link.url) ? undefined : "noopener noreferrer"}
                        download={/^data:/i.test(link.url) ? "source-file" : undefined}
                        className={theme.ctaSecondaryClass}
                      >
                        {link.label || "Open Link"}
                        <ExternalLink size={14} />
                      </a>
                    ) : null
                  )}
                </div>
              </Section>
            ) : null}

            <footer className="px-2 py-6 text-center text-xs font-semibold uppercase tracking-[0.22em] opacity-50">
              Envitefy Gymnastics Meet Page
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
