import { query } from "@/lib/db";
import { daysAgo, tableExists, toNumber } from "./data-utils";
import {
  getGa4DashboardSnapshot,
  getGa4ReportingConfigStatus,
  type AdminGa4CredentialSource,
  type AdminGa4DashboardSnapshot as Ga4DashboardSnapshot,
} from "./ga4-reporting";

export type { AdminGa4DashboardSnapshot } from "./ga4-reporting";

export type AdminGa4Status = {
  connected: boolean;
  propertyIdConfigured: boolean;
  propertyIdFormatValid: boolean;
  credentialsConfigured: boolean;
  credentialsValid: boolean;
  credentialsSource: AdminGa4CredentialSource;
  serviceAccountEmail: string | null;
  oauthEmail: string | null;
  propertyId: string | null;
  message: string;
  setupHint: string;
  configurationError: string | null;
};

export type AdminTrackingGap = {
  eventName: string;
  status: "missing" | "partial" | "available";
  owner: string;
  description: string;
};

export type AdminAnalyticsSnapshot = {
  ga4: AdminGa4Status;
  ga4Report: Ga4DashboardSnapshot;
  firstParty: {
    eventsLast30Days: number;
    publicEvents: number;
    sharesLast30Days: number;
    rsvpsLast30Days: number;
  };
  trackingGaps: AdminTrackingGap[];
};

export type AdminAnalyticsOverviewSnapshot = Pick<
  AdminAnalyticsSnapshot,
  "ga4" | "ga4Report" | "trackingGaps"
>;

export function getAdminGa4Status(): AdminGa4Status {
  const config = getGa4ReportingConfigStatus();
  const connected = config.ready;

  return {
    connected,
    propertyIdConfigured: config.propertyIdConfigured,
    propertyIdFormatValid: config.propertyIdFormatValid,
    credentialsConfigured: config.credentialsConfigured,
    credentialsValid: config.credentialsValid,
    credentialsSource: config.credentialsSource,
    serviceAccountEmail: config.serviceAccountEmail,
    oauthEmail: config.oauthEmail,
    propertyId: config.propertyId,
    message: connected
      ? "Google Analytics Data API reporting is connected."
      : "Google Analytics is not connected.",
    setupHint:
      "Set GOOGLE_ANALYTICS_PROPERTY_ID plus either Google service-account credentials or GOOGLE_ANALYTICS_REFRESH_TOKEN to enable server-side GA4 snapshots.",
    configurationError: config.configurationError,
  };
}

export function getAdminTrackingGaps(): AdminTrackingGap[] {
  return [
    {
      eventName: "public_event_view",
      status: "missing",
      owner: "public event renderer",
      description: "Track anonymous and signed-in views by event id, category, and owner id.",
    },
    {
      eventName: "share_link_click",
      status: "missing",
      owner: "share surfaces",
      description: "Capture share channel, event id, invite code, and source surface.",
    },
    {
      eventName: "registry_click",
      status: "missing",
      owner: "public event renderer",
      description: "Track outbound registry clicks with destination domain and event category.",
    },
    {
      eventName: "create_to_publish_funnel",
      status: "partial",
      owner: "creation workflows",
      description:
        "Creation sessions and event_history exist, but attribution is not stitched end to end.",
    },
  ];
}

export async function getAdminAnalyticsOverviewSnapshot(): Promise<AdminAnalyticsOverviewSnapshot> {
  return {
    ga4: getAdminGa4Status(),
    ga4Report: await getGa4DashboardSnapshot(),
    trackingGaps: getAdminTrackingGaps(),
  };
}

export async function getAdminAnalyticsSnapshot(): Promise<AdminAnalyticsSnapshot> {
  const rsvpsExist = await tableExists("rsvp_responses");
  const since30 = daysAgo(30);
  const [events, publicEvents, shares, rsvps, ga4Report] = await Promise.all([
    query<{ n: string }>(
      `select count(*)::text as n from event_history where created_at >= $1::timestamptz`,
      [since30],
    ),
    query<{ n: string }>(
      `select count(*)::text as n
       from event_history
       where public_slug is not null and public_slug <> ''`,
    ),
    query<{ n: string }>(
      `select count(*)::text as n from event_shares where created_at >= $1::timestamptz`,
      [since30],
    ),
    rsvpsExist
      ? query<{ n: string }>(
          `select count(*)::text as n from rsvp_responses where updated_at >= $1::timestamptz`,
          [since30],
        )
      : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<ReturnType<typeof query<{ n: string }>>>),
    getGa4DashboardSnapshot(),
  ]);

  return {
    ga4: getAdminGa4Status(),
    ga4Report,
    firstParty: {
      eventsLast30Days: toNumber(events.rows[0]?.n),
      publicEvents: toNumber(publicEvents.rows[0]?.n),
      sharesLast30Days: toNumber(shares.rows[0]?.n),
      rsvpsLast30Days: toNumber(rsvps.rows[0]?.n),
    },
    trackingGaps: getAdminTrackingGaps(),
  };
}
