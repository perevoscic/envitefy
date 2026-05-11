"use client";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Copy,
  Eye,
  ListChecks,
  MapPin,
  MessageSquareText,
  PartyPopper,
  Send,
  Share2,
  Sparkles,
  Users,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FlipClock } from "@/components/ui/flip-clock";
import { type ThumbnailFocus, thumbnailFocusToObjectPosition } from "@/lib/thumbnail-focus";
import { buildEventPath } from "@/utils/event-url";
import {
  conciergePromptSuggestions,
  mockActivity,
  mockDashboardStats,
  mockEvents,
  shouldUseAdminDashboardMockData,
  type MockDashboardActivity,
  type MockDashboardEvent,
} from "./adminDashboardMockData";

type DashboardEventItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  locationText: string | null;
  status: string | null;
  category: string | null;
  coverImageUrl?: string | null;
  thumbnailFocus?: ThumbnailFocus | null;
  numberOfGuests?: number;
  hasRsvp?: boolean;
  reminderCount?: number;
  mapsUrl?: string | null;
  createdVia?: string | null;
  updatedAt?: string | null;
  ownership?: "owned" | "invited";
  shareStatus?: "accepted" | "pending" | null;
  userRsvpResponse?: "yes" | "no" | "maybe" | null;
};

type DashboardMetricsCache = {
  eventId: string;
  travelMinutes: number | null;
  travelDistanceKm: number | null;
  travelUpdatedAt: string | null;
  weatherSummary: string | null;
  weatherTemp: number | null;
  weatherUpdatedAt: string | null;
};

type DashboardResponse = {
  nextEvent: DashboardEventItem | null;
  snapshot: {
    upcomingCount30Days: number;
    upcomingCount7Days: number;
    nextEventInDays: number | null;
  };
  upcoming: DashboardEventItem[];
  rsvp: {
    going: number;
    maybe: number;
    declined: number;
    pending: number;
    recent: Array<{
      id: string;
      name: string;
      status: "going" | "maybe" | "declined" | "pending";
      updatedAt: string | null;
    }>;
  } | null;
  setupHealth: {
    flags: Array<{ key: string; label: string }>;
  };
  checklist: {
    source: "tasks" | "derived";
    items: Array<{
      id: string;
      title: string;
      done: boolean;
      dueAt: string | null;
    }>;
  };
  drafts: {
    count: number;
    items: Array<{
      id: string;
      title: string;
      updatedAt: string | null;
      startAt: string;
    }>;
  };
  metricsEligibility: {
    weatherEligible: boolean;
    travelWindowEligible: boolean;
  };
  diagnostics?: Record<string, unknown> | null;
  timings?: Record<string, unknown> | null;
};

type DashboardEnrichMeta = {
  hasDestination?: boolean;
  hasOrigin?: boolean;
};

type HomeOverviewDashboardProps = {
  viewerName: string;
  data: DashboardResponse | null;
  metrics: DashboardMetricsCache | null;
  enrichMeta: DashboardEnrichMeta | null;
  metricsLoading: boolean;
  loading: boolean;
  onForceTravel: () => void;
};

type RsvpBreakdown = {
  yes: number;
  no: number;
  maybe: number;
  noResponse: number;
};

type EventHealthItem = {
  id: string;
  label: string;
  done: boolean;
};

type CreatorDashboardEvent = {
  id: string;
  title: string;
  type: string;
  status: "Draft" | "Published" | "Upcoming" | "Past" | "Invited";
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  rsvps: RsvpBreakdown;
  views: number | null;
  completionScore: number;
  lastUpdated: string | null;
  needsAttention: string[];
  healthItems: EventHealthItem[];
  coverImageUrl?: string | null;
  thumbnailFocus?: ThumbnailFocus | null;
  createdVia?: string | null;
  ownership: "owned" | "invited";
  hasRsvp: boolean;
  isSample: boolean;
};

type DashboardActivityItem = {
  id: string;
  type: MockDashboardActivity["type"];
  message: string;
  timestamp: string;
};

type SmartAction = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  eventId?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  birthday: "Birthday",
  birthdays: "Birthday",
  baby_shower: "Baby Shower",
  "baby shower": "Baby Shower",
  wedding: "Wedding",
  weddings: "Wedding",
  sport_gymnastics_schedule: "Gymnastics",
  sport_gymnastics: "Gymnastics",
  sport_football_season: "Football",
  football: "Football",
  gender_reveal: "Gender Reveal",
  sport_event: "Sports",
  general_event: "General Event",
};

const STATUS_STYLES: Record<CreatorDashboardEvent["status"], string> = {
  Draft: "border-amber-200 bg-amber-50 text-amber-700",
  Published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Upcoming: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Past: "border-slate-200 bg-slate-50 text-slate-600",
  Invited: "border-violet-200 bg-violet-50 text-violet-700",
};

