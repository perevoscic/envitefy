import {
  getAdminAnalyticsOverviewSnapshot,
  getAdminGa4Status,
  type AdminGa4DashboardSnapshot,
  type AdminGa4Status,
} from "./analytics";
import { getAdminConciergeData, type AdminConciergeData } from "./concierge";
import {
  ADMIN_SCAN_SQL,
  daysAgo,
  humanizeCategory,
  tableExists,
  toIsoString,
  toNumber,
} from "./data-utils";
import { getAdminEventsData, type AdminEventCategorySummary } from "./events";
import { listMarketingRuns } from "./marketing-campaigns";
import { getAdminScanData } from "./scans";
import { getAdminUsersSummary, type AdminUsersSummary } from "./users";
import { isDatabaseUnavailableError, query } from "@/lib/db";

export type AdminFunnelStep = {
  label: string;
  value: number;
  href: string;
};

export type AdminRecentActivity = {
  type: "user" | "event" | "share" | "rsvp" | "email";
  label: string;
  detail: string;
  occurredAt: string | null;
};

export type AdminNeedsAttentionItem = {
  title: string;
  detail: string;
  href: string;
  tone: "warning" | "danger" | "neutral" | "success";
};

export type AdminGrowthInsight = {
  label: string;
  current7Days: number;
  previous7Days: number;
  delta: number;
};

export type AdminOverviewData = {
  generatedAt: string;
  kpis: {
    users: number;
    events: number;
    publicEvents: number;
    scans: number;
    shares: number;
    rsvps: number;
    emailCampaigns: number;
    marketingRuns: number;
    conciergeSessions: number;
  };
  users: AdminUsersSummary;
  funnel: AdminFunnelStep[];
  ga4: AdminGa4Status;
  ga4Report: AdminGa4DashboardSnapshot;
  categoryPerformance: AdminEventCategorySummary[];
  concierge: AdminConciergeData;
  needsAttention: AdminNeedsAttentionItem[];
  recentActivity: AdminRecentActivity[];
  growthInsights: AdminGrowthInsight[];
};

type ActivityRow = {
  type: AdminRecentActivity["type"];
  label: string | null;
  detail: string | null;
  occurred_at: Date | string | null;
};

type EmailCampaignSummary = {
  total: number;
  failed: number;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "Unknown error");
}

function createDatabaseUnavailableOverview(error: unknown): AdminOverviewData {
  const message = getErrorMessage(error);
  const users: AdminUsersSummary = {
    totalUsers: 0,
    newUsers7Days: 0,
  };
  const ga4 = getAdminGa4Status();
  const ga4Report: AdminGa4DashboardSnapshot = {
    status: "error",
    message: "Admin database metrics are unavailable because Postgres could not be reached.",
    generatedAt: null,
    totals: {
      activeUsersNow: 0,
      activeUsersToday: 0,
      activeUsers30Days: 0,
      sessions30Days: 0,
      screenPageViews30Days: 0,
      eventCount30Days: 0,
    },
    topPages: [],
    topEvents: [],
  };
  const concierge: AdminConciergeData = {
    available: false,
    summary: {
      sessions: 0,
      active7Days: 0,
      published: 0,
      drafts: 0,
      threads: 0,
      messages: 0,
    },
    statuses: [],
    recentSessions: [],
  };

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      users: 0,
      events: 0,
      publicEvents: 0,
      scans: 0,
      shares: 0,
      rsvps: 0,
      emailCampaigns: 0,
      marketingRuns: 0,
      conciergeSessions: 0,
    },
    users,
    funnel: [
      { label: "Users", value: 0, href: "/admin/users" },
      { label: "Events", value: 0, href: "/admin/events" },
      { label: "Public events", value: 0, href: "/admin/events" },
      { label: "Shares", value: 0, href: "/admin/scans" },
      { label: "RSVPs", value: 0, href: "/admin/events" },
    ],
    ga4,
    ga4Report,
    categoryPerformance: [],
    concierge,
    needsAttention: [
      {
        title: "Admin database is unavailable",
        detail: `Postgres could not be reached: ${message}`,
        href: "/admin/health",
        tone: "danger",
      },
    ],
    recentActivity: [],
    growthInsights: [
      { label: "New users", current7Days: 0, previous7Days: 0, delta: 0 },
      { label: "Events created", current7Days: 0, previous7Days: 0, delta: 0 },
      { label: "Scans saved", current7Days: 0, previous7Days: 0, delta: 0 },
      { label: "RSVP responses", current7Days: 0, previous7Days: 0, delta: 0 },
    ],
  };
}

