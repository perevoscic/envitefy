/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import React from "react";
import { Calendar, Check, Clock, Phone, Share2 } from "lucide-react";
import GymMeetDiscoveryContent from "../GymMeetDiscoveryContent";
import { GymMeetTemplateRendererProps } from "../types";

const formatTime = (value: string) => {
  if (!value) return "";
  try {
    const [h, m] = value.split(":");
    const hour = Number(h);
    const minute = m || "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  } catch {
    return value;
  }
};

const formatStatus = (value: string) => {
  const normalized = String(value || "").replace(/_/g, " ").trim();
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : "Pending";
};

const BaseSection = ({
  title,
  eyebrow,
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  className: string;
  children: React.ReactNode;
}) => (
  <section className={className}>
    {eyebrow ? (
      <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">{eyebrow}</p>
    ) : null}
    <h2 className="mt-2 text-2xl font-black leading-tight">{title}</h2>
    <div className="mt-5">{children}</div>
  </section>
);

export default function BaseGymMeetTemplate({
  model,
  ownerToolbar,
  rsvpProps,
  isReadOnly,
  hideOwnerActions = false,
  onShare,
  onGoogleCalendar,
  onAppleCalendar,
  onOutlookCalendar,
  variant,
}: GymMeetTemplateRendererProps & {
  variant: {
    pageClass: string;
    shellClass: string;
    titleClass: string;
    mutedClass: string;
    heroPanelClass: string;
    chipClass: string;
    navShellClass: string;
    navActiveClass: string;
    navIdleClass: string;
    navFadeClass?: string;
    summaryCardClass: string;
    sectionClass: string;
    sectionMutedClass?: string;
    primaryButtonClass: string;
    secondaryButtonClass: string;
    timeline?: boolean;
  };
}) {
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

  const heroStyle = model.heroImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.22), rgba(2,6,23,0.56)), url(${model.heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <div className={variant.pageClass}>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {!isReadOnly && !hideOwnerActions && ownerToolbar ? <div className="mb-4">{ownerToolbar}</div> : null}

        <div className={variant.shellClass}>
          <header className={`relative overflow-hidden ${variant.heroPanelClass}`} style={heroStyle}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_36%)]" />
            <div className="relative px-5 py-8 sm:px-8 sm:py-10">
              {model.heroBadges.length > 0 ? (
                <div className="mb-5 flex flex-wrap gap-2">
                  {model.heroBadges.map((badge) => (
                    <span key={badge} className={variant.chipClass}>
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr] lg:items-end">
                <div>
                  <h1 className={variant.titleClass}>{model.title}</h1>
                  <div className={`mt-4 flex flex-wrap gap-4 text-sm font-semibold ${variant.mutedClass}`}>
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
                    {model.headerLocation ? <span>{model.headerLocation}</span> : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {model.summaryItems.slice(0, 2).map((item) => (
                    <div key={item.label} className={variant.summaryCardClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-black leading-none">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <main className="space-y-4 px-3 py-5 sm:px-5 sm:py-6">
            <GymMeetDiscoveryContent model={model} variant={variant} />

            {(model.rosterAthletes.length > 0 || practiceBlocks.length > 0) ? (
              <div
                className={`grid gap-4 ${
                  variant.timeline ? "lg:grid-cols-[0.95fr_1.05fr]" : "lg:grid-cols-2"
                }`}
              >
                {model.rosterAthletes.length > 0 ? (
                  <BaseSection title="Active Roster" eyebrow="Attendance" className={variant.sectionClass}>
                    <div className="grid gap-3">
                      {model.rosterAthletes.map((athlete: any) => (
                        <div key={athlete.id} className={variant.summaryCardClass}>
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
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                                variant.sectionMutedClass || "bg-black/5"
                              }`}
                            >
                              <Check size={12} /> {formatStatus(athlete.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </BaseSection>
                ) : null}

                {practiceBlocks.length > 0 ? (
                  <BaseSection title="Practice Planner" eyebrow="Prep" className={variant.sectionClass}>
                    <div className="space-y-3">
                      {practiceBlocks.map((block: any, idx: number) => (
                        <div key={block.id || idx} className={variant.summaryCardClass}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-base font-black">{block.day}</p>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-60">
                              {block.time ||
                                [formatTime(block.startTime), formatTime(block.endTime)]
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
                            <p className="mt-2 text-sm opacity-70">{block.skillGoals || block.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </BaseSection>
                ) : null}
              </div>
            ) : null}

            {(gearItems.length > 0 ||
              model.gear?.uniform ||
              volunteerSlots.length > 0 ||
              carpools.length > 0) ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <BaseSection title="Gear & Support" eyebrow="Operations" className={variant.sectionClass}>
                  {model.gear?.uniform ? (
                    <div className={variant.summaryCardClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        Uniform
                      </p>
                      <p className="mt-2 text-sm">{model.gear.uniform}</p>
                    </div>
                  ) : null}
                  {gearItems.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {gearItems.slice(0, 8).map((item: any, idx: number) => {
                        const label = typeof item === "string" ? item : item?.name || `Gear ${idx + 1}`;
                        return (
                          <div key={label} className={variant.summaryCardClass}>
                            <p className="text-sm font-semibold">{label}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {volunteerSlots.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        Volunteer Slots
                      </p>
                      <div className="mt-3 grid gap-2">
                        {volunteerSlots.slice(0, 4).map((slot: any, idx: number) => (
                          <div key={slot.id || idx} className={variant.summaryCardClass}>
                            <p className="text-sm font-semibold">{slot.role || `Volunteer ${idx + 1}`}</p>
                            <p className="mt-1 text-xs opacity-70">{slot.name || "Open slot"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {carpools.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                        Carpool
                      </p>
                      <div className="mt-3 grid gap-2">
                        {carpools.slice(0, 3).map((carpool: any, idx: number) => (
                          <div key={carpool.id || idx} className={variant.summaryCardClass}>
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
                    </div>
                  ) : null}
                </BaseSection>
              </div>
            ) : null}

            {model.announcements.length > 0 ? (
              <BaseSection title="Announcements" eyebrow="Communication" className={variant.sectionClass}>
                <div className="space-y-3">
                  {model.announcements.slice(0, 4).map((item) => (
                    <div key={item.id} className={variant.summaryCardClass}>
                      <p className="text-base font-black">{item.title}</p>
                      {item.body ? <p className="mt-2 text-sm opacity-75">{item.body}</p> : null}
                      {item.date ? (
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] opacity-50">
                          {item.date}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </BaseSection>
            ) : null}

            {rsvpProps.enabled ? (
              <div id="rsvp">
                <BaseSection title="RSVP" eyebrow="Attendance" className={variant.sectionClass}>
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
                      <div className="space-y-4">
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
                        </div>
                        <button
                          onClick={rsvpProps.onSubmit}
                          disabled={rsvpProps.submitting}
                          className={`w-full ${variant.primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
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
                </BaseSection>
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <BaseSection title="Add to Calendar" eyebrow="Share" className={variant.sectionClass}>
                <div className="flex flex-wrap gap-3">
                  <button onClick={onShare} className={variant.secondaryButtonClass}>
                    <Share2 size={14} /> Share
                  </button>
                  <button onClick={onGoogleCalendar} className={variant.secondaryButtonClass}>
                    <Calendar size={14} /> Google
                  </button>
                  <button onClick={onAppleCalendar} className={variant.secondaryButtonClass}>
                    <Calendar size={14} /> Apple
                  </button>
                  <button onClick={onOutlookCalendar} className={variant.secondaryButtonClass}>
                    <Calendar size={14} /> Outlook
                  </button>
                </div>
              </BaseSection>

              {(model.quickLinks.length > 0 || model.coachPhone) ? (
                <BaseSection title="Quick Access" eyebrow="Links" className={variant.sectionClass}>
                  <div className="flex flex-wrap gap-2">
                    {model.quickLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={variant.secondaryButtonClass}
                      >
                        {link.label || "Open Link"}
                      </a>
                    ))}
                    {model.coachPhone ? (
                      <a href={`tel:${model.coachPhone}`} className={variant.secondaryButtonClass}>
                        <Phone size={14} /> Contact Coach
                      </a>
                    ) : null}
                  </div>
                </BaseSection>
              ) : null}
            </div>

            <footer className="px-2 py-6 text-center text-xs font-semibold uppercase tracking-[0.22em] opacity-50">
              Envitefy Gymnastics Meet Page
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
