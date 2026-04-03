"use client";

import React, { useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  CalendarRange,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Home,
  MapPin,
  MoreHorizontal,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";

import FloatingActionStrip from "../FloatingActionStrip";
import GymMeetDiscoveryContent from "../GymMeetDiscoveryContent";
import { getGymMeetTitleSizeStyle } from "../titleSizing";
import { getGymMeetTitleTypography } from "../titleTypography";
import { GymMeetTemplateRendererProps } from "../types";

const formatStatus = (value: string) => {
  const normalized = String(value || "").replace(/_/g, " ").trim();
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : "Pending";
};

const renderList = (items: string[] = []) => {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-[24px] border border-slate-200 bg-white/88 px-4 py-3 text-sm text-slate-700 shadow-sm"
        >
          {item}
        </div>
      ))}
    </div>
  );
};

const ShellCard = ({
  title,
  subtitle,
  id,
  children,
}: {
  title?: string;
  subtitle?: string;
  id?: string;
  children: React.ReactNode;
}) => (
  <section
    id={id}
    className="rounded-[30px] border border-white/70 bg-white/92 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur"
  >
    {title ? (
      <div className="mb-4">
        {subtitle ? (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
            {subtitle}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{title}</h2>
      </div>
    ) : null}
    {children}
  </section>
);

const SummaryGrid = ({ items }: { items: Array<{ label: string; value: string }> }) => {
  if (!items.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 text-lg font-black leading-tight text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

const RosterBlock = ({ athletes }: { athletes: any[] }) => {
  if (!athletes.length) return null;

  return (
    <div className="space-y-3">
      {athletes.map((athlete) => (
        <div
          key={athlete.id}
          className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-black text-slate-950">{athlete.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {[athlete.level, athlete.position || athlete.primaryEvents?.join(", ")]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              <Check size={12} />
              {formatStatus(athlete.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const PracticeBlock = ({ blocks }: { blocks: any[] }) => {
  if (!blocks.length) return null;

  return (
    <div className="space-y-3">
      {blocks.map((block: any, index: number) => (
        <div
          key={block.id || `${block.day}-${index}`}
          className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-black text-slate-950">{block.day || "Practice"}</p>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              {block.time || [block.startTime, block.endTime].filter(Boolean).join(" - ")}
            </p>
          </div>
          {block.skillGoals || block.description ? (
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {block.skillGoals || block.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
};

const QuickLinksBlock = ({ links }: { links: any[] }) => {
  if (!links.length) return null;

  return (
    <div className="grid gap-2">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target={/^data:/i.test(link.url) ? undefined : "_blank"}
          rel={/^data:/i.test(link.url) ? undefined : "noopener noreferrer"}
          download={/^data:/i.test(link.url) ? "source-file" : undefined}
          className="inline-flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
        >
          <span>{link.label || "Open Link"}</span>
          <ExternalLink size={14} />
        </a>
      ))}
    </div>
  );
};

const SupportBlock = ({
  gearItems,
  volunteerSlots,
}: {
  gearItems: any[];
  volunteerSlots: any[];
}) => {
  if (!gearItems.length && !volunteerSlots.length) return null;

  return (
    <div className="space-y-4">
      {gearItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Pack List
          </p>
          {gearItems.slice(0, 8).map((item: any, index: number) => {
            const label = typeof item === "string" ? item : item?.name || `Gear ${index + 1}`;
            return (
              <div
                key={label}
                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                {label}
              </div>
            );
          })}
        </div>
      ) : null}

      {volunteerSlots.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Volunteer Slots
          </p>
          {volunteerSlots.slice(0, 4).map((slot: any, index: number) => (
            <div
              key={slot.id || index}
              className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <p className="text-sm font-semibold text-slate-900">
                {slot.role || `Volunteer ${index + 1}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">{slot.name || "Open slot"}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const RSVPCard = ({ rsvpProps }: { rsvpProps: GymMeetTemplateRendererProps["rsvpProps"] }) => {
  if (!rsvpProps.enabled) return null;

  return (
    <ShellCard title="RSVP" subtitle="Primary CTA">
      {!rsvpProps.submitted ? (
        <div className="space-y-3">
          <input
            className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
            placeholder="Parent or athlete name"
            value={rsvpProps.nameInput}
            onChange={(e) => rsvpProps.setNameInput(e.target.value)}
          />
          {!rsvpProps.isSignedIn && rsvpProps.allowGuestAttendanceRsvp ? (
            <div className="grid gap-3">
              <input
                className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                placeholder="Email"
                value={rsvpProps.guestEmailInput}
                onChange={(e) => rsvpProps.setGuestEmailInput(e.target.value)}
              />
              <input
                className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                placeholder="Phone"
                value={rsvpProps.guestPhoneInput}
                onChange={(e) => rsvpProps.setGuestPhoneInput(e.target.value)}
              />
            </div>
          ) : null}
          {rsvpProps.rosterAthletes.length > 0 ? (
            <select
              className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
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
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => rsvpProps.setAttending("yes")}
              className={`rounded-[24px] border px-4 py-4 text-left text-sm transition ${
                rsvpProps.attending === "yes"
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="font-black uppercase tracking-[0.14em]">Going</div>
              <div className="mt-1 opacity-75">Athlete will attend this meet.</div>
            </button>
            <button
              type="button"
              onClick={() => rsvpProps.setAttending("no")}
              className={`rounded-[24px] border px-4 py-4 text-left text-sm transition ${
                rsvpProps.attending === "no"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="font-black uppercase tracking-[0.14em]">Not Going</div>
              <div className="mt-1 opacity-75">Athlete cannot attend.</div>
            </button>
          </div>
          {rsvpProps.error ? (
            <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {rsvpProps.error}
            </div>
          ) : null}
          <button
            type="button"
            onClick={rsvpProps.onSubmit}
            disabled={rsvpProps.submitting}
            className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-slate-950 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={16} />
            {rsvpProps.submitting ? "Submitting..." : "Send RSVP"}
          </button>
        </div>
      ) : (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-5 text-emerald-900">
          <p className="text-lg font-black">Attendance updated.</p>
          <button
            type="button"
            onClick={rsvpProps.onReset}
            className="mt-3 text-sm font-semibold underline underline-offset-4"
          >
            Send another response
          </button>
        </div>
      )}
    </ShellCard>
  );
};

export default function SessionCompanionTemplate({
  model,
  ownerToolbar,
  rsvpProps,
  isReadOnly,
  hideOwnerActions = false,
  suppressActionStrip = false,
  onShare,
  onCalendar,
}: GymMeetTemplateRendererProps) {
  const titleTypography = getGymMeetTitleTypography(model.pageTemplateId);
  const [activeTab, setActiveTab] = useState<"home" | "schedule" | "participants" | "more">(
    "home"
  );
  const practiceBlocks = Array.isArray(model.practiceBlocks) ? model.practiceBlocks : [];
  const volunteerSlots = Array.isArray(model.volunteers?.volunteerSlots)
    ? model.volunteers.volunteerSlots
    : Array.isArray(model.volunteers?.slots)
      ? model.volunteers.slots
      : [];
  const gearItems = Array.isArray(model.gear?.items)
    ? model.gear.items
    : Array.isArray(model.gear)
      ? model.gear
      : [];
  const discoverySections = Array.isArray(model.discovery?.sections) ? model.discovery.sections : [];
  const locationLine = [model.venue || model.headerLocation, model.address || model.mapAddress]
    .filter(Boolean)
    .join(" • ");
  const heroStats = model.summaryItems.slice(0, 3);
  const desktopStats = model.summaryItems.slice(0, 4);
  const overviewText = model.heroSummary || model.detailsText;
  const heroStyle = model.heroImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.12), rgba(15,23,42,0.42)), url(${model.heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;
  const primaryHeroAction = rsvpProps.enabled
    ? {
        label: rsvpProps.submitted ? "Manage RSVP" : "Tap To RSVP",
        sublabel: rsvpProps.submitted ? "Edit response in More" : "Confirm attendance fast",
        onClick: () => setActiveTab("more"),
      }
    : {
        label: discoverySections.length > 0 ? "Open Schedule" : "Share Meet",
        sublabel: discoverySections.length > 0 ? "Jump to the live agenda" : "Send the public page",
        onClick: discoverySections.length > 0 ? () => setActiveTab("schedule") : onShare,
      };

  const discoveryVariant = useMemo(
    () => ({
      sectionClass:
        "rounded-[26px] border border-white/80 bg-white/94 px-4 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)]",
      summaryCardClass:
        "rounded-[22px] border border-sky-100 bg-sky-50/80 px-4 py-4 text-slate-900 shadow-sm",
      navShellClass:
        "rounded-[24px] border border-white/80 bg-white/94 px-2 py-2 shadow-[0_10px_25px_rgba(15,23,42,0.08)] backdrop-blur",
      navActiveClass:
        "rounded-full bg-slate-950 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
      navIdleClass:
        "rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-white",
      navFadeClass: "rgba(248,250,252,0.96)",
      secondaryButtonClass:
        "inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-50",
      primaryButtonClass:
        "inline-flex items-center justify-center gap-2 rounded-[18px] bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-sky-600",
      sectionTitleClass: "text-slate-950",
    }),
    []
  );

  const bottomTabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "schedule", label: "Schedule", icon: CalendarRange },
    { id: "participants", label: "Participants", icon: Users },
    { id: "more", label: "More", icon: MoreHorizontal },
  ] as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_26%,#f8fafc_58%,#e2e8f0_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {!isReadOnly && !hideOwnerActions && ownerToolbar ? <div className="mb-4">{ownerToolbar}</div> : null}

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[38px] border border-white/80 bg-white/75 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <div className="bg-[linear-gradient(160deg,#0f172a_0%,#1d4ed8_56%,#38bdf8_100%)] p-5 text-white sm:p-6 lg:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-200">
                      Session Companion
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white/80">
                      {model.hostGym || model.team || "Gymnastics"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onShare}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                    aria-label="Share meet"
                  >
                    <Share2 size={18} />
                  </button>
                </div>

                <div
                  className="relative mt-5 min-h-[220px] overflow-hidden rounded-[32px] border border-white/15 bg-[linear-gradient(155deg,#172554_0%,#1d4ed8_58%,#60a5fa_100%)]"
                  style={heroStyle}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_36%)]" />
                  {!model.heroImage ? (
                    <div className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.08)_100%)]" />
                  ) : null}
                </div>

                <div className="-mt-8 relative z-10 rounded-[30px] bg-white px-5 py-5 text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                  {model.heroBadges?.length ? (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {model.heroBadges.slice(0, 4).map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <h1
                    className={`${titleTypography.heroClassName} max-w-[14ch] text-[clamp(2rem,8vw,3.8rem)] font-black leading-[0.94] tracking-tight text-slate-950`}
                    style={{
                      ...titleTypography.fontStyle,
                      ...getGymMeetTitleSizeStyle(model.titleSize),
                    }}
                  >
                    {model.title}
                  </h1>

                  <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                    {model.dateLabel ? (
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-sky-600" />
                        <span>{model.dateLabel}</span>
                      </div>
                    ) : null}
                    {model.timeLabel ? (
                      <div className="flex items-center gap-2">
                        <Clock3 size={15} className="text-sky-600" />
                        <span>{model.timeLabel}</span>
                      </div>
                    ) : null}
                    {locationLine ? (
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="mt-0.5 shrink-0 text-sky-600" />
                        <span>{locationLine}</span>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={primaryHeroAction.onClick}
                    className="mt-5 flex w-full items-center justify-between rounded-[24px] bg-orange-500 px-4 py-4 text-left text-white shadow-lg transition hover:bg-orange-400"
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-100">
                        Primary Action
                      </p>
                      <p className="mt-1 text-base font-black">{primaryHeroAction.label}</p>
                      <p className="mt-1 text-xs font-semibold text-orange-100/90">
                        {primaryHeroAction.sublabel}
                      </p>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,250,252,0.96)_100%)] p-5 sm:p-6 lg:p-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">
                      At A Glance
                    </p>
                    <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                      Desktop Companion
                    </h2>
                  </div>

                  <SummaryGrid items={desktopStats} />

                  {overviewText ? (
                    <ShellCard title="Overview" subtitle="Meet Brief">
                      <p className="text-sm leading-7 text-slate-700">{overviewText}</p>
                    </ShellCard>
                  ) : null}

                  <ShellCard title="Location" subtitle="Venue">
                    <div className="space-y-3">
                      {[model.hostGym || model.team, model.venue || model.headerLocation, model.address || model.mapAddress]
                        .filter(Boolean)
                        .map((line, index) => (
                          <div
                            key={`${line}-${index}`}
                            className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
                          >
                            {line}
                          </div>
                        ))}
                    </div>
                  </ShellCard>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            {!suppressActionStrip ? (
              <FloatingActionStrip
                buttonClass="inline-flex items-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                onShare={onShare}
                onCalendar={onCalendar}
                resourcesHref={model.quickLinks.length > 0 ? "#quick-access" : undefined}
              />
            ) : null}
          </div>

          <div className="lg:hidden rounded-[28px] border border-white/70 bg-white/60 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="space-y-4 px-2 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-2">
              {heroStats.length > 0 ? (
                <ShellCard title="At A Glance" subtitle="Snapshot">
                  <SummaryGrid items={heroStats} />
                </ShellCard>
              ) : null}

              <div className="space-y-4">
                {activeTab === "home" ? (
                  <>
                    {overviewText ? (
                      <ShellCard title="Overview" subtitle="Meet Brief">
                        <p className="text-sm leading-7 text-slate-700">{overviewText}</p>
                      </ShellCard>
                    ) : null}

                    {model.announcements.length > 0 ? (
                      <ShellCard title="Announcements" subtitle="Live Updates">
                        <div className="space-y-3">
                          {model.announcements.slice(0, 3).map((announcement) => (
                            <div
                              key={announcement.id}
                              className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4"
                            >
                              <div className="flex items-start gap-3">
                                <Bell size={16} className="mt-0.5 text-amber-600" />
                                <div>
                                  <p className="font-black text-slate-950">{announcement.title}</p>
                                  <p className="mt-1 text-sm leading-6 text-slate-700">
                                    {announcement.body}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ShellCard>
                    ) : null}

                    {model.venueFacts.length > 0 ? (
                      <ShellCard title="Venue Facts" subtitle="Arrive Ready">
                        {renderList(model.venueFacts)}
                      </ShellCard>
                    ) : null}
                  </>
                ) : null}

                {activeTab === "schedule" ? (
                  discoverySections.length > 0 ? (
                    <GymMeetDiscoveryContent model={model} variant={discoveryVariant} />
                  ) : (
                    <ShellCard title="Schedule" subtitle="Coming Up">
                      <div className="space-y-3">
                        {[model.dateLabel, model.timeLabel, locationLine]
                          .filter(Boolean)
                          .map((line) => (
                            <div
                              key={line}
                              className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
                            >
                              {line}
                            </div>
                          ))}
                      </div>
                    </ShellCard>
                  )
                ) : null}

                {activeTab === "participants" ? (
                  <>
                    {model.rosterAthletes.length > 0 ? (
                      <ShellCard title="Participants" subtitle="Roster">
                        <RosterBlock athletes={model.rosterAthletes} />
                      </ShellCard>
                    ) : null}

                    {practiceBlocks.length > 0 ? (
                      <ShellCard title="Practice Blocks" subtitle="Prep">
                        <PracticeBlock blocks={practiceBlocks} />
                      </ShellCard>
                    ) : null}
                  </>
                ) : null}

                {activeTab === "more" ? (
                  <>
                    <RSVPCard rsvpProps={rsvpProps} />

                    {model.quickLinks.length > 0 ? (
                      <ShellCard id="quick-access" title="Quick Access" subtitle="Resources">
                        <QuickLinksBlock links={model.quickLinks} />
                      </ShellCard>
                    ) : null}

                    {gearItems.length > 0 || volunteerSlots.length > 0 ? (
                      <ShellCard title="Gear & Support" subtitle="Meet Day Ops">
                        <SupportBlock gearItems={gearItems} volunteerSlots={volunteerSlots} />
                      </ShellCard>
                    ) : null}

                    {model.logisticsNotes.length > 0 ? (
                      <ShellCard title="Logistics Notes" subtitle="Before You Go">
                        {renderList(model.logisticsNotes)}
                      </ShellCard>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            <nav className="sticky bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.8rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
              <div className="grid grid-cols-4 gap-2">
                {bottomTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-3 text-[11px] font-black uppercase tracking-[0.12em] transition ${
                        active
                          ? "bg-slate-950 text-white shadow-lg"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          <div className="hidden lg:grid lg:gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-6">
              {discoverySections.length > 0 ? (
                <ShellCard title="Schedule & Details" subtitle="Live Agenda">
                  <GymMeetDiscoveryContent model={model} variant={discoveryVariant} />
                </ShellCard>
              ) : null}

              {practiceBlocks.length > 0 ? (
                <ShellCard title="Practice Blocks" subtitle="Prep">
                  <PracticeBlock blocks={practiceBlocks} />
                </ShellCard>
              ) : null}

              {model.announcements.length > 0 ? (
                <ShellCard title="Announcements" subtitle="Live Updates">
                  <div className="space-y-3">
                    {model.announcements.slice(0, 4).map((announcement) => (
                      <div
                        key={announcement.id}
                        className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4"
                      >
                        <div className="flex items-start gap-3">
                          <Bell size={16} className="mt-0.5 text-amber-600" />
                          <div>
                            <p className="font-black text-slate-950">{announcement.title}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">
                              {announcement.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ShellCard>
              ) : null}
            </div>

            <div className="space-y-6">
              {model.rosterAthletes.length > 0 ? (
                <ShellCard title="Participants" subtitle="Roster">
                  <RosterBlock athletes={model.rosterAthletes} />
                </ShellCard>
              ) : null}

              {model.quickLinks.length > 0 ? (
                <ShellCard id="quick-access" title="Quick Access" subtitle="Resources">
                  <QuickLinksBlock links={model.quickLinks} />
                </ShellCard>
              ) : null}

              <RSVPCard rsvpProps={rsvpProps} />

              {gearItems.length > 0 || volunteerSlots.length > 0 ? (
                <ShellCard title="Gear & Support" subtitle="Meet Day Ops">
                  <SupportBlock gearItems={gearItems} volunteerSlots={volunteerSlots} />
                </ShellCard>
              ) : null}

              {model.venueFacts.length > 0 ? (
                <ShellCard title="Venue Facts" subtitle="Arrive Ready">
                  {renderList(model.venueFacts)}
                </ShellCard>
              ) : null}

              {model.logisticsNotes.length > 0 ? (
                <ShellCard title="Logistics Notes" subtitle="Before You Go">
                  {renderList(model.logisticsNotes)}
                </ShellCard>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
