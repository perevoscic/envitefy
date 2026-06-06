"use client";

import {
  CalendarDays,
  ExternalLink,
  Gift,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import EventTrackedLink from "@/components/EventTrackedLink";
import {
  ConciergeChecklistSection,
  ConciergePaymentTrackerSection,
  ConciergeReminderTimelineSection,
  ConciergeSmartFormsSection,
  ConciergeVolunteerSignupSection,
} from "@/components/concierge/ConciergePublicOperations";
import { attachAmazonAffiliateTag } from "@/lib/affiliate/amazon";
import type {
  ConciergeV2ChecklistItem,
  ConciergeV2FormSummary,
  ConciergeV2PaymentItem,
  ConciergeV2ReminderItem,
  ConciergeV2ScheduleItem,
  ConciergeV2VolunteerSlot,
} from "@/lib/concierge-v2/public-event";

type CalendarLinks = {
  google: string;
  outlook: string;
  appleInline: string;
};

type RegistryLink = {
  label: string;
  url: string;
  host?: string | null;
  helperText?: string | null;
};

type EventLocation = {
  label?: string | null;
  venue?: string | null;
  location?: string | null;
  address?: string | null;
  timeText?: string | null;
  description?: string | null;
};

type SourceFactSection = {
  title?: string | null;
  items?: string[];
};

type ConciergeEventWebsiteProps = {
  eventId: string;
  title: string;
  category: string;
  subheadline?: string | null;
  description?: string | null;
  whenLabel?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
  venueName?: string | null;
  location?: string | null;
  additionalLocations?: EventLocation[];
  sourceSections?: SourceFactSection[];
  imageUrl?: string | null;
  shareUrl?: string | null;
  calendarLinks?: CalendarLinks | null;
  showRsvp?: boolean;
  directRsvpEnabled?: boolean;
  rsvpName?: string | null;
  rsvpPhone?: string | null;
  rsvpEmail?: string | null;
  rsvpUrl?: string | null;
  registryLinks?: RegistryLink[];
  scheduleItems?: ConciergeV2ScheduleItem[];
  checklistItems?: ConciergeV2ChecklistItem[];
  forms?: ConciergeV2FormSummary[];
  volunteerSlots?: ConciergeV2VolunteerSlot[];
  paymentItems?: ConciergeV2PaymentItem[];
  reminders?: ConciergeV2ReminderItem[];
  actions?: ReactNode;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function uniqueLine(...values: Array<string | null | undefined>) {
  const parts = values.map(clean).filter(Boolean);
  return parts.filter((value, index) => parts.indexOf(value) === index).join(", ");
}

function locationLine(location: EventLocation) {
  return uniqueLine(location.venue, location.location || location.address);
}

function formatDateTime(value: string | null | undefined) {
  const raw = clean(value);
  if (!raw) return "";
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

function NavLink(props: { href: string; children: ReactNode; onClick?: () => void }) {
  return (
    <a
      href={props.href}
      onClick={props.onClick}
      className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
    >
      {props.children}
    </a>
  );
}

export default function ConciergeEventWebsite({
  eventId,
  title,
  category,
  subheadline,
  description,
  whenLabel,
  dateLabel,
  timeLabel,
  venueName,
  location,
  additionalLocations = [],
  sourceSections = [],
  imageUrl,
  shareUrl,
  calendarLinks,
  showRsvp = false,
  directRsvpEnabled = false,
  rsvpName,
  rsvpPhone,
  rsvpEmail,
  rsvpUrl,
  registryLinks = [],
  scheduleItems = [],
  checklistItems = [],
  forms = [],
  volunteerSlots = [],
  paymentItems = [],
  reminders = [],
  actions,
}: ConciergeEventWebsiteProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayWhen =
    clean(whenLabel) || uniqueLine(dateLabel, timeLabel) || "Date to be announced";
  const displayLocation = uniqueLine(venueName, location) || "Location to be announced";
  const visibleAdditionalLocations = additionalLocations
    .map((item) => ({
      ...item,
      line: locationLine(item),
    }))
    .filter((item) => item.line);
  const heroImage = clean(imageUrl);
  const body =
    clean(description) ||
    clean(subheadline) ||
    "Join us for this event. The host has shared the key details below.";
  const hasRegistry = registryLinks.length > 0;
  const visibleScheduleItems = scheduleItems.filter((item) => clean(item.title));
  const visibleForms = forms.filter((item) => clean(item.title));
  const visibleVolunteerSlots = volunteerSlots.filter((item) => clean(item.title));
  const visiblePaymentItems = paymentItems.filter((item) => clean(item.title));
  const visibleReminders = reminders.filter((item) => clean(item.title));
  const visibleChecklistItems = checklistItems.filter((item) => clean(item.title));
  const visibleSourceSections = sourceSections
    .map((section) => ({
      title: clean(section.title) || "Source Details",
      items: Array.isArray(section.items) ? section.items.map(clean).filter(Boolean).slice(0, 8) : [],
    }))
    .filter((section) => section.items.length)
    .slice(0, 6);
  const navItems = [
    { href: "#details", label: "Details" },
    { href: "#schedule", label: "Schedule" },
    ...(visibleSourceSections.length ? [{ href: "#source-details", label: "Source" }] : []),
    ...(showRsvp ? [{ href: "#event-rsvp", label: "RSVP" }] : []),
    ...(visibleForms.length ? [{ href: "#forms", label: "Forms" }] : []),
    ...(visibleVolunteerSlots.length ? [{ href: "#volunteer-signup", label: "Signup" }] : []),
    ...(visiblePaymentItems.length ? [{ href: "#payments", label: "Payments" }] : []),
    ...(visibleChecklistItems.length ? [{ href: "#checklist", label: "Checklist" }] : []),
    ...(visibleReminders.length ? [{ href: "#reminders", label: "Reminders" }] : []),
    ...(hasRegistry ? [{ href: "#registry", label: "Registry" }] : []),
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="min-w-0">
            <span className="block truncate text-sm font-black uppercase tracking-[0.2em] text-violet-700">
              {category || "Event"}
            </span>
            <span className="block max-w-[14rem] truncate text-base font-bold text-slate-950 sm:max-w-sm">
              {title}
            </span>
          </a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Event sections">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {actions ? <div key="event-owner-actions">{actions}</div> : null}
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="grid gap-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </header>

      <section id="top" className="relative overflow-hidden bg-slate-950">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${title} event artwork`}
            className="absolute inset-0 h-full w-full object-cover opacity-75"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.9),rgba(15,23,42,0.58),rgba(15,23,42,0.18))]" />
        <div className="relative mx-auto grid min-h-[76vh] max-w-6xl content-end px-4 pb-14 pt-24 sm:px-6 lg:pb-20">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-white/72">
              {category || "Event"}
            </p>
            <h1 className="mt-4 text-5xl font-black leading-[0.92] text-white sm:text-7xl">
              {title}
            </h1>
            {subheadline ? (
              <p className="mt-5 max-w-2xl text-xl font-semibold text-white/86">{subheadline}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {showRsvp ? (
                <a
                  href="#event-rsvp"
                  className="inline-flex h-12 items-center rounded-full bg-white px-5 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-violet-100"
                >
                  RSVP
                </a>
              ) : null}
              {calendarLinks ? (
                <a
                  href="#schedule"
                  className="inline-flex h-12 items-center rounded-full border border-white/26 bg-white/12 px-5 text-sm font-black uppercase tracking-[0.14em] text-white backdrop-blur transition hover:bg-white/18"
                >
                  Add to calendar
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section
        id="details"
        className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-16"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Overview</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Details for the day
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{body}</p>
        </div>
        <div className="grid gap-4">
          <div id="schedule" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-700">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">When</p>
                <p className="mt-1 text-base font-bold text-slate-950">{displayWhen}</p>
              </div>
            </div>
            {calendarLinks ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold"
                  href={calendarLinks.google}
                >
                  Google
                </a>
                <a
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold"
                  href={calendarLinks.outlook}
                >
                  Outlook
                </a>
                <a
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold"
                  href={calendarLinks.appleInline}
                >
                  Apple
                </a>
              </div>
            ) : null}
            {visibleScheduleItems.length ? (
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                {visibleScheduleItems.slice(0, 8).map((item, index) => (
                  <div
                    key={item.id || `${item.title}-${index}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.title}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {formatDateTime(item.startAt) || displayWhen}
                        </p>
                      </div>
                      {item.type ? (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-violet-700">
                          {item.type.replace(/_/g, " ")}
                        </span>
                      ) : null}
                    </div>
                    {item.locationText || item.notes ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {[clean(item.locationText), clean(item.notes)].filter(Boolean).join(" - ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-rose-100 text-rose-700">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Where
                </p>
                <p className="mt-1 text-base font-bold text-slate-950">{displayLocation}</p>
              </div>
            </div>
            {visibleAdditionalLocations.length ? (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                {visibleAdditionalLocations.map((item, index) => (
                  <div key={`${item.label || "location"}-${item.line}-${index}`}>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      {clean(item.label) || "Additional Location"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">{item.line}</p>
                    {item.timeText || item.description ? (
                      <p className="mt-1 text-sm text-slate-500">
                        {[clean(item.timeText), clean(item.description)].filter(Boolean).join(" - ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {visibleSourceSections.length ? (
        <section id="source-details" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">
              Source Details
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Pulled from the upload
            </h2>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {visibleSourceSections.map((section) => (
                <article
                  key={`${section.title}-${section.items[0]}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <h3 className="text-base font-black text-slate-950">{section.title}</h3>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showRsvp ? (
        <section id="event-rsvp" className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">RSVP</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">Let the host know.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Guests can answer yes, no, or maybe directly from this page.
              </p>
            </div>
            <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-5">
              <EventRsvpPrompt
                eventId={eventId}
                rsvpName={rsvpName}
                rsvpPhone={rsvpPhone}
                rsvpEmail={rsvpEmail}
                rsvpUrl={rsvpUrl}
                eventTitle={title}
                eventCategory={category}
                shareUrl={shareUrl}
                allowDirectRsvp={directRsvpEnabled}
              />
            </div>
          </div>
        </section>
      ) : null}

      <ConciergeSmartFormsSection eventId={eventId} forms={visibleForms} />
      <ConciergeVolunteerSignupSection eventId={eventId} slots={visibleVolunteerSlots} />
      <ConciergePaymentTrackerSection items={visiblePaymentItems} />
      <ConciergeChecklistSection items={visibleChecklistItems} />
      <ConciergeReminderTimelineSection reminders={visibleReminders} />

      {hasRegistry ? (
        <section id="registry" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Registry</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {registryLinks.map((link) => (
              <EventTrackedLink
                key={`${link.label}-${link.url}`}
                href={attachAmazonAffiliateTag(link.url)}
                eventId={eventId}
                eventName="registry_click"
                targetLabel={link.label || "Registry"}
                sourceSurface="concierge_event_website"
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-base font-black text-slate-950">
                    <Gift className="h-5 w-5 text-violet-700" aria-hidden="true" />
                    {link.label || "Registry"}
                  </span>
                  {link.host ? (
                    <span className="mt-1 block text-sm text-slate-500">{link.host}</span>
                  ) : null}
                  {link.helperText ? (
                    <span className="mt-3 block whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {link.helperText}
                    </span>
                  ) : null}
                </span>
                <ExternalLink className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:text-violet-700" />
              </EventTrackedLink>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