async function getEmailCampaignSummary(): Promise<EmailCampaignSummary> {
  if (!(await tableExists("email_campaigns"))) return { total: 0, failed: 0 };
  const result = await query<{ total: string; failed: string }>(
    `select
       count(*)::text as total,
       count(*) filter (where status = 'failed')::text as failed
     from email_campaigns`,
  );
  return {
    total: toNumber(result.rows[0]?.total),
    failed: toNumber(result.rows[0]?.failed),
  };
}

async function getMarketingRunCount(): Promise<number> {
  try {
    const runs = await listMarketingRuns();
    return runs.length;
  } catch {
    return 0;
  }
}

async function getRecentActivity(): Promise<AdminRecentActivity[]> {
  const [rsvpsExist, emailCampaignsExist] = await Promise.all([
    tableExists("rsvp_responses"),
    tableExists("email_campaigns"),
  ]);
  const rsvpUnion = rsvpsExist
    ? `
      union all
      select 'rsvp'::text as type,
             coalesce(nullif(rr.name, ''), nullif(rr.email, ''), 'RSVP response') as label,
             coalesce(rr.response, 'responded') as detail,
             rr.updated_at as occurred_at
      from rsvp_responses rr
    `
    : "";
  const emailUnion = emailCampaignsExist
    ? `
      union all
      select 'email'::text as type,
             coalesce(nullif(subject, ''), 'Email campaign') as label,
             status as detail,
             created_at as occurred_at
      from email_campaigns
    `
    : "";

  const result = await query<ActivityRow>(`
    select type, label, detail, occurred_at
    from (
      select 'user'::text as type,
             email as label,
             'joined' as detail,
             created_at as occurred_at
      from users
      union all
      select 'event'::text as type,
             title as label,
             coalesce(nullif(data->>'category', ''), 'event created') as detail,
             created_at as occurred_at
      from event_history
      union all
      select 'share'::text as type,
             coalesce(eh.title, 'Event shared') as label,
             es.status as detail,
             es.created_at as occurred_at
      from event_shares es
      left join event_history eh on eh.id = es.event_id
      ${rsvpUnion}
      ${emailUnion}
    ) activity
    where occurred_at is not null
    order by occurred_at desc
    limit 10
  `);

  return result.rows.map((row) => ({
    type: row.type,
    label: row.label || "Activity",
    detail: row.type === "event" ? humanizeCategory(row.detail) : row.detail || row.type,
    occurredAt: toIsoString(row.occurred_at),
  }));
}