function getViewerLabel(viewerName: string): string {
  const trimmed = viewerName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] || "there";
}

function parseSafeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatEventDate(value: string | null): string {
  const parsed = parseSafeDate(value);
  if (!parsed) return "Date pending";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function formatEventTime(startAt: string | null, endAt: string | null): string {
  const start = parseSafeDate(startAt);
  if (!start) return "Time pending";
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const startLabel = formatter.format(start);
  const end = parseSafeDate(endAt);
  if (!end || end.getTime() <= start.getTime()) return startLabel;
  return `${startLabel} - ${formatter.format(end)}`;
}

function formatLastUpdated(value: string | null): string {
  const parsed = parseSafeDate(value);
  if (!parsed) return "Not updated yet";
  const diffMs = Date.now() - parsed.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 14) return `Updated ${diffDays} days ago`;
  return `Updated ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed)}`;
}

function categoryLabel(category: string | null | undefined): string {
  const raw = String(category || "").trim();
  if (!raw) return "Event";
  const normalized = raw.toLowerCase().replace(/[-\s]+/g, "_");
  return CATEGORY_LABELS[normalized] || CATEGORY_LABELS[raw.toLowerCase()] || titleCase(raw);
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeStatus(
  status: string | null | undefined,
  startAt: string | null,
  ownership: "owned" | "invited",
): CreatorDashboardEvent["status"] {
  if (ownership === "invited") return "Invited";
  const normalized = String(status || "")
    .trim()
    .toLowerCase();
  if (normalized === "draft") return "Draft";
  if (normalized === "published") return "Published";
  const start = parseSafeDate(startAt);
  if (start && start.getTime() < Date.now()) return "Past";
  return "Upcoming";
}

function sampleIso(date: string, time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return `${date}T12:00:00`;
  const hourRaw = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  const hour =
    period === "PM" && hourRaw < 12
      ? hourRaw + 12
      : period === "AM" && hourRaw === 12
        ? 0
        : hourRaw;
  return `${date}T${String(hour).padStart(2, "0")}:${minute}:00`;
}

function getDashboardThumbnailObjectPosition(item: {
  thumbnailFocus?: ThumbnailFocus | null;
  createdVia?: string | null;
}): string | undefined {
  const explicitPosition = thumbnailFocusToObjectPosition(item.thumbnailFocus);
  if (explicitPosition) return explicitPosition;
  const createdVia = String(item.createdVia || "")
    .trim()
    .toLowerCase();
  return createdVia.startsWith("ocr") ? "50% 22%" : undefined;
}

function buildCountdownParts(target: Date | null, now: number) {
  if (!target) {
    return { days: "00", hours: "00", minutes: "00" };
  }
  const diffMs = Math.max(target.getTime() - now, 0);
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
  };
}

function eventHref(event: CreatorDashboardEvent, params?: Record<string, string>): string {
  if (event.isSample) return "/studio";
  return buildEventPath(event.id, event.title, params);
}

function manageEventHref(event: CreatorDashboardEvent): string {
  if (event.isSample) return "/studio";
  const createdVia = String(event.createdVia || "").toLowerCase();
  if (/(ocr|scan|upload)/.test(createdVia)) {
    return `/events/${encodeURIComponent(event.id)}/manage`;
  }
  return eventHref(event, { tab: "dashboard" });
}

function buildAbsoluteUrl(href: string): string {
  if (typeof window === "undefined") return href;
  return new URL(href, window.location.origin).toString();
}

function rsvpTotal(rsvps: RsvpBreakdown): number {
  return rsvps.yes + rsvps.no + rsvps.maybe;
}

function buildHealthItems(event: {
  title: string;
  startAt: string | null;
  location: string | null;
  coverImageUrl?: string | null;
  hasRsvp: boolean;
  rsvps: RsvpBreakdown;
  numberOfGuests?: number;
  reminderCount?: number;
  status: CreatorDashboardEvent["status"];
  isSample?: boolean;
  sampleNeedsAttention?: string[];
}): EventHealthItem[] {
  const sampleNeeds = event.sampleNeedsAttention || [];
  const needsRegistry = sampleNeeds.some((item) => /registry/i.test(item));
  const needsReminder = sampleNeeds.some((item) => /reminder/i.test(item));
  const needsParking = sampleNeeds.some((item) => /parking/i.test(item));
  return [
    {
      id: "details",
      label: "Event details added",
      done: Boolean(event.title && event.startAt),
    },
    {
      id: "location",
      label: "Location added",
      done: Boolean(event.location),
    },
    {
      id: "rsvp",
      label: "RSVP enabled",
      done: event.hasRsvp || rsvpTotal(event.rsvps) > 0,
    },
    {
      id: "image",
      label: "Image or banner added",
      done: Boolean(event.coverImageUrl) || Boolean(event.isSample),
    },
    {
      id: "audience",
      label: "Guest list started",
      done: (event.numberOfGuests || 0) > 0 || rsvpTotal(event.rsvps) > 0,
    },
    {
      id: "registry",
      label: "Registry or helpful links added",
      done: event.isSample ? !needsRegistry : true,
    },
    {
      id: "parking",
      label: "Parking or arrival info added",
      done: event.isSample ? !needsParking : true,
    },
    {
      id: "reminder",
      label: "Reminder or announcement ready",
      done: event.isSample ? !needsReminder : (event.reminderCount || 0) > 0,
    },
    {
      id: "publish",
      label: "Published for guests",
      done: event.status !== "Draft",
    },
  ];
}

