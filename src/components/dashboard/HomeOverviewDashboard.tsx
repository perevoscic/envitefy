"use client";

import {
  Calendar,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  type LucideIcon,
  MapPin,
  Navigation,
  WandSparkles,
  ListChecks,
  Users,
  PenLine,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { DashboardOverview } from "@/lib/dashboard-overview";
import { DashboardPlanningPanels, NextEventPlanning } from "./DashboardOverviewSections";
import { DashboardReviewDialog } from "./DashboardReviewDialog";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";
import { FlipClock } from "@/components/ui/flip-clock";
import { isScannedInviteCreatedVia } from "@/lib/dashboard-data";
import {
  type ThumbnailFocus,
  thumbnailFocusToObjectPosition,
} from "@/lib/thumbnail-focus";

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
  ownership?: "owned" | "invited";
  shareStatus?: "accepted" | "pending" | null;
  userRsvpResponse?: "yes" | "no" | "maybe" | null;
};

type DashboardMetricsCache = {
  eventId: string;
  travelMinutes: number | null;
  travelDistanceKm: number | null;
  travelUpdatedAt: string | null;
  travelOriginLabel?: string | null;
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
  overview?: DashboardOverview;
  eventWindowLimited?: boolean;
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
  travelError?: string | null;
  metricsLoading: boolean;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onForceTravel: () => void;
};

type CardTone = "indigo" | "pink" | "sky" | "amber";

/** Internal `event_history.data.category` slugs → human copy for the invite card pill (avoids SPORT_* raw strings). */
const INVITE_CARD_CATEGORY_BADGE: Record<string, string> = {
  sport_gymnastics_schedule: "Gymnastics",
};

function inviteCardCategoryBadge(
  category: string | null | undefined,
  fallback: string,
): string {
  const raw = String(category || "").trim();
  if (!raw) return fallback;
  return INVITE_CARD_CATEGORY_BADGE[raw] ?? raw;
}

function getDashboardThumbnailObjectPosition(
  item: DashboardEventItem,
): string | undefined {
  const explicitPosition = thumbnailFocusToObjectPosition(item.thumbnailFocus);
  if (explicitPosition) return explicitPosition;
  const createdVia = String(item.createdVia || "")
    .trim()
    .toLowerCase();
  return createdVia.startsWith("ocr") ? "50% 22%" : undefined;
}

const CARD_TONE_STYLES: Record<
  CardTone,
  { iconClassName: string; shadowClassName: string }
> = {
  indigo: {
    iconClassName: "bg-indigo-50 text-indigo-600",
    shadowClassName: "hover:shadow-indigo-100/70",
  },
  pink: {
    iconClassName: "bg-pink-50 text-pink-500",
    shadowClassName: "hover:shadow-pink-100/70",
  },
  sky: {
    iconClassName: "bg-sky-50 text-sky-600",
    shadowClassName: "hover:shadow-sky-100/70",
  },
  amber: {
    iconClassName: "bg-amber-50 text-amber-500",
    shadowClassName: "hover:shadow-amber-100/70",
  },
};

type InfoCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: CardTone;
  href?: string | null;
  external?: boolean;
  description?: string;
  review?: { kind: "conflicts" | "attention"; overview: DashboardOverview };
};

type InvitationCardStat = {
  icon: LucideIcon;
  label: string;
  value: string;
};

type InvitationAction = {
  label: string;
  href?: string | null;
  onClick?: () => void;
  icon?: LucideIcon;
  external?: boolean;
};

type InvitationEventCardProps = {
  item: DashboardEventItem;
  now: number;
  primary?: boolean;
  stats: InvitationCardStat[];
  primaryAction: InvitationAction;
  secondaryAction?: InvitationAction | null;
  planning?: ReactNode;
};