async function getGrowthInsights(): Promise<AdminGrowthInsight[]> {
  const rsvpsExist = await tableExists("rsvp_responses");
  const currentStart = daysAgo(7);
  const previousStart = daysAgo(14);

  const [users, events, scans, rsvps] = await Promise.all([
    query<{ current_count: string; previous_count: string }>(
      `select
         count(*) filter (where created_at >= $1::timestamptz)::text as current_count,
         count(*) filter (where created_at >= $2::timestamptz and created_at < $1::timestamptz)::text as previous_count
       from users`,
      [currentStart, previousStart],
    ),
    query<{ current_count: string; previous_count: string }>(
      `select
         count(*) filter (where created_at >= $1::timestamptz)::text as current_count,
         count(*) filter (where created_at >= $2::timestamptz and created_at < $1::timestamptz)::text as previous_count
       from event_history`,
      [currentStart, previousStart],
    ),
    query<{ current_count: string; previous_count: string }>(
      `select
         count(*) filter (where ${ADMIN_SCAN_SQL} and created_at >= $1::timestamptz)::text as current_count,
         count(*) filter (where ${ADMIN_SCAN_SQL} and created_at >= $2::timestamptz and created_at < $1::timestamptz)::text as previous_count
       from event_history`,
      [currentStart, previousStart],
    ),
    rsvpsExist
      ? query<{ current_count: string; previous_count: string }>(
          `select
             count(*) filter (where updated_at >= $1::timestamptz)::text as current_count,
             count(*) filter (where updated_at >= $2::timestamptz and updated_at < $1::timestamptz)::text as previous_count
           from rsvp_responses`,
          [currentStart, previousStart],
        )
      : Promise.resolve({
          rows: [{ current_count: "0", previous_count: "0" }],
        } as Awaited<ReturnType<typeof query<{ current_count: string; previous_count: string }>>>),
  ]);

  const buildInsight = (
    label: string,
    row: { current_count: string | null; previous_count: string | null } | undefined,
  ): AdminGrowthInsight => {
    const current7Days = toNumber(row?.current_count);
    const previous7Days = toNumber(row?.previous_count);
    return {
      label,
      current7Days,
      previous7Days,
      delta: current7Days - previous7Days,
    };
  };

  return [
    buildInsight("New users", users.rows[0]),
    buildInsight("Events created", events.rows[0]),
    buildInsight("Scans saved", scans.rows[0]),
    buildInsight("RSVP responses", rsvps.rows[0]),
  ];
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  let users: AdminUsersSummary;
  let events: Awaited<ReturnType<typeof getAdminEventsData>>;
  let scans: Awaited<ReturnType<typeof getAdminScanData>>;
  let analytics: Awaited<ReturnType<typeof getAdminAnalyticsOverviewSnapshot>>;
  let concierge: AdminConciergeData;
  let emailCampaigns: EmailCampaignSummary;
  let marketingRuns: number;
  let recentActivity: AdminRecentActivity[];
  let growthInsights: AdminGrowthInsight[];

  try {
    [
      users,
      events,
      scans,
      analytics,
      concierge,
      emailCampaigns,
      marketingRuns,
      recentActivity,
      growthInsights,
    ] = await Promise.all([
      getAdminUsersSummary(),
      getAdminEventsData(8, { includeRecent: false }),
      getAdminScanData(1, {
        includeCategories: false,
        includeRecent: false,
        includeEngagementCounts: false,
      }),
      getAdminAnalyticsOverviewSnapshot(),
      getAdminConciergeData({ includeRecent: false }),
      getEmailCampaignSummary(),
      getMarketingRunCount(),
      getRecentActivity(),
      getGrowthInsights(),
    ]);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    console.warn("[admin] overview database unavailable", getErrorMessage(error));
    return createDatabaseUnavailableOverview(error);
  }

  const needsAttention: AdminNeedsAttentionItem[] = [];
  if (!analytics.ga4.connected) {
    needsAttention.push({
      title: "Google Analytics is not connected",
      detail: analytics.ga4.setupHint,
      href: "/admin/analytics",
      tone: "warning",
    });
  }
  if (emailCampaigns.failed > 0) {
    needsAttention.push({
      title: `${emailCampaigns.failed.toLocaleString()} failed email campaign${emailCampaigns.failed === 1 ? "" : "s"}`,
      detail: "Review SES or recipient failures before the next send.",
      href: "/admin/emails?tab=campaigns",
      tone: "danger",
    });
  }
  if (analytics.trackingGaps.some((gap) => gap.status === "missing")) {
    needsAttention.push({
      title: "First-party funnel events are placeholders",
      detail: "Views, share clicks, registry clicks, and attribution need explicit tracking.",
      href: "/admin/analytics",
      tone: "neutral",
    });
  } else {
    needsAttention.push({
      title: "First-party event tracking is active",
      detail: "Views, share clicks, and registry clicks are recorded per event.",
      href: "/admin/analytics",
      tone: "success",
    });
  }

  const funnel: AdminFunnelStep[] = [
    { label: "Users", value: users.totalUsers, href: "/admin/users" },
    { label: "Events", value: events.summary.totalEvents, href: "/admin/events" },
    { label: "Public events", value: events.summary.publicEvents, href: "/admin/events" },
    { label: "Shares", value: events.summary.shares, href: "/admin/scans" },
    { label: "RSVPs", value: events.summary.rsvps, href: "/admin/events" },
  ];

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      users: users.totalUsers,
      events: events.summary.totalEvents,
      publicEvents: events.summary.publicEvents,
      scans: scans.summary.totalScans,
      shares: events.summary.shares,
      rsvps: events.summary.rsvps,
      emailCampaigns: emailCampaigns.total,
      marketingRuns,
      conciergeSessions: concierge.summary.sessions,
    },
    users,
    funnel,
    ga4: analytics.ga4,
    ga4Report: analytics.ga4Report,
    categoryPerformance: events.categories,
    concierge,
    needsAttention,
    recentActivity,
    growthInsights,
  };
}
