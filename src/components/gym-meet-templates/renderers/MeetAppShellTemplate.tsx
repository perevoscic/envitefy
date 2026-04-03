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
import { getGymMeetTitleTypography } from "../titleTypography";
import { getGymMeetTitleSizeStyle } from "../titleSizing";
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
          className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700"
        >
          {item}
        </div>
      ))}
    </div>
  );
};

const AppCard = ({
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
    className="rounded-[28px] border border-slate-200 bg-white/92 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur"
  >
    {title ? (
      <div className="mb-4">
        {subtitle ? (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">
            {subtitle}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{title}</h2>
      </div>
    ) : null}
    {children}
  </section>
);

const RSVPCard = ({ rsvpProps }: { rsvpProps: GymMeetTemplateRendererProps["rsvpProps"] }) => {
  if (!rsvpProps.enabled) return null;

  return (
    <AppCard title="RSVP" subtitle="Primary CTA">
      {!rsvpProps.submitted ? (
        <div className="space-y-3">
          <input
            className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white"
            placeholder="Parent or athlete name"
            value={rsvpProps.nameInput}
            onChange={(e) => rsvpProps.setNameInput(e.target.value)}
          />
          {!rsvpProps.isSignedIn && rsvpProps.allowGuestAttendanceRsvp ? (
            <div className="grid gap-3">
              <input
                className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white"
                placeholder="Email"
                value={rsvpProps.guestEmailInput}
                onChange={(e) => rsvpProps.setGuestEmailInput(e.target.value)}
              />
              <input
                className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white"
                placeholder="Phone"
                value={rsvpProps.guestPhoneInput}
                onChange={(e) => rsvpProps.setGuestPhoneInput(e.target.value)}
              />
            </div>
          ) : null}
          {rsvpProps.rosterAthletes.length > 0 ? (
            <select
              className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white"
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
              className={`rounded-[22px] border px-4 py-4 text-left text-sm transition ${
                rsvpProps.attending === "yes"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="font-black uppercase tracking-[0.14em]">Going</div>
              <div className="mt-1 opacity-75">Athlete will attend this meet.</div>
            </button>
            <button
              type="button"
              onClick={() => rsvpProps.setAttending("no")}
              className={`rounded-[22px] border px-4 py-4 text-left text-sm transition ${
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
            className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-slate-950 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    </AppCard>
  );
};

export default function MeetAppShellTemplate({
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
  const [activeTab, setActiveTab] = useState<"home" | "schedule" | "participants" | "more">("home");
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
  const locationLine = [model.venue || model.headerLocation, model.address || model.mapAddress]
    .filter(Boolean)
    .join(" • ");
  const primaryHeroAction = rsvpProps.enabled
    ? {
        label: rsvpProps.submitted ? "Manage RSVP" : "RSVP Now",
        onClick: () => setActiveTab("more"),
      }
    : { label: "Share Meet", onClick: onShare };

  const discoveryVariant = useMemo(
    () => ({
      sectionClass:
        "rounded-[24px] border border-slate-200 bg-white/88 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]",
      summaryCardClass:
        "rounded-[20px] border border-slate-200 bg-slate-50/90 px-4 py-4 text-slate-900 shadow-sm",
      navShellClass:
        "rounded-[22px] border border-slate-200 bg-white/92 px-2 py-2 shadow-sm backdrop-blur",
      navActiveClass:
        "rounded-full bg-slate-950 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
      navIdleClass:
        "rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-white",
      navFadeClass: "rgba(244,244,245,0.94)",
      secondaryButtonClass:
        "inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-50",
      primaryButtonClass:
        "inline-flex items-center justify-center gap-2 rounded-[18px] bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-violet-700",
      sectionTitleClass: "text-slate-950",
    }),
    [],
  );

  const bottomTabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "schedule", label: "Schedule", icon: CalendarRange },
    { id: "participants", label: "Participants", icon: Users },
    { id: "more", label: "More", icon: MoreHorizontal },
  ] as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ede9fe_0%,#f8fafc_32%,#e2e8f0_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {!isReadOnly && !hideOwnerActions && ownerToolbar ? <div className="mb-4">{ownerToolbar}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[430px]">
            <div className="overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(30,41,59,0.94)_20%,rgba(248,250,252,0.98)_21%,rgba(248,250,252,0.98)_100%)] shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
              <div className="px-5 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">
                      Meet Day
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
                  className="relative mt-4 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,#0f172a_0%,#312e81_58%,#8b5cf6_100%)] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.25)]"
                  style={
                    model.heroImage
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.18), rgba(15,23,42,0.62)), url(${model.heroImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%)]" />
                  <div className="relative">
                    {model.heroBadges?.length ? (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {model.heroBadges.slice(0, 4).map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/90 backdrop-blur"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <h1
                      className={`${titleTypography.heroClassName} max-w-[11ch] text-4xl font-black leading-[0.96] tracking-tight sm:text-5xl`}
                      style={{
                        ...titleTypography.fontStyle,
                        ...getGymMeetTitleSizeStyle(model.titleSize),
                      }}
                    >
                      {model.title}
                    </h1>

                    <div className="mt-4 space-y-2 text-sm font-semibold text-white/85">
                      {model.dateLabel ? (
                        <div className="flex items-center gap-2">
                          <Calendar size={15} />
                          <span>{model.dateLabel}</span>
                        </div>
                      ) : null}
                      {model.timeLabel ? (
                        <div className="flex items-center gap-2">
                          <Clock3 size={15} />
                          <span>{model.timeLabel}</span>
                        </div>
                      ) : null}
                      {locationLine ? (
                        <div className="flex items-start gap-2">
                          <MapPin size={15} className="mt-0.5 shrink-0" />
                          <span>{locationLine}</span>
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={primaryHeroAction.onClick}
                      className="mt-5 flex w-full items-center justify-between rounded-[22px] bg-white px-4 py-4 text-left text-slate-950 shadow-lg transition hover:bg-violet-50"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">
                          Primary Action
                        </p>
                        <p className="mt-1 text-base font-black">{primaryHeroAction.label}</p>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="relative z-10 -mt-5 px-2">
                  {!suppressActionStrip ? (
                    <FloatingActionStrip
                      buttonClass="inline-flex items-center gap-2 rounded-[18px] border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                      onShare={onShare}
                      onCalendar={onCalendar}
                      resourcesHref={model.quickLinks.length > 0 ? "#quick-access" : undefined}
                    />
                  ) : null}
                </div>

                <div className="mt-5 space-y-4">
                  {activeTab === "home" ? (
                    <>
                      {model.summaryItems.length > 0 ? (
                        <AppCard title="Today at a Glance" subtitle="Snapshot">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {model.summaryItems.slice(0, 4).map((item) => (
                              <div
                                key={item.label}
                                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                              >
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                  {item.label}
                                </p>
                                <p className="mt-2 text-lg font-black leading-tight text-slate-950">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AppCard>
                      ) : null}

                      {model.heroSummary || model.detailsText ? (
                        <AppCard title="Overview" subtitle="What To Know">
                          <p className="text-sm leading-7 text-slate-700">
                            {model.heroSummary || model.detailsText}
                          </p>
                        </AppCard>
                      ) : null}

                      {model.announcements.length > 0 ? (
                        <AppCard title="Announcements" subtitle="Live Updates">
                          <div className="space-y-3">
                            {model.announcements.slice(0, 3).map((announcement) => (
                              <div
                                key={announcement.id}
                                className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4"
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
                        </AppCard>
                      ) : null}

                      {model.venueFacts.length > 0 ? (
                        <AppCard title="Venue Facts" subtitle="Arrive Ready">
                          {renderList(model.venueFacts)}
                        </AppCard>
                      ) : null}
                    </>
                  ) : null}

                  {activeTab === "schedule" ? (
                    Array.isArray(model.discovery?.sections) && model.discovery.sections.length > 0 ? (
                      <GymMeetDiscoveryContent model={model} variant={discoveryVariant} />
                    ) : (
                      <AppCard title="Schedule" subtitle="Coming Up">
                        <div className="space-y-3">
                          {[model.dateLabel, model.timeLabel, locationLine]
                            .filter(Boolean)
                            .map((line) => (
                              <div
                                key={line}
                                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
                              >
                                {line}
                              </div>
                            ))}
                        </div>
                      </AppCard>
                    )
                  ) : null}

                  {activeTab === "participants" ? (
                    <>
                      {model.rosterAthletes.length > 0 ? (
                        <AppCard title="Participants" subtitle="Roster">
                          <div className="space-y-3">
                            {model.rosterAthletes.map((athlete: any) => (
                              <div
                                key={athlete.id}
                                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
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
                        </AppCard>
                      ) : null}

                      {practiceBlocks.length > 0 ? (
                        <AppCard title="Practice Blocks" subtitle="Prep">
                          <div className="space-y-3">
                            {practiceBlocks.map((block: any, index: number) => (
                              <div
                                key={block.id || `${block.day}-${index}`}
                                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
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
                        </AppCard>
                      ) : null}
                    </>
                  ) : null}

                  {activeTab === "more" ? (
                    <>
                      <RSVPCard rsvpProps={rsvpProps} />

                      {model.quickLinks.length > 0 ? (
                        <AppCard id="quick-access" title="Quick Access" subtitle="Resources">
                          <div className="grid gap-2">
                            {model.quickLinks.map((link) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target={/^data:/i.test(link.url) ? undefined : "_blank"}
                                rel={/^data:/i.test(link.url) ? undefined : "noopener noreferrer"}
                                download={/^data:/i.test(link.url) ? "source-file" : undefined}
                                className="inline-flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white"
                              >
                                <span>{link.label || "Open Link"}</span>
                                <ExternalLink size={14} />
                              </a>
                            ))}
                          </div>
                        </AppCard>
                      ) : null}

                      {(gearItems.length > 0 || volunteerSlots.length > 0) ? (
                        <AppCard title="Gear & Support" subtitle="Meet Day Ops">
                          <div className="space-y-4">
                            {gearItems.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                  Pack List
                                </p>
                                {gearItems.slice(0, 8).map((item: any, index: number) => {
                                  const label =
                                    typeof item === "string" ? item : item?.name || `Gear ${index + 1}`;
                                  return (
                                    <div
                                      key={label}
                                      className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
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
                                    className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
                                  >
                                    <p className="text-sm font-semibold text-slate-900">
                                      {slot.role || `Volunteer ${index + 1}`}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {slot.name || "Open slot"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </AppCard>
                      ) : null}

                      {model.logisticsNotes.length > 0 ? (
                        <AppCard title="Logistics Notes" subtitle="Before You Go">
                          {renderList(model.logisticsNotes)}
                        </AppCard>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              <nav className="sticky bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
                <div className="grid grid-cols-4 gap-2">
                  {bottomTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = tab.id === activeTab;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-3 text-[11px] font-black uppercase tracking-[0.12em] transition ${
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
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-5 space-y-4">
              <AppCard title="Desktop Companion" subtitle="At A Glance">
                <div className="grid gap-3">
                  {[
                    { label: "Host Gym", value: model.hostGym || model.team },
                    { label: "Venue", value: model.venue || model.headerLocation },
                    { label: "Address", value: model.address || model.mapAddress },
                    { label: "Coach", value: model.coach },
                    { label: "Assigned Gym", value: model.assignedGym },
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{item.value}</p>
                      </div>
                    ))}
                </div>
              </AppCard>

              {model.spectatorNotes.length > 0 ? (
                <AppCard title="Spectator Notes" subtitle="For Families">
                  {renderList(model.spectatorNotes)}
                </AppCard>
              ) : null}

              {model.rulesNotes.length > 0 ? (
                <AppCard title="Rules & Policies" subtitle="Know Before You Go">
                  {renderList(model.rulesNotes)}
                </AppCard>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