function completionFromHealth(items: EventHealthItem[]): number {
  if (items.length === 0) return 0;
  const completed = items.filter((item) => item.done).length;
  return Math.round((completed / items.length) * 100);
}

function attentionFromHealth(items: EventHealthItem[]): string[] {
  return items
    .filter((item) => !item.done)
    .map((item) => item.label)
    .slice(0, 3);
}

function realRsvpForEvent(item: DashboardEventItem, data: DashboardResponse | null): RsvpBreakdown {
  if (item.id === data?.nextEvent?.id && data.rsvp) {
    return {
      yes: data.rsvp.going,
      no: data.rsvp.declined,
      maybe: data.rsvp.maybe,
      noResponse: data.rsvp.pending,
    };
  }
  return {
    yes: 0,
    no: 0,
    maybe: 0,
    noResponse: item.hasRsvp ? Math.max(0, item.numberOfGuests || 0) : 0,
  };
}

function buildCreatorEventFromDashboardItem(
  item: DashboardEventItem,
  data: DashboardResponse | null,
): CreatorDashboardEvent {
  const ownership = item.ownership || "owned";
  const status = normalizeStatus(item.status, item.startAt, ownership);
  const rsvps = realRsvpForEvent(item, data);
  const healthItems = buildHealthItems({
    title: item.title,
    startAt: item.startAt,
    location: item.locationText,
    coverImageUrl: item.coverImageUrl,
    hasRsvp: Boolean(item.hasRsvp),
    rsvps,
    numberOfGuests: item.numberOfGuests,
    reminderCount: item.reminderCount,
    status,
  });
  const attention = attentionFromHealth(healthItems);
  return {
    id: item.id,
    title: item.title || "Untitled event",
    type: categoryLabel(item.category),
    status,
    startAt: item.startAt,
    endAt: item.endAt,
    location: item.locationText,
    rsvps,
    views: null,
    completionScore: completionFromHealth(healthItems),
    lastUpdated: item.updatedAt || null,
    needsAttention: attention,
    healthItems,
    coverImageUrl: item.coverImageUrl,
    thumbnailFocus: item.thumbnailFocus,
    createdVia: item.createdVia,
    ownership,
    hasRsvp: Boolean(item.hasRsvp),
    isSample: false,
  };
}

function buildCreatorEventFromDraft(
  item: DashboardResponse["drafts"]["items"][number],
): CreatorDashboardEvent {
  const rsvps = { yes: 0, no: 0, maybe: 0, noResponse: 0 };
  const healthItems = buildHealthItems({
    title: item.title,
    startAt: item.startAt,
    location: null,
    hasRsvp: false,
    rsvps,
    status: "Draft",
  });
  return {
    id: item.id,
    title: item.title || "Untitled draft",
    type: "Draft",
    status: "Draft",
    startAt: item.startAt,
    endAt: null,
    location: null,
    rsvps,
    views: null,
    completionScore: completionFromHealth(healthItems),
    lastUpdated: item.updatedAt,
    needsAttention: attentionFromHealth(healthItems),
    healthItems,
    createdVia: null,
    ownership: "owned",
    hasRsvp: false,
    isSample: false,
  };
}

function buildRealCreatorEvents(data: DashboardResponse | null): CreatorDashboardEvent[] {
  if (!data) return [];
  const seen = new Set<string>();
  const events: CreatorDashboardEvent[] = [];
  const addEvent = (item: DashboardEventItem | null) => {
    if (!item || seen.has(item.id)) return;
    seen.add(item.id);
    events.push(buildCreatorEventFromDashboardItem(item, data));
  };
  addEvent(data.nextEvent);
  for (const item of data.upcoming || []) addEvent(item);
  for (const draft of data.drafts.items || []) {
    if (seen.has(draft.id)) continue;
    seen.add(draft.id);
    events.push(buildCreatorEventFromDraft(draft));
  }
  return events;
}

