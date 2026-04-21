"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  Clock,
  MapPin,
  Navigation,
  type LucideIcon,
} from "lucide-react";

type DashboardEventItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  locationText: string | null;
  status: string | null;
  category: string | null;
  coverImageUrl?: string | null;
  numberOfGuests?: number;
  reminderCount?: number;
  mapsUrl?: string | null;
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
  onCreateEvent: () => void;
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
};

type CountdownSplitFlapUnitProps = {
  value: string;
  label: string;
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
};

function InfoCard({
  label,
  value,
  icon: Icon,
  tone,
  href,
  external = false,
}: InfoCardProps) {
  const toneStyles = CARD_TONE_STYLES[tone];
  const className = `group block rounded-[32px] border border-slate-100 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-1 hover:border-indigo-100 ${toneStyles.shadowClassName}`;
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
    </>
  );

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

function CountdownFlap({ char }: { char: string }) {
  const [displayChar, setDisplayChar] = useState(char);
  const [nextChar, setNextChar] = useState(char);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (char === displayChar) return;
    setNextChar(char);
    setIsFlipping(true);
    const timer = window.setTimeout(() => {
      setDisplayChar(char);
      setIsFlipping(false);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [char, displayChar]);

  return (
    <div className="select-none">
      <div className="perspective-1000 relative h-14 w-10 md:h-[4.5rem] md:w-[3.4rem]">
        <div className="absolute inset-0 overflow-hidden rounded-xl border-b-4 border-black/60 bg-zinc-900 text-white shadow-2xl">
          <div className="absolute top-0 h-1/2 w-full border-b border-black/40 bg-black/30" />
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-[2.35rem] font-black tracking-tighter md:text-[3.35rem]">
              {nextChar}
            </span>
          </div>
        </div>

        <div
          className={`preserve-3d absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl border-b-4 border-black/60 bg-zinc-900 text-white transition-transform duration-500 ${
            isFlipping ? "animate-flap-down" : ""
          }`}
          style={{ backfaceVisibility: "hidden", zIndex: isFlipping ? 30 : 10 }}
        >
          <div className="absolute top-0 h-1/2 w-full border-b border-black/40 bg-black/30" />
          <span className="font-mono text-[2.35rem] font-black tracking-tighter md:text-[3.35rem]">
            {displayChar}
          </span>
          <div className="absolute left-0 top-1/2 h-3 w-1 -translate-y-1/2 rounded-r-full bg-black/80 md:h-4 md:w-1.5" />
          <div className="absolute right-0 top-1/2 h-3 w-1 -translate-y-1/2 rounded-l-full bg-black/80 md:h-4 md:w-1.5" />
        </div>

        <div className="absolute inset-0 z-[5] flex items-center justify-center overflow-hidden rounded-xl border-b-4 border-black/60 bg-zinc-900 text-white">
          <div className="absolute top-0 h-1/2 w-full border-b border-black/40 bg-black/30" />
          <span className="font-mono text-[2.35rem] font-black tracking-tighter md:text-[3.35rem]">
            {displayChar}
          </span>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        .preserve-3d {
          transform-style: preserve-3d;
          transform-origin: center center;
        }

        @keyframes flap-down {
          0% {
            transform: rotateX(0deg);
          }
          50% {
            transform: rotateX(-90deg);
            opacity: 1;
          }
          51% {
            opacity: 0;
          }
          100% {
            transform: rotateX(-180deg);
            opacity: 0;
          }
        }

        .animate-flap-down {
          animation: flap-down 0.6s cubic-bezier(0.455, 0.03, 0.515, 0.955)
            forwards;
        }
      `}</style>
    </div>
  );
}

function CountdownSplitFlapUnit({ value, label }: CountdownSplitFlapUnitProps) {
  const chars = value.padStart(2, "0").split("");

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3">
      <div className="flex gap-1.5 md:gap-2">
        {chars.map((char, index) => (
          <CountdownFlap key={`${label}-${index}`} char={char} />
        ))}
      </div>
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-zinc-500 md:text-[11px] md:tracking-[0.35em]">
        {label}
      </p>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <div className="flex translate-y-2.5 flex-col gap-1.5 sm:gap-2">
      <div className="h-1 w-1 rounded-full bg-zinc-300 sm:h-1.5 sm:w-1.5" />
      <div className="h-1 w-1 rounded-full bg-zinc-300 sm:h-1.5 sm:w-1.5" />
    </div>
  );
}

function InvitationEventCard({
  item,
  now,
  primary = false,
  stats,
  primaryAction,
  secondaryAction,
}: InvitationEventCardProps) {
  const relationLabel = eventRelationLabel(item);
  const statusLabel = getEventStatusLabel(item);
  const statusTone = getInvitationStatusTone(item);
  const statusClassName = getInvitationStatusTextClass(item);
  const countdown = buildCountdownParts(parseSafeDate(item.startAt), now);
  const isInvited = item.ownership === "invited";
  const primaryButtonClassName = `group/btn inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[20px] px-4 py-4 text-xs font-bold text-white shadow-xl transition-all sm:min-w-[170px] sm:px-8 sm:text-sm ${
    isInvited
      ? "bg-indigo-600 hover:opacity-90"
      : "bg-slate-900 hover:bg-indigo-600"
  }`;
  const secondaryButtonClassName =
    "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 sm:min-w-[170px] sm:px-8 sm:text-sm";

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
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Countdown
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:gap-3">
                    {[
                      { label: "Days", value: countdown.days },
                      { label: "Hours", value: countdown.hours },
                      { label: "Mins", value: countdown.minutes },
                    ].map((countdownItem, index) => (
                      <div
                        key={`${item.id}-${countdownItem.label}`}
                        className="flex items-start gap-2 sm:gap-2.5 md:gap-4"
                      >
                        <CountdownSplitFlapUnit
                          value={countdownItem.value}
                          label={countdownItem.label}
                        />
                        {index < 2 ? <CountdownSeparator /> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className={`space-y-2 ${primary ? "text-left md:text-right" : "text-left"}`}>
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
  onForceTravel: () => void,
): {
  primaryAction: InvitationAction;
  secondaryAction: InvitationAction | null;
} {
  const statusLabel = getEventStatusLabel(item);
  const isInvitedWithoutResponse = statusLabel === "Invited";

  if (isInvitedWithoutResponse) {
    return {
      primaryAction: { href: `/event/${item.id}`, label: "RSVP Now" },
      secondaryAction: item.mapsUrl
        ? {
            href: `/event/${item.id}`,
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
    primaryAction: { href: `/event/${item.id}`, label: "Open Event" },
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
    <div className="space-y-8">
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
  metricsLoading,
  loading,
  onForceTravel,
  onCreateEvent,
}: HomeOverviewDashboardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nextEvent = data?.nextEvent ?? null;
  const viewerLabel = getViewerLabel(viewerName);
  const relationLabel = eventRelationLabel(nextEvent);
  const hasTravelMetrics =
    metrics?.travelMinutes != null || metrics?.travelDistanceKm != null;
  const travelMissingOrigin =
    enrichMeta?.hasDestination && enrichMeta?.hasOrigin === false;
  const weatherEligible = Boolean(data?.metricsEligibility.weatherEligible);
  const topKicker = nextEvent
    ? nextEvent.ownership === "invited"
      ? "Upcoming Invitation"
      : "Dashboard Focus"
    : "Dashboard Overview";
  const heroSummary = nextEvent
    ? `${nextEvent.title} is next on your calendar. Keep track of timing, travel, and what still needs attention.`
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
    () => (nextEvent ? buildInvitationActions(nextEvent, onForceTravel) : null),
    [nextEvent, onForceTravel],
  );

  const infoCards: InfoCardProps[] = [
    {
      label: "Upcoming",
      value: `${data?.snapshot.upcomingCount30Days ?? 0} Events`,
      icon: Calendar,
      tone: "pink",
    },
    {
      label: "Travel Time",
      value: metricsLoading
        ? "Refreshing"
        : hasTravelMetrics
          ? `${metrics?.travelMinutes ?? "--"} min`
          : travelMissingOrigin
            ? "Add Origin"
            : "Estimate",
      icon: Navigation,
      tone: "sky",
    },
    {
      label: "Weather",
      value: metricsLoading
        ? "Refreshing"
        : metrics?.weatherTemp != null
          ? `${Math.round(metrics.weatherTemp)}°F`
          : weatherEligible
            ? "Pending"
            : "72h Window",
      icon: CloudSun,
      tone: "amber",
    },
    {
      label: "Directions",
      value: nextEvent?.mapsUrl
        ? "Open Route"
        : nextEvent
          ? "Add Venue"
          : "No Event",
      icon: MapPin,
      tone: "indigo",
      href: nextEvent?.mapsUrl || null,
      external: true,
    },
  ];

  if (loading && !data) {
    return <LoadingDashboardState />;
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
          <p className="mt-4 max-w-2xl text-base font-medium text-slate-400">
            {heroSummary}
          </p>
        </div>
      </header>

      <section>
        {nextEvent && nextEventActions ? (
          <InvitationEventCard
            item={nextEvent}
            now={now}
            primary
            stats={nextEventStats}
            primaryAction={nextEventActions.primaryAction}
            secondaryAction={nextEventActions.secondaryAction}
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
                  <div className="flex items-center gap-2 sm:gap-3">
                    {[
                      { label: "Days", value: "00" },
                      { label: "Hours", value: "00" },
                      { label: "Mins", value: "00" },
                    ].map((countdownItem, index) => (
                      <div
                        key={countdownItem.label}
                        className="flex items-start gap-2 sm:gap-2.5 md:gap-4"
                      >
                        <CountdownSplitFlapUnit
                          value={countdownItem.value}
                          label={countdownItem.label}
                        />
                        {index < 2 ? <CountdownSeparator /> : null}
                      </div>
                    ))}
                  </div>
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
                  <button
                    type="button"
                    onClick={onCreateEvent}
                    className="group/btn inline-flex min-w-[170px] flex-1 items-center justify-center gap-2 rounded-[20px] bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-indigo-600"
                  >
                    Create First Event
                    <ChevronRight
                      size={16}
                      className="transition-transform group-hover/btn:translate-x-1"
                    />
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
        {infoCards.map((card) => (
          <InfoCard key={card.label} {...card} />
        ))}
      </section>

      {(() => {
        const upcomingRest = (data?.upcoming ?? []).filter(
          (e) => e.id !== nextEvent?.id,
        );
        if (upcomingRest.length === 0) return null;
        return (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                Upcoming Events
              </h2>
              <span className="text-xs font-bold text-slate-400">
                {upcomingRest.length} event
                {upcomingRest.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-6">
              {upcomingRest.map((ev) => {
                const actions = buildInvitationActions(ev, onForceTravel);
                return (
                  <InvitationEventCard
                    key={ev.id}
                    item={ev}
                    now={now}
                    primary={false}
                    stats={buildInvitationStats(ev, {
                      isPrimary: false,
                      rsvp: null,
                      metrics: null,
                      metricsLoading: false,
                    })}
                    primaryAction={actions.primaryAction}
                    secondaryAction={actions.secondaryAction}
                  />
                );
              })}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