function InfoCard({
  label,
  value,
  icon: Icon,
  tone,
  href,
  external = false,
  description,
  review,
}: InfoCardProps) {
  const toneStyles = CARD_TONE_STYLES[tone];
  const className = `group flex flex-col rounded-[32px] border border-slate-100 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-1 hover:border-indigo-100 ${toneStyles.shadowClassName}`;
  const content = (
    <>
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneStyles.iconClassName}`}
        >
          <Icon size={20} />
        </div>
      </div>
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="text-[1.35rem] font-black leading-none tracking-tight text-slate-900 sm:text-2xl">
        {value}
      </p>
      {description ? <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p> : null}
    </>
  );

  if (review) {
    return (
      <DashboardReviewDialog {...review}>
        <button type="button" className={`${className} w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600`}>
          {content}
        </button>
      </DashboardReviewDialog>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        aria-label={`${label}: ${value}`}
      >
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}

function InvitationEventCard({
  item,
  now,
  primary = false,
  stats,
  primaryAction,
  secondaryAction,
  planning,
}: InvitationEventCardProps) {
  const relationLabel = eventRelationLabel(item);
  const statusLabel = getEventStatusLabel(item);
  const statusTone = getInvitationStatusTone(item);
  const statusClassName = getInvitationStatusTextClass(item);
  const countdown = buildCountdownParts(parseSafeDate(item.startAt), now);
  const isInvited = item.ownership === "invited";
  const isScannedOrUploaded = isScannedInviteCreatedVia(item.createdVia);
  const deleteMode = item.shareStatus ? "removeInvited" : "delete";
  const thumbnailObjectPosition = getDashboardThumbnailObjectPosition(item);
  const primaryButtonClassName = `group/btn inline-flex min-h-[56px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[20px] px-5 py-4 text-sm font-bold text-white shadow-xl transition-all sm:min-h-[60px] sm:min-w-[170px] sm:px-8 sm:text-base ${
    isInvited
      ? "bg-indigo-600 hover:opacity-90"
      : "bg-slate-900 hover:bg-indigo-600"
  }`;
  const secondaryButtonClassName =
    "inline-flex min-h-[56px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 sm:min-h-[60px] sm:min-w-[170px] sm:px-8 sm:text-base";

  const renderAction = (
    action: InvitationAction,
    className: string,
    trailingChevron = false,
  ) => {
    const Icon = action.icon;
    const content = (
      <>
        <span>{action.label}</span>
        {trailingChevron ? (
          <ChevronRight
            size={16}
            className="transition-transform group-hover/btn:translate-x-1"
          />
        ) : Icon ? (
          <Icon size={14} />
        ) : null}
      </>
    );

    if (action.onClick) {
      return (
        <button type="button" onClick={action.onClick} className={className}>
          {content}
        </button>
      );
    }

    return (
      <Link
        href={action.href || "#"}
        target={action.external ? "_blank" : undefined}
        rel={action.external ? "noreferrer" : undefined}
        className={className}
      >
        {content}
      </Link>
    );
  };

  return (
    <div className="group relative w-full">
      <div
        className={`pointer-events-none absolute -inset-1 rounded-[42px] bg-gradient-to-r opacity-0 blur transition duration-1000 group-hover:opacity-10 ${
          statusTone === "green"
            ? "from-emerald-400 to-indigo-500"
            : "from-indigo-400 to-purple-500"
        }`}
      />
      <div className="relative overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl">
        <div className="flex min-h-[400px] flex-col md:flex-row">
          <div className="relative min-h-[280px] w-full overflow-hidden md:w-[48%]">
            {item.coverImageUrl ? (
              <>
                <Image
                  src={item.coverImageUrl}
                  alt={item.title}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 48vw"
                  className="object-cover transition-transform duration-[4000ms] group-hover:scale-105"
                  style={
                    thumbnailObjectPosition
                      ? { objectPosition: thumbnailObjectPosition }
                      : undefined
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.85),_rgba(79,70,229,0.92)_45%,_rgba(30,41,59,0.96)_100%)]" />
            )}

            <div className="absolute left-6 top-6">
              <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xl">
                {inviteCardCategoryBadge(item.category, relationLabel)}
              </span>
            </div>

            <div className="absolute bottom-8 left-8 right-8 top-20 flex flex-col justify-end md:bottom-10 md:left-10 md:right-10 md:top-24">
              <h3
                className={`mb-3 font-black leading-snug tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] ${
                  primary
                    ? "text-2xl sm:text-3xl md:text-4xl"
                    : "text-xl sm:text-2xl md:text-3xl"
                }`}
                style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
              >
                {item.title}
              </h3>
              <p className="flex items-center gap-2 text-sm font-medium text-white">
                <MapPin size={16} className="text-white/60" />
                {item.locationText || "Location details coming soon"}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between bg-slate-50/30 p-6 sm:p-8 md:p-12">
            <div
              className={`flex flex-col gap-8 ${primary ? "md:flex-row md:justify-between" : ""}`}
            >
              {primary ? (
                <div className="space-y-4 md:min-w-0 md:flex-1 md:pr-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Countdown
                  </p>
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

              <div
                className={`space-y-2 ${
                  primary ? "text-left md:w-auto md:shrink-0 md:text-right" : "text-left"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Current Status
                </p>
                <div
                  className={`flex items-start justify-between gap-4 ${
                    primary ? "md:block" : "sm:block"
                  }`}
                >
                  <p
                    className={`text-3xl font-black tracking-tight leading-none ${statusClassName}`}
                  >
                    {statusLabel}
                  </p>
                  <div
                    className={`space-y-0.5 pt-1 text-right opacity-60 ${
                      primary ? "md:pt-0 md:text-right" : "sm:pt-0 sm:text-left"
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">
                      {formatLongDate(item.startAt)}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      {formatTimeOnlyRange(item.startAt, item.endAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {!planning ? (
            <div
              className={`my-8 grid gap-3 ${
                stats.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={`${item.id}-${stat.label}`}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="text-indigo-500">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                        {stat.label}
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : null}

            {planning ? <div className="mt-6">{planning}</div> : null}

            {isScannedOrUploaded ? (
              <div
                className="mb-4 flex min-h-11 items-center justify-end gap-2"
                role="group"
                aria-label={`Actions for ${item.title}`}
              >
                <EventActions
                  shareUrl={`/event/${encodeURIComponent(item.id)}`}
                  event={{
                    title: item.title,
                    start: item.startAt,
                    end: item.endAt,
                    location: item.locationText,
                  }}
                  calendarTitle={item.title}
                  historyId={item.id}
                  variant="compact"
                  showCalendar={false}
                  showEmail={false}
                />
                <EventDeleteModal
                  eventId={item.id}
                  eventTitle={item.title}
                  deleteMode={deleteMode}
                  eventData={deleteMode === "removeInvited" ? { shared: true } : undefined}
                  navigateAfterDelete={false}
                  buttonClassName="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white/90 px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  labelClassName="hidden sm:inline"
                  ariaLabel={`${deleteMode === "removeInvited" ? "Remove" : "Delete"} ${item.title}`}
                />
              </div>
            ) : null}

            <div className="flex gap-3 sm:gap-4">
              {renderAction(primaryAction, primaryButtonClassName, true)}
              {secondaryAction
                ? renderAction(secondaryAction, secondaryButtonClassName)
                : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseSafeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatLongDate(value: string | null | undefined): string {
  const parsed = parseSafeDate(value);
  if (!parsed) return "Date pending";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

function formatTimeOnlyRange(
  startRaw: string | null | undefined,
  endRaw: string | null | undefined,
): string {
  const start = parseSafeDate(startRaw);
  if (!start) return "Time pending";
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  const end = parseSafeDate(endRaw);
  if (!end || end.getTime() <= start.getTime()) {
    return startTime;
  }
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end);
  return `${startTime} - ${endTime}`;
}

function eventRelationLabel(
  item: DashboardEventItem | null | undefined,
): string {
  if (!item) return "My Event";
  if (item.ownership === "invited") {
    return item.shareStatus === "pending" ? "Pending Invite" : "Invited";
  }
  return "My Event";
}

function getViewerLabel(viewerName: string): string {
  const trimmed = viewerName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] || trimmed;
}

function getEventStatusLabel(item: DashboardEventItem | null): string {
  if (!item) return "Ready";
  const currentTime = Date.now();
  if (Date.parse(item.startAt) <= currentTime && item.endAt && Date.parse(item.endAt) > currentTime) {
    return "Happening now";
  }
  if (item.ownership === "invited") {
    if (item.shareStatus === "pending") return "Pending";
    const rsvp = item.userRsvpResponse;
    if (rsvp === "yes") return "Confirmed";
    if (rsvp === "maybe") return "Maybe";
    if (rsvp === "no") return "Declined";
    return "Invited";
  }
  const normalized = String(item.status || "").toLowerCase();
  if (normalized === "draft") return "Draft";
  if (normalized === "cancelled" || normalized === "canceled")
    return "Canceled";
  if (normalized === "archived") return "Archived";
  const rsvp = item.userRsvpResponse;
  if (rsvp === "yes") return "Confirmed";
  if (rsvp === "maybe") return "Maybe";
  if (rsvp === "no") return "Declined";
  return "Upcoming";
}

function getInvitationStatusTone(
  item: DashboardEventItem | null | undefined,
): "green" | "orange" {
  const label = getEventStatusLabel(item ?? null).toLowerCase();
  if (label === "confirmed") return "green";
  return "orange";
}

function getInvitationStatusTextClass(
  item: DashboardEventItem | null | undefined,
): string {
  return getInvitationStatusTone(item) === "green"
    ? "text-emerald-500"
    : "text-orange-500";
}

function buildCountdownParts(target: Date | null, now: number) {
  if (!target) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      totalMinutes: "00",
    };
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
    totalMinutes: String(totalMinutes).padStart(2, "0"),
  };
}

function buildInvitationStats(
  item: DashboardEventItem,
  options: {
    isPrimary: boolean;
    rsvp: DashboardResponse["rsvp"] | null | undefined;
    metrics: DashboardMetricsCache | null;
    metricsLoading: boolean;
  },
): InvitationCardStat[] {
  const timeValue = formatTimeOnlyRange(item.startAt, null);
  const travelValue =
    options.metricsLoading && options.isPrimary
      ? "Refreshing"
      : options.metrics?.travelMinutes != null
        ? `${options.metrics.travelMinutes} min`
        : null;
  const weatherValue =
    options.metrics?.weatherTemp != null
      ? `${Math.round(options.metrics.weatherTemp)}°F`
      : null;

  if (item.ownership === "invited") {
    return [
      {
        icon: CheckCircle2,
        label: "Invite",
        value:
          item.shareStatus === "pending" ? "Awaiting reply" : "Shared with you",
      },
      {
        icon: travelValue ? Navigation : Clock,
        label: travelValue ? "Travel" : "Starts",
        value: travelValue || timeValue,
      },
    ];
  }

  return [
    { icon: Clock, label: "Starts", value: timeValue },
    travelValue
      ? { icon: Navigation, label: "Travel", value: travelValue }
      : weatherValue && options.isPrimary
        ? { icon: Calendar, label: "Forecast", value: weatherValue }
        : options.isPrimary && options.rsvp
          ? {
              icon: CheckCircle2,
              label: "Responses",
              value: `${options.rsvp.going} going`,
            }
          : null,
  ].filter(Boolean) as InvitationCardStat[];
}

function buildInvitationActions(
  item: DashboardEventItem,
  onForceTravel?: () => void,
): {
  primaryAction: InvitationAction;
  secondaryAction: InvitationAction | null;
} {
  const isInvitedWithoutResponse = item.ownership === "invited" && !item.userRsvpResponse && item.shareStatus !== "pending";
  const eventHref = `/event/${item.id}`;

  if (!item.hasRsvp) {
    if (item.mapsUrl) {
      return {
        primaryAction: {
          href: item.mapsUrl,
          label: "Get Directions",
          icon: Navigation,
          external: true,
        },
        secondaryAction: {
          href: eventHref,
          label: "View details",
        },
      };
    }

    return {
      primaryAction: { href: eventHref, label: "View details" },
      secondaryAction: null,
    };
  }

  if (isInvitedWithoutResponse && item.hasRsvp) {
    return {
      primaryAction: { href: eventHref, label: "RSVP Now" },
      secondaryAction: item.mapsUrl || !onForceTravel
        ? {
            href: eventHref,
            label: "View details",
          }
        : {
            label: "Estimate Travel",
            icon: Navigation,
            onClick: onForceTravel,
          },
    };
  }

  return {
    primaryAction: { href: eventHref, label: "Open Event" },
    secondaryAction: item.mapsUrl
      ? {
          href: item.mapsUrl,
          label: "Get Directions",
          icon: Navigation,
          external: true,
        }
      : null,
  };
}

function LoadingDashboardState() {
  return (
    <div className="space-y-8 pt-20 md:pt-10" role="status" aria-live="polite">
      <p className="text-base font-medium text-slate-600">Loading your events…</p>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-3">
          <div className="h-3 w-40 animate-pulse rounded-full bg-indigo-100" />
          <div className="h-14 w-72 animate-pulse rounded-[24px] bg-slate-200" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-14 w-44 animate-pulse rounded-[24px] bg-slate-200" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="min-h-[440px] animate-pulse rounded-[40px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[176px] animate-pulse rounded-[32px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
          />
        ))}
      </div>
    </div>
  );
}