function buildSampleCreatorEvent(event: MockDashboardEvent): CreatorDashboardEvent {
  const startAt = sampleIso(event.date, event.time);
  const healthItems = buildHealthItems({
    title: event.title,
    startAt,
    location: event.location,
    hasRsvp: true,
    rsvps: event.rsvps,
    status: event.status,
    isSample: true,
    sampleNeedsAttention: event.needsAttention,
  });
  return {
    id: event.id,
    title: event.title,
    type: event.type,
    status: event.status,
    startAt,
    endAt: null,
    location: event.location,
    rsvps: event.rsvps,
    views: event.views,
    completionScore: event.completionScore,
    lastUpdated: event.lastUpdated,
    needsAttention: event.needsAttention,
    healthItems,
    createdVia: "sample",
    ownership: "owned",
    hasRsvp: true,
    isSample: true,
  };
}

function buildActivityItems(
  data: DashboardResponse | null,
  events: CreatorDashboardEvent[],
  useSampleEvents: boolean,
): DashboardActivityItem[] {
  if (useSampleEvents) return mockActivity;

  const activity: DashboardActivityItem[] = [];
  const nextTitle = data?.nextEvent?.title || events[0]?.title || "your event";

  for (const row of data?.rsvp?.recent || []) {
    const status =
      row.status === "going"
        ? "Yes"
        : row.status === "declined"
          ? "No"
          : row.status === "maybe"
            ? "Maybe"
            : "Pending";
    activity.push({
      id: `rsvp-${row.id}`,
      type: "rsvp",
      message: `${row.name} RSVP'd ${status} to ${nextTitle}`,
      timestamp: row.updatedAt ? formatLastUpdated(row.updatedAt) : "Recently",
    });
  }

  for (const event of events.slice(0, 4)) {
    if (event.needsAttention.length > 0) {
      activity.push({
        id: `health-${event.id}`,
        type: "concierge",
        message: `Concierge suggested: ${event.needsAttention[0]} for ${event.title}`,
        timestamp: "Needs attention",
      });
    } else if (event.lastUpdated) {
      activity.push({
        id: `updated-${event.id}`,
        type: "update",
        message: `${event.title} was updated`,
        timestamp: formatLastUpdated(event.lastUpdated),
      });
    }
  }

  return activity.slice(0, 5);
}

function buildSmartAction(events: CreatorDashboardEvent[], useSampleEvents: boolean): SmartAction {
  const attentionEvent = events.find((event) => event.needsAttention.length > 0);
  if (attentionEvent) {
    return {
      eyebrow: "Needs attention",
      title: `${attentionEvent.title} is ${attentionEvent.completionScore}% complete`,
      body: attentionEvent.needsAttention[0] || "A quick update will make this page more complete.",
      href: useSampleEvents ? "/studio" : manageEventHref(attentionEvent),
      actionLabel: useSampleEvents ? "Create similar event" : "Manage event",
      eventId: attentionEvent.id,
    };
  }

  const nextEvent = events[0];
  if (nextEvent) {
    return {
      eyebrow: "Ready to share",
      title: `${nextEvent.title} is ready for guests`,
      body: "Open the workspace to review content, copy the link, or send a fresh reminder.",
      href: manageEventHref(nextEvent),
      actionLabel: "Open workspace",
      eventId: nextEvent.id,
    };
  }

  return {
    eyebrow: "Start here",
    title: "Create your first live event page",
    body: "Start from a message, upload, or template and Envitefy will turn the details into a hosted event page.",
    href: "/studio",
    actionLabel: "Create event",
  };
}

function DashboardStatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-2xl border border-[#e7e2f3] bg-white p-4 shadow-[0_16px_36px_rgba(82,54,145,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#7d739f]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#24193f]">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#eee9fb] bg-[#f8f5ff] text-[#7c67c5]">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-[#8c83a8]">{detail}</p>
    </article>
  );
}

