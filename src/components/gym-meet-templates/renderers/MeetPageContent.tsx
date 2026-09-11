/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import EventGuestPlanningNotes from "@/components/event-templates/EventGuestPlanningNotes";
import EnvitefyEventBranding from "@/components/branding/EnvitefyEventBranding";

import { Check } from "lucide-react";
import React from "react";
import FloatingActionStrip from "../FloatingActionStrip";
import GymMeetDiscoveryContent from "../GymMeetDiscoveryContent";
import { GymnasticsPageBody } from "../GymnasticsProgram";
import type { GymnasticsPresentation } from "../gymnasticsPresentations";
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
  const normalized = String(value || "")
    .replace(/_/g, " ")
    .trim();
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : "Pending";
};

const Section = ({
  title,
  eyebrow,
  id,
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  id?: string;
  className: string;
  children: React.ReactNode;
}) => (
  <section id={id} className={`${className} scroll-mt-28`}>
    {eyebrow ? (
      <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-60">{eyebrow}</p>
    ) : null}
    <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{title}</h2>
    <div className="mt-5">{children}</div>
  </section>
);

export default function MeetPageContent({
  hero,
  model,
  ownerToolbar,
  rsvpProps,
  isReadOnly,
  hideOwnerActions = false,
  suppressActionStrip = false,
  onMobileEdit,
  mobileEditHref,
  onShare,
  onGoogleCalendar,
  onAppleCalendar,
  onOutlookCalendar,
  variant,
  presentation,
}: GymMeetTemplateRendererProps & {
  hero: React.ReactNode;
  presentation: GymnasticsPresentation;
  variant: {
    pageClass: string;
    shellClass: string;
    titleClass: string;
    titleStyle?: React.CSSProperties;
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
    ledeClass: string;
    dividerClass?: string;
  };
}) {
  const nameId = React.useId();
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

  const teamContent =
    model.rosterAthletes.length > 0 || practiceBlocks.length > 0 ? (
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        {model.rosterAthletes.length > 0 ? (
          <Section title="Active Roster" eyebrow="Attendance" className={variant.sectionClass}>
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
          </Section>
        ) : null}

        {practiceBlocks.length > 0 ? (
          <Section title="Practice Planner" eyebrow="Prep" className={variant.sectionClass}>
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
    ) : null;
  const supportContent =
    gearItems.length > 0 ||
    model.gear?.uniform ||
    volunteerSlots.length > 0 ||
    carpools.length > 0 ? (
      <div className="grid gap-5">
        <Section title="Gear & Support" eyebrow="Operations" className={variant.sectionClass}>
          <div className="grid gap-3 sm:grid-cols-2">
            {model.gear?.uniform ? (
              <div className={variant.summaryCardClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                  Uniform
                </p>
                <p className="mt-2 text-sm">{model.gear.uniform}</p>
              </div>
            ) : null}
            {gearItems.slice(0, 6).map((item: any, idx: number) => {
              const label = typeof item === "string" ? item : item?.name || `Gear ${idx + 1}`;
              return (
                <div key={label} className={variant.summaryCardClass}>
                  <p className="text-sm font-semibold">{label}</p>
                </div>
              );
            })}
            {volunteerSlots.slice(0, 4).map((slot: any, idx: number) => (
              <div key={slot.id || idx} className={variant.summaryCardClass}>
                <p className="text-sm font-semibold">{slot.role || `Volunteer ${idx + 1}`}</p>
                <p className="mt-1 text-xs opacity-70">{slot.name || "Open slot"}</p>
              </div>
            ))}
            {carpools.slice(0, 3).map((carpool: any, idx: number) => (
              <div key={carpool.id || idx} className={variant.summaryCardClass}>
                <p className="text-sm font-semibold">{carpool.driverName || `Driver ${idx + 1}`}</p>
                <p className="mt-1 text-xs opacity-70">
                  {[carpool.departureLocation, carpool.departureTime].filter(Boolean).join(" • ") ||
                    "Trip details TBD"}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    ) : null;
  const attendanceContent = rsvpProps.enabled ? (
    <Section title="RSVP" eyebrow="Attendance" className={variant.sectionClass}>
      {!rsvpProps.submitted ? (
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div>
              <label
                htmlFor={nameId}
                className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] opacity-60"
              >
                Your Name
              </label>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                id={nameId}
                autoComplete="name"
                placeholder="Parent or athlete name"
                value={rsvpProps.nameInput}
                onChange={(e) => rsvpProps.setNameInput(e.target.value)}
              />
            </div>
            {!rsvpProps.isSignedIn && rsvpProps.allowGuestAttendanceRsvp ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  aria-label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={rsvpProps.guestEmailInput}
                  onChange={(e) => rsvpProps.setGuestEmailInput(e.target.value)}
                />
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  aria-label="Phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Phone"
                  value={rsvpProps.guestPhoneInput}
                  onChange={(e) => rsvpProps.setGuestPhoneInput(e.target.value)}
                />
              </div>
            ) : null}
            {rsvpProps.rosterAthletes.length > 0 ? (
              <select
                aria-label="Choose athlete"
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
              aria-pressed={rsvpProps.attending === "yes"}
              onClick={() => rsvpProps.setAttending("yes")}
              className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                rsvpProps.attending === "yes"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-black/10 bg-white text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="font-black uppercase tracking-[0.14em]">Going</div>
              <div className="mt-1 opacity-75">Athlete will attend this meet.</div>
            </button>
            <button
              type="button"
              aria-pressed={rsvpProps.attending === "no"}
              onClick={() => rsvpProps.setAttending("no")}
              className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                rsvpProps.attending === "no"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-black/10 bg-white text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="font-black uppercase tracking-[0.14em]">Not Going</div>
              <div className="mt-1 opacity-75">Athlete cannot attend.</div>
            </button>
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
    </Section>
  ) : null;
  const footer = (
    <footer
      className="rounded-2xl border bg-transparent px-2 py-6 text-center"
      style={{ borderColor: "color-mix(in srgb, var(--gym-ink) 12%, transparent)" }}
    >
      <EnvitefyEventBranding category="Gymnastics" inheritColor />
    </footer>
  );

  return (
    <div className={variant.pageClass}>
      <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-6 lg:px-8">
        {!isReadOnly && !hideOwnerActions && ownerToolbar ? (
          <div className="mb-4">{ownerToolbar}</div>
        ) : null}

        <div className={variant.shellClass}>
          {!suppressActionStrip ? (
            <div className="relative z-20 mb-4 px-3 sm:px-6">
              <FloatingActionStrip
                onMobileEdit={onMobileEdit}
                mobileEditHref={mobileEditHref}
                buttonClass={variant.secondaryButtonClass}
                onShare={onShare}
                onGoogleCalendar={onGoogleCalendar}
                onAppleCalendar={onAppleCalendar}
                onOutlookCalendar={onOutlookCalendar}
              />
            </div>
          ) : null}

          {hero}
          <EventGuestPlanningNotes value={model.guestPlanning} />

          <GymnasticsPageBody
            presentation={presentation}
            discovery={
              <GymMeetDiscoveryContent
                model={model}
                variant={variant}
                presentation={presentation}
              />
            }
            team={teamContent}
            support={supportContent}
            attendance={attendanceContent}
            footer={footer}
          />
        </div>
      </div>
    </div>
  );
}