export default function HomeOverviewDashboard({
  viewerName,
  data,
  metrics,
  enrichMeta,
  travelError,
  metricsLoading,
  loading,
  error,
  onRetry,
  onForceTravel,
}: HomeOverviewDashboardProps) {
  const [now, setNow] = useState(() => Date.now());
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [upcomingFilter, setUpcomingFilter] = useState<"all" | "owned" | "invited">("all");
  const nextEvent = data?.nextEvent ?? null;

  useEffect(() => {
    if (!nextEvent) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [nextEvent]);

  const viewerLabel = getViewerLabel(viewerName);
  const relationLabel = eventRelationLabel(nextEvent);
  const topKicker = nextEvent
    ? nextEvent.ownership === "invited"
      ? "Upcoming Invitation"
      : "Dashboard Focus"
    : "Dashboard Overview";
  const heroSummary = nextEvent
    ? ""
    : "Your home dashboard will spotlight countdowns, travel, weather, and upcoming invites as soon as you add an event.";
  const nextEventStats = useMemo(
    () =>
      nextEvent
        ? buildInvitationStats(nextEvent, {
            isPrimary: true,
            rsvp: data?.rsvp,
            metrics,
            metricsLoading,
          })
        : [],
    [data?.rsvp, metrics, metricsLoading, nextEvent],
  );
  const nextEventActions = useMemo(
    () => {
      if (!nextEvent) return null;
      const actions = buildInvitationActions(nextEvent, onForceTravel);
      if (actions.primaryAction.external) return { primaryAction: { href: `/event/${encodeURIComponent(nextEvent.id)}`, label: "View details" }, secondaryAction: null };
      return { ...actions, secondaryAction: actions.secondaryAction?.external ? null : actions.secondaryAction };
    },
    [nextEvent, onForceTravel],
  );

  const overview = data?.overview;
  const attentionCount = overview?.attention.length || 0;
  const conflictCount = overview?.conflicts.length || 0;
  const replies = overview?.guests.reduce((total, guest) => total + guest.going + guest.maybe + guest.declined, 0) || 0;
  const openSignupSpots = overview?.signups.reduce((total, form) => total + form.remaining, 0) || 0;
  const hasUnlimitedSignup = overview?.signups.some((form) => form.unlimitedSlots > 0) || false;
  const infoCards: InfoCardProps[] = [
    {
      label: "Next 7 days", value: `${data?.snapshot.upcomingCount7Days ?? 0} Events`,
      description: `${data?.snapshot.upcomingCount30Days ?? 0} in the next 30 days`,
      icon: Calendar, tone: "pink", href: "#dashboard-agenda",
    },
    {
      label: "Schedule conflicts", value: overview ? `${conflictCount} ${conflictCount === 1 ? "conflict" : "conflicts"}` : "Not available",
      description: !overview ? "Refresh to load your schedule" : conflictCount ? "Review overlapping event times" : "No overlapping event times", icon: CalendarClock, tone: "amber",
      review: overview ? { kind: "conflicts", overview } : undefined,
      href: overview ? undefined : "#dashboard-agenda",
    },
    ...(overview?.guests.length ? [{
      label: "Guest responses", value: `${replies} ${replies === 1 ? "Reply" : "Replies"}`,
      description: `Across ${overview.guests.length} of your events`, icon: Users, tone: "sky" as const, href: "#dashboard-guests",
    }] : []),
    ...(overview?.drafts.count ? [{
      label: "Drafts", value: `${overview.drafts.count} to finish`, description: "Pick up where you left off",
      icon: PenLine, tone: "indigo" as const, href: "#dashboard-drafts",
    }] : []),
    ...(!overview?.drafts.count && overview?.signups.length ? [{
      label: "Sign-up spots", value: openSignupSpots ? `${openSignupSpots} open` : hasUnlimitedSignup ? "Open sign-ups" : "All covered",
      description: "See coverage for your events", icon: Users, tone: "indigo" as const, href: "#dashboard-signups",
    }] : []),
    {
      label: "Needs attention", value: overview && !overview.unavailable.includes("event details") ? (attentionCount ? `${attentionCount} to review` : "All caught up") : "Not available",
      description: "Invitations and event details", icon: ListChecks, tone: "indigo",
      review: overview ? { kind: "attention", overview } : undefined,
      href: overview ? undefined : "#dashboard-agenda",
    },
  ];

  if (!data && (loading || !error)) {
    return <LoadingDashboardState />;
  }

  if (!data && error) {
    return (
      <div className="pt-20 md:pt-10">
        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl sm:p-10">
          <h1 className="text-2xl font-bold text-slate-900">Your events couldn’t load</h1>
          <p role="alert" className="mt-3 text-base text-slate-600">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-10 space-y-8 md:space-y-10">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">
              {topKicker}
            </span>
          </div>
          <h1 className="text-4xl font-black leading-none tracking-tight text-slate-900 md:text-5xl">
            Welcome, <span className="text-indigo-600">{viewerLabel}.</span>
          </h1>
          {heroSummary ? (
            <p className="mt-4 max-w-2xl text-base font-medium text-slate-400">
              {heroSummary}
            </p>
          ) : null}
        </div>
        <button type="button" onClick={onRetry} disabled={loading} aria-busy={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60">
          {loading ? "Refreshing…" : "Refresh dashboard"}
        </button>
      </header>

      {error ? <p role="status" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Your latest refresh didn’t finish. Showing your previously loaded events.</p> : null}

      <section>
        {nextEvent && nextEventActions ? (
          <InvitationEventCard
            item={nextEvent}
            now={now}
            primary
            stats={nextEventStats}
            primaryAction={nextEventActions.primaryAction}
            secondaryAction={nextEventActions.secondaryAction}
            planning={<NextEventPlanning event={nextEvent} metrics={metrics?.eventId === nextEvent.id ? metrics : null}
              loading={metricsLoading} hasOrigin={enrichMeta?.hasOrigin} onTravel={onForceTravel} error={travelError}
              editHref={overview?.editLinks[nextEvent.id]} now={now} />}
          />
        ) : (
          <article className="relative overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-xl">
            <div className="flex min-h-[400px] flex-col md:flex-row">
              <div className="relative min-h-[280px] w-full overflow-hidden md:w-[48%]">
                <Image
                  src="/no-event-placeholder-card-wide.webp"
                  alt="Decorative empty state invitation background"
                  fill
                  sizes="(max-width: 768px) 100vw, 48vw"
                  quality={60}
                  className="object-cover object-center opacity-90"
                />
                <div className="absolute inset-0 bg-slate-900/18" />
                <div className="absolute left-6 top-6">
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xl">
                    {relationLabel}
                  </span>
                </div>
                <div className="absolute bottom-8 left-8 right-8 md:bottom-10 md:left-10 md:right-10">
                  <h2 className="mb-4 text-3xl font-black leading-tight tracking-tighter text-white md:text-5xl">
                    Nothing is scheduled yet
                  </h2>
                  <p className="text-sm font-medium text-white">
                    Create or import an event and your home dashboard will start
                    highlighting what is next.
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between bg-slate-50/30 p-6 sm:p-8 md:p-12">
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Countdown
                  </p>
                  <FlipClock
                    units={[
                      { label: "Days", value: "00" },
                      { label: "Hours", value: "00" },
                      { label: "Mins", value: "00" },
                    ]}
                    className="justify-start"
                  />
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Current Status
                    </p>
                    <p className="text-3xl font-black tracking-tight text-slate-900">
                      Ready
                    </p>
                    <p className="text-sm font-medium text-slate-400">
                      Create an event to unlock live timing and travel details.
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/studio"
                    className="inline-flex min-h-[56px] min-w-[150px] flex-1 items-center justify-center gap-2 rounded-[20px] bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-indigo-600 sm:min-w-[170px] sm:px-8"
                  >
                    <WandSparkles size={16} />
                    <span>Create in Studio</span>
                  </Link>
                  <Link
                    href="/event"
                    className="inline-flex min-h-[56px] min-w-[150px] flex-1 items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-100 hover:bg-slate-50 sm:min-w-[170px] sm:px-8"
                  >
                    <Camera size={16} />
                    <span>Snap/upload</span>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        )}
      </section>

      <section aria-label="Dashboard summary" className={`grid grid-cols-2 gap-4 md:gap-6 ${infoCards.length === 5 ? "xl:grid-cols-5 [&>:last-child]:col-span-2 xl:[&>:last-child]:col-span-1" : infoCards.length === 4 ? "xl:grid-cols-4" : infoCards.length === 3 ? "xl:grid-cols-3" : ""}`}>
        {infoCards.map((card) => (
          <InfoCard key={card.label} {...card} />
        ))}
      </section>

      {overview?.unavailable.length ? <p role="status" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Some details couldn’t load: {overview.unavailable.join(", ")}. <button type="button" onClick={onRetry} className="min-h-11 font-semibold underline underline-offset-4">Try again</button></p> : null}
      <DashboardPlanningPanels overview={overview} />
      <div id="dashboard-agenda" className="scroll-mt-24">
        {(() => {
          const upcomingRest = (data?.upcoming ?? []).filter((event) => event.id !== nextEvent?.id);
          if (!upcomingRest.length) return null;
          const invitedCount = upcomingRest.filter((event) => event.ownership === "invited").length;
          const filterOptions = [
            { value: "all", label: "All", count: upcomingRest.length },
            { value: "owned", label: "My events", count: upcomingRest.length - invitedCount },
            { value: "invited", label: "Invited events", count: invitedCount },
          ] as const;
          const filteredUpcoming = upcomingRest.filter((event) => upcomingFilter === "all" || (event.ownership || "owned") === upcomingFilter);
          const visibleUpcoming = showAllUpcoming ? filteredUpcoming : filteredUpcoming.slice(0, 3);
          return (
            <section className="flex flex-col gap-4" aria-label="Upcoming events">
                <div role="group" aria-label="Filter upcoming events" className="inline-flex max-w-full flex-wrap self-start rounded-2xl border border-slate-100 bg-white p-1">
                  {filterOptions.map((option) => (
                    <button type="button" key={option.value} aria-pressed={upcomingFilter === option.value}
                      aria-label={`${option.label}, ${option.count} ${option.count === 1 ? "event" : "events"}`}
                      onClick={() => { setUpcomingFilter(option.value); setShowAllUpcoming(false); }}
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-indigo-600 sm:gap-2 sm:px-3 sm:text-sm ${upcomingFilter === option.value ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-indigo-50"}`}>
                      <span>{option.label}</span>
                      <span aria-hidden="true" className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums sm:h-[22px] sm:min-w-[22px] sm:text-[11px] ${upcomingFilter === option.value ? "bg-white text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>
              <div className="flex flex-col gap-6">
                {visibleUpcoming.map((ev) => {
                  const actions = buildInvitationActions(ev);
                  return (
                    <InvitationEventCard key={ev.id} item={ev} now={now} primary={false}
                      stats={buildInvitationStats(ev, { isPrimary: false, rsvp: null, metrics: null, metricsLoading: false })}
                      primaryAction={actions.primaryAction} secondaryAction={actions.secondaryAction} />
                  );
                })}
              </div>
              {!filteredUpcoming.length ? <p className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-500">No other upcoming {upcomingFilter === "invited" ? "invited events" : "events you own"}.</p> : null}
              {filteredUpcoming.length > 3 ? (
                <button type="button" aria-expanded={showAllUpcoming} onClick={() => setShowAllUpcoming((current) => !current)}
                  className="mobile-touch-target mx-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                  {showAllUpcoming ? <>Show fewer events <ChevronUp className="h-4 w-4" /></> : <>Show all {filteredUpcoming.length} events <ChevronDown className="h-4 w-4" /></>}
                </button>
              ) : null}
              {data?.eventWindowLimited ? <p className="text-xs text-slate-500">Showing the nearest saved events. Your event list has the rest.</p> : null}
            </section>
          );
        })()}
      </div>
    </div>
  );
}