function SmartActionCard({
  action,
  nextEvent,
  now,
}: {
  action: SmartAction;
  nextEvent: CreatorDashboardEvent | null;
  now: number;
}) {
  const countdown = buildCountdownParts(parseSafeDate(nextEvent?.startAt), now);
  return (
    <section
      id="overview"
      className="rounded-3xl border border-[#e3ddf4] bg-white p-5 shadow-[0_24px_70px_rgba(88,62,150,0.1)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#7c67c5]">{action.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-[#24193f]">{action.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#6f6786]">{action.body}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[#7c67c5]">
          <Sparkles size={20} />
        </span>
      </div>

      {nextEvent ? (
        <div className="mt-5 border-t border-[#eee9f7] pt-5">
          <p className="mb-3 text-xs font-semibold text-[#8c83a8]">Next event countdown</p>
          <FlipClock
            units={[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Mins", value: countdown.minutes },
            ]}
            className="justify-start"
          />
        </div>
      ) : null}

      <Link
        href={action.href}
        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#7c67c5] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(124,103,197,0.28)] transition hover:bg-[#715abf] sm:w-auto"
      >
        <span>{action.actionLabel}</span>
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function EventManagementCard({
  event,
  copied,
  onCopy,
  onShare,
}: {
  event: CreatorDashboardEvent;
  copied: boolean;
  onCopy: (event: CreatorDashboardEvent) => void;
  onShare: (event: CreatorDashboardEvent) => void;
}) {
  const liveHref = eventHref(event);
  const manageHref = manageEventHref(event);
  const thumbnailObjectPosition = getDashboardThumbnailObjectPosition(event);
  const responseCount = rsvpTotal(event.rsvps);
  const totalInvited = responseCount + event.rsvps.noResponse;

  return (
    <article className="overflow-hidden rounded-3xl border border-[#e5e0f0] bg-white shadow-[0_20px_60px_rgba(71,49,130,0.08)]">
      <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
        <div className="relative min-h-[180px] overflow-hidden bg-[#f2eefb] lg:min-h-full">
          {event.coverImageUrl ? (
            <Image
              src={event.coverImageUrl}
              alt={event.title}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 220px"
              className="object-cover"
              style={
                thumbnailObjectPosition ? { objectPosition: thumbnailObjectPosition } : undefined
              }
            />
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center bg-[linear-gradient(135deg,#f7f2ff_0%,#fff_48%,#edf7f4_100%)]">
              <PartyPopper size={38} className="text-[#8b73d1]" />
            </div>
          )}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-[#5f5480] shadow-sm backdrop-blur">
              {event.type}
            </span>
            {event.isSample ? (
              <span className="rounded-full border border-[#ded6f4] bg-[#f7f3ff]/95 px-3 py-1 text-xs font-semibold text-[#7562bd] shadow-sm backdrop-blur">
                Sample
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    STATUS_STYLES[event.status]
                  }`}
                >
                  {event.status}
                </span>
                <span className="text-xs font-medium text-[#8c83a8]">
                  {formatLastUpdated(event.lastUpdated)}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold leading-tight text-[#24193f] sm:text-2xl">
                {event.title}
              </h3>
              <div className="mt-3 grid gap-2 text-sm text-[#6f6786] sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-[#8b73d1]" />
                  <span>
                    {formatEventDate(event.startAt)} at{" "}
                    {formatEventTime(event.startAt, event.endAt)}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#8b73d1]" />
                  <span>{event.location || "Location pending"}</span>
                </p>
              </div>
            </div>

            <div className="min-w-[128px] rounded-2xl border border-[#ece7f7] bg-[#fbfafc] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#7d739f]">Event health</span>
                <span className="text-lg font-bold text-[#24193f]">{event.completionScore}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee9f7]">
                <div
                  className="h-full rounded-full bg-[#7c67c5]"
                  style={{ width: `${Math.max(6, Math.min(100, event.completionScore))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="border-t border-[#eee9f7] pt-3">
              <p className="text-xs font-semibold text-[#8c83a8]">RSVPs</p>
              <p className="mt-1 text-sm font-bold text-[#24193f]">
                {responseCount > 0
                  ? `${formatNumber(responseCount)} responses`
                  : totalInvited > 0
                    ? `${formatNumber(totalInvited)} invited`
                    : "Not set"}
              </p>
            </div>
            <div className="border-t border-[#eee9f7] pt-3">
              <p className="text-xs font-semibold text-[#8c83a8]">Views</p>
              <p className="mt-1 text-sm font-bold text-[#24193f]">
                {event.views == null ? "Tracking soon" : formatNumber(event.views)}
              </p>
            </div>
            <div className="border-t border-[#eee9f7] pt-3">
              <p className="text-xs font-semibold text-[#8c83a8]">Attention</p>
              <p className="mt-1 text-sm font-bold text-[#24193f]">
                {event.needsAttention[0] || "Ready"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={manageHref}
              className="inline-flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#24193f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7c67c5]"
            >
              <span>{event.isSample ? "Create similar" : "Manage event"}</span>
              <ArrowRight size={16} />
            </Link>
            <div className="grid grid-cols-3 gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => onCopy(event)}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-[#ded8ec] bg-white px-3 text-sm font-semibold text-[#5f5480] transition hover:border-[#cfc5e8] hover:bg-[#fbf9ff]"
                aria-label={`Copy link for ${event.title}`}
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                <span className="hidden md:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={() => onShare(event)}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-[#ded8ec] bg-white px-3 text-sm font-semibold text-[#5f5480] transition hover:border-[#cfc5e8] hover:bg-[#fbf9ff]"
                aria-label={`Share ${event.title}`}
              >
                <Share2 size={16} />
                <span className="hidden md:inline">Share</span>
              </button>
              <Link
                href={liveHref}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-[#ded8ec] bg-white px-3 text-sm font-semibold text-[#5f5480] transition hover:border-[#cfc5e8] hover:bg-[#fbf9ff]"
                aria-label={`View live card for ${event.title}`}
              >
                <Eye size={16} />
                <span className="hidden md:inline">Live</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function UpcomingEventsList({
  events,
  copiedEventId,
  onCopy,
  onShare,
}: {
  events: CreatorDashboardEvent[];
  copiedEventId: string | null;
  onCopy: (event: CreatorDashboardEvent) => void;
  onShare: (event: CreatorDashboardEvent) => void;
}) {
  return (
    <section id="events" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#7c67c5]">Upcoming events</p>
          <h2 className="text-2xl font-bold text-[#24193f]">Manage what guests will see</h2>
        </div>
        <Link
          href="/studio"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-[#ded8ec] bg-white px-4 py-2 text-sm font-semibold text-[#5f5480] shadow-sm transition hover:bg-[#fbf9ff]"
        >
          <WandSparkles size={16} />
          <span>Create event</span>
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <EventManagementCard
            key={event.id}
            event={event}
            copied={copiedEventId === event.id}
            onCopy={onCopy}
            onShare={onShare}
          />
        ))}
      </div>
    </section>
  );
}

function EventHealthChecklist({ event }: { event: CreatorDashboardEvent | null }) {
  if (!event) {
    return (
      <section className="rounded-3xl border border-dashed border-[#ddd8e9] bg-white/80 px-5 py-8 text-center">
        <ListChecks className="mx-auto text-[#8b73d1]" size={28} />
        <h2 className="mt-3 text-lg font-bold text-[#24193f]">Event health</h2>
        <p className="mt-2 text-sm text-[#6f6786]">
          Create an event to see setup progress and suggested next steps.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[#e5e0f0] bg-white p-5 shadow-[0_18px_48px_rgba(71,49,130,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#7c67c5]">Event health</p>
          <h2 className="mt-1 text-xl font-bold text-[#24193f]">{event.title}</h2>
        </div>
        <span className="text-2xl font-bold text-[#24193f]">{event.completionScore}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee9f7]">
        <div
          className="h-full rounded-full bg-[#7c67c5]"
          style={{ width: `${Math.max(6, Math.min(100, event.completionScore))}%` }}
        />
      </div>
      <ul className="mt-5 space-y-3">
        {event.healthItems.map((item) => (
          <li key={item.id} className="flex items-start gap-3 text-sm">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {item.done ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            </span>
            <span className={item.done ? "text-[#6f6786]" : "font-semibold text-[#24193f]"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentActivityPanel({ activity }: { activity: DashboardActivityItem[] }) {
  const iconByType: Record<DashboardActivityItem["type"], LucideIcon> = {
    rsvp: Users,
    view: Eye,
    update: Clipboard,
    concierge: Sparkles,
  };
  return (
    <section
      id="activity"
      className="rounded-3xl border border-[#e5e0f0] bg-white p-5 shadow-[0_18px_48px_rgba(71,49,130,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#7c67c5]">Recent activity</p>
          <h2 className="mt-1 text-xl font-bold text-[#24193f]">Latest event signals</h2>
        </div>
        <Activity size={20} className="text-[#8b73d1]" />
      </div>

      {activity.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {activity.map((item) => {
            const Icon = iconByType[item.type];
            return (
              <li key={item.id} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#f7f3ff] text-[#7c67c5]">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-5 text-[#24193f]">
                    {item.message}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-[#8c83a8]">
                    {item.timestamp}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[#ddd8e9] px-4 py-8 text-center text-sm text-[#8c83a8]">
          Activity will appear after RSVPs, updates, shares, or Concierge suggestions.
        </div>
      )}
    </section>
  );
}

function ConciergeSuggestionsCard({ focusEvent }: { focusEvent: CreatorDashboardEvent | null }) {
  return (
    <section
      id="concierge"
      className="rounded-3xl border border-[#e5e0f0] bg-white p-5 shadow-[0_18px_48px_rgba(71,49,130,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#7c67c5]">Envitefy Concierge</p>
          <h2 className="mt-1 text-xl font-bold text-[#24193f]">Improve this event faster</h2>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[#7c67c5]">
          <MessageSquareText size={18} />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6f6786]">
        {focusEvent
          ? `Ask for help with ${focusEvent.title}.`
          : "Ask for help turning event details into a complete guest page."}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {conciergePromptSuggestions.map((prompt) => (
          <Link
            key={prompt}
            href="/chat"
            className="inline-flex min-h-[38px] items-center rounded-full border border-[#ded8ec] bg-[#fbfafc] px-3 py-2 text-xs font-semibold text-[#5f5480] transition hover:border-[#cfc5e8] hover:bg-white"
          >
            {prompt}
          </Link>
        ))}
      </div>
      <Link
        href="/chat"
        className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#7c67c5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#715abf]"
      >
        <span>Ask Concierge</span>
        <Send size={15} />
      </Link>
    </section>
  );
}

function MobileAdminNav() {
  const items: Array<{ href: string; label: string; icon: LucideIcon }> = [
    { href: "#overview", label: "Overview", icon: Sparkles },
    { href: "#events", label: "Events", icon: CalendarDays },
    { href: "#activity", label: "Activity", icon: Activity },
    { href: "#concierge", label: "Concierge", icon: MessageSquareText },
  ];
  return (
    <nav className="fixed inset-x-3 bottom-3 z-[55] rounded-3xl border border-[#ded8ec] bg-white/94 p-1.5 shadow-[0_18px_46px_rgba(55,36,104,0.2)] backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-[#6f6786] transition hover:bg-[#f7f3ff] hover:text-[#7c67c5]"
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function LoadingDashboardState() {
  return (
    <div className="space-y-6 pt-20 md:pt-8">
      <div className="h-36 animate-pulse rounded-3xl bg-white shadow-[0_20px_60px_rgba(71,49,130,0.08)]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-white" />
    </div>
  );
}

function EmptyStateCard() {
  return (
    <section className="rounded-3xl border border-dashed border-[#dcd6ea] bg-white/90 px-5 py-10 text-center shadow-[0_18px_48px_rgba(71,49,130,0.06)]">
      <WandSparkles className="mx-auto text-[#7c67c5]" size={32} />
      <h2 className="mt-4 text-2xl font-bold text-[#24193f]">Create your first event page</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#6f6786]">
        Start from a message, a template, or an upload. Your dashboard will show readiness, guest
        responses, and activity once events are live.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/studio"
          className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#24193f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7c67c5]"
        >
          <WandSparkles size={16} />
          <span>Create in Studio</span>
        </Link>
        <Link
          href="/event"
          className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-[#ded8ec] bg-white px-5 py-3 text-sm font-semibold text-[#5f5480] transition hover:bg-[#fbf9ff]"
        >
          <Clipboard size={16} />
          <span>Snap/upload</span>
        </Link>
      </div>
    </section>
  );
}

export default function HomeOverviewDashboard({
  viewerName,
  data,
  metrics,
  enrichMeta,
  metricsLoading,
  loading,
  onForceTravel,
}: HomeOverviewDashboardProps) {
  const [now, setNow] = useState(() => Date.now());
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const realEvents = useMemo(() => buildRealCreatorEvents(data), [data]);
  const ownedEvents = realEvents.filter((event) => event.ownership !== "invited");
  const invitedEvents = realEvents.filter((event) => event.ownership === "invited");
  const useSampleEvents = shouldUseAdminDashboardMockData && realEvents.length === 0 && !loading;
  const events = useMemo(
    () => (useSampleEvents ? mockEvents.map(buildSampleCreatorEvent) : ownedEvents),
    [ownedEvents, useSampleEvents],
  );
  const activity = useMemo(
    () => buildActivityItems(data, events, useSampleEvents),
    [data, events, useSampleEvents],
  );
  const smartAction = useMemo(
    () => buildSmartAction(events, useSampleEvents),
    [events, useSampleEvents],
  );
  const focusEvent =
    events.find((event) => event.id === smartAction.eventId) ||
    events.find((event) => event.needsAttention.length > 0) ||
    events[0] ||
    null;
  const nextEvent = events[0] || null;
  const totalRsvps = events.reduce((sum, event) => sum + rsvpTotal(event.rsvps), 0);
  const totalViewsValue = events.some((event) => event.views != null)
    ? events.reduce((sum, event) => sum + (event.views || 0), 0)
    : null;
  const attentionCount = events.reduce((sum, event) => sum + event.needsAttention.length, 0);
  const viewerLabel = getViewerLabel(viewerName);
  const travelContext =
    metricsLoading || metrics?.travelMinutes != null || enrichMeta?.hasDestination
      ? "Travel details stay in event view"
      : "Creator workspace";
  void onForceTravel;

  const stats = useSampleEvents
    ? [
        {
          label: "Active events",
          value: String(mockDashboardStats.activeEvents),
          detail: "Sample creator workspace",
          icon: CalendarDays,
        },
        {
          label: "Upcoming",
          value: String(mockDashboardStats.upcomingEvents),
          detail: "Next 90 days",
          icon: PartyPopper,
        },
        {
          label: "RSVPs",
          value: formatNumber(mockDashboardStats.totalRsvps),
          detail: "Sample responses",
          icon: Users,
        },
        {
          label: "Page views",
          value: formatNumber(mockDashboardStats.totalViews),
          detail: "Sample engagement",
          icon: Eye,
        },
        {
          label: "Needs attention",
          value: String(mockDashboardStats.needsAttention),
          detail: "Suggested updates",
          icon: AlertCircle,
        },
      ]
    : [
        {
          label: "Active events",
          value: String(events.length),
          detail: travelContext,
          icon: CalendarDays,
        },
        {
          label: "Upcoming",
          value: String(data?.snapshot.upcomingCount30Days ?? events.length),
          detail: "Next 30 days",
          icon: PartyPopper,
        },
        {
          label: "RSVPs",
          value: formatNumber(totalRsvps),
          detail: totalRsvps > 0 ? "Responses received" : "Waiting for responses",
          icon: Users,
        },
        {
          label: "Page views",
          value: totalViewsValue == null ? "Soon" : formatNumber(totalViewsValue),
          detail: "Backend tracking pending",
          icon: Eye,
        },
        {
          label: "Needs attention",
          value: String(attentionCount),
          detail: attentionCount > 0 ? "Quick fixes available" : "No urgent gaps",
          icon: AlertCircle,
        },
      ];

  const handleCopy = async (event: CreatorDashboardEvent) => {
    const href = buildAbsoluteUrl(eventHref(event));
    try {
      await navigator.clipboard.writeText(href);
      setCopiedEventId(event.id);
      window.setTimeout(() => setCopiedEventId(null), 1800);
    } catch {
      setCopiedEventId(null);
    }
  };

  const handleShare = async (event: CreatorDashboardEvent) => {
    const href = buildAbsoluteUrl(eventHref(event));
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: `View ${event.title} on Envitefy.`,
          url: href,
        });
        return;
      }
      await navigator.clipboard.writeText(href);
      setCopiedEventId(event.id);
      window.setTimeout(() => setCopiedEventId(null), 1800);
    } catch {
      // Native share cancellation should not surface an error state.
    }
  };

  if (loading && !data) {
    return <LoadingDashboardState />;
  }

  return (
    <div className="space-y-8 pb-28 pt-20 md:pt-8 lg:pb-10">
      <header className="rounded-3xl border border-[#e5e0f0] bg-white/92 p-5 shadow-[0_24px_70px_rgba(88,62,150,0.09)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7c67c5]">Welcome back</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-[#24193f] sm:text-4xl">
              Here is what is happening with your events, {viewerLabel}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6786] sm:text-base">
              Track upcoming pages, finish setup gaps, and jump into the right event workspace
              without digging through repeated actions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/studio"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#24193f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7c67c5]"
            >
              <WandSparkles size={16} />
              <span>Create event</span>
            </Link>
            <Link
              href="/event"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-[#ded8ec] bg-white px-5 py-3 text-sm font-semibold text-[#5f5480] transition hover:bg-[#fbf9ff]"
            >
              <Clipboard size={16} />
              <span>Snap/upload</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <DashboardStatCard key={stat.label} {...stat} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)]">
        <div className="space-y-8">
          <SmartActionCard action={smartAction} nextEvent={nextEvent} now={now} />
          {events.length > 0 ? (
            <UpcomingEventsList
              events={events}
              copiedEventId={copiedEventId}
              onCopy={handleCopy}
              onShare={handleShare}
            />
          ) : (
            <EmptyStateCard />
          )}

          {invitedEvents.length > 0 ? (
            <section className="rounded-3xl border border-[#e5e0f0] bg-white p-5 shadow-[0_18px_48px_rgba(71,49,130,0.07)]">
              <p className="text-sm font-semibold text-[#7c67c5]">Invited events</p>
              <h2 className="mt-1 text-xl font-bold text-[#24193f]">Shared with you</h2>
              <div className="mt-4 space-y-3">
                {invitedEvents.slice(0, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={eventHref(event)}
                    className="flex min-h-[58px] items-center justify-between gap-3 rounded-2xl border border-[#eee9f7] px-4 py-3 text-sm font-semibold text-[#24193f] transition hover:bg-[#fbf9ff]"
                  >
                    <span className="min-w-0 truncate">{event.title}</span>
                    <ArrowRight size={16} className="shrink-0 text-[#8b73d1]" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <EventHealthChecklist event={focusEvent} />
          <RecentActivityPanel activity={activity} />
          <ConciergeSuggestionsCard focusEvent={focusEvent} />
        </aside>
      </div>

      <MobileAdminNav />
    </div>
  );
}
