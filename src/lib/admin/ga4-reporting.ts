import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { google, type analyticsdata_v1beta } from "googleapis";
import type { JWTInput } from "google-auth-library";
import { getGoogleRefreshToken } from "@/lib/db";

const GA4_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA4_DATE_RANGE = [{ startDate: "30daysAgo", endDate: "today" }];
const GA4_TODAY_DATE_RANGE = [{ startDate: "today", endDate: "today" }];

export type AdminGa4CredentialSource = "base64" | "json" | "file" | "oauth" | "none";

export type AdminGa4ReportingConfigStatus = {
  propertyId: string | null;
  propertyIdConfigured: boolean;
  propertyIdFormatValid: boolean;
  credentialsConfigured: boolean;
  credentialsValid: boolean;
  credentialsSource: AdminGa4CredentialSource;
  serviceAccountEmail: string | null;
  oauthEmail: string | null;
  ready: boolean;
  configurationError: string | null;
};

export type AdminGa4ReportStatus = "unconfigured" | "available" | "error";

export type AdminGa4DimensionMetricRow = {
  label: string;
  value: number;
};

export type AdminGa4DashboardSnapshot = {
  status: AdminGa4ReportStatus;
  message: string;
  generatedAt: string | null;
  totals: {
    activeUsersNow: number;
    activeUsersToday: number;
    activeUsers30Days: number;
    sessions30Days: number;
    screenPageViews30Days: number;
    eventCount30Days: number;
  };
  topPages: AdminGa4DimensionMetricRow[];
  topEvents: AdminGa4DimensionMetricRow[];
};

type ResolvedGa4ReportingConfig = AdminGa4ReportingConfigStatus & {
  credentials: JWTInput | null;
  keyFile: string | null;
  oauthRefreshToken: string | null;
  oauthRefreshTokenFromStore: boolean;
};

type ParsedCredentialResult = {
  credentials: JWTInput | null;
  error: string | null;
};

const EMPTY_GA4_TOTALS: AdminGa4DashboardSnapshot["totals"] = {
  activeUsersNow: 0,
  activeUsersToday: 0,
  activeUsers30Days: 0,
  sessions30Days: 0,
  screenPageViews30Days: 0,
  eventCount30Days: 0,
};

function parseNumber(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDimension(row: analyticsdata_v1beta.Schema$Row | undefined, index: number): string {
  return row?.dimensionValues?.[index]?.value?.trim() || "(not set)";
}

function getMetric(row: analyticsdata_v1beta.Schema$Row | undefined, index: number): number {
  return parseNumber(row?.metricValues?.[index]?.value);
}

function parseCredentialJson(raw: string, sourceName: string): ParsedCredentialResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isServiceAccountCredentials(parsed)) {
      return {
        credentials: null,
        error: `${sourceName} must be a full Google service-account JSON object with client_email and private_key.`,
      };
    }
    return { credentials: parsed, error: null };
  } catch {
    return {
      credentials: null,
      error: `${sourceName} is not valid JSON.`,
    };
  }
}

function isServiceAccountCredentials(value: unknown): value is JWTInput {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.type === "service_account" &&
    typeof record.client_email === "string" &&
    record.client_email.includes("@") &&
    typeof record.private_key === "string" &&
    record.private_key.includes("PRIVATE KEY")
  );
}

function resolveCredentialConfig(): Pick<
  ResolvedGa4ReportingConfig,
  | "credentialsConfigured"
  | "credentialsValid"
  | "credentialsSource"
  | "serviceAccountEmail"
  | "oauthEmail"
  | "credentials"
  | "keyFile"
  | "oauthRefreshToken"
  | "oauthRefreshTokenFromStore"
> & { error: string | null } {
  const oauthRefreshToken = process.env.GOOGLE_ANALYTICS_REFRESH_TOKEN?.trim();
  if (oauthRefreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const missingOAuthConfig = [
      !clientId ? "GOOGLE_CLIENT_ID" : null,
      !clientSecret ? "GOOGLE_CLIENT_SECRET" : null,
    ].filter((value): value is string => Boolean(value));
    return {
      credentialsConfigured: true,
      credentialsValid: missingOAuthConfig.length === 0,
      credentialsSource: "oauth",
      serviceAccountEmail: null,
      oauthEmail: process.env.GOOGLE_ANALYTICS_OAUTH_EMAIL?.trim().toLowerCase() || null,
      credentials: null,
      keyFile: null,
      oauthRefreshToken,
      oauthRefreshTokenFromStore: false,
      error: missingOAuthConfig.length
        ? `Set ${missingOAuthConfig.join(" and ")} to use GOOGLE_ANALYTICS_REFRESH_TOKEN.`
        : null,
    };
  }

  const oauthEmail = process.env.GOOGLE_ANALYTICS_OAUTH_EMAIL?.trim().toLowerCase();
  if (oauthEmail) {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const missingOAuthConfig = [
      !clientId ? "GOOGLE_CLIENT_ID" : null,
      !clientSecret ? "GOOGLE_CLIENT_SECRET" : null,
    ].filter((value): value is string => Boolean(value));
    return {
      credentialsConfigured: true,
      credentialsValid: missingOAuthConfig.length === 0,
      credentialsSource: "oauth",
      serviceAccountEmail: null,
      oauthEmail,
      credentials: null,
      keyFile: null,
      oauthRefreshToken: null,
      oauthRefreshTokenFromStore: true,
      error: missingOAuthConfig.length
        ? `Set ${missingOAuthConfig.join(" and ")} to use GOOGLE_ANALYTICS_OAUTH_EMAIL.`
        : null,
    };
  }

  const base64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64?.trim();
  if (base64) {
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    const result = parseCredentialJson(decoded, "GOOGLE_APPLICATION_CREDENTIALS_BASE64");
    return {
      credentialsConfigured: true,
      credentialsValid: Boolean(result.credentials),
      credentialsSource: "base64",
      serviceAccountEmail: result.credentials?.client_email ?? null,
      oauthEmail: null,
      credentials: result.credentials,
      keyFile: null,
      oauthRefreshToken: null,
      oauthRefreshTokenFromStore: false,
      error: result.error,
    };
  }

  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (json) {
    const result = parseCredentialJson(json, "GOOGLE_APPLICATION_CREDENTIALS_JSON");
    return {
      credentialsConfigured: true,
      credentialsValid: Boolean(result.credentials),
      credentialsSource: "json",
      serviceAccountEmail: result.credentials?.client_email ?? null,
      oauthEmail: null,
      credentials: result.credentials,
      keyFile: null,
      oauthRefreshToken: null,
      oauthRefreshTokenFromStore: false,
      error: result.error,
    };
  }

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credentialPath) {
    const resolvedPath = path.resolve(credentialPath);
    const pathExists = existsSync(resolvedPath);
    const isFile = pathExists && statSync(resolvedPath).isFile();
    const result = isFile
      ? parseCredentialJson(readFileSync(resolvedPath, "utf8"), "GOOGLE_APPLICATION_CREDENTIALS")
      : null;
    return {
      credentialsConfigured: true,
      credentialsValid: Boolean(result?.credentials),
      credentialsSource: "file",
      serviceAccountEmail: result?.credentials?.client_email ?? null,
      oauthEmail: null,
      credentials: null,
      keyFile: result?.credentials ? resolvedPath : null,
      oauthRefreshToken: null,
      oauthRefreshTokenFromStore: false,
      error: isFile
        ? (result?.error ?? null)
        : "GOOGLE_APPLICATION_CREDENTIALS must point to an existing service-account JSON file.",
    };
  }

  return {
    credentialsConfigured: false,
    credentialsValid: false,
    credentialsSource: "none",
    serviceAccountEmail: null,
    oauthEmail: null,
    credentials: null,
    keyFile: null,
    oauthRefreshToken: null,
    oauthRefreshTokenFromStore: false,
    error: "Set GOOGLE_APPLICATION_CREDENTIALS_BASE64, GOOGLE_APPLICATION_CREDENTIALS_JSON, or GOOGLE_APPLICATION_CREDENTIALS.",
  };
}

function resolveGa4ReportingConfig(): ResolvedGa4ReportingConfig {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.trim() || null;
  const propertyIdConfigured = Boolean(propertyId);
  const propertyIdFormatValid = Boolean(propertyId && /^\d+$/.test(propertyId));
  const credentialConfig = resolveCredentialConfig();
  const configurationErrors = [
    !propertyIdConfigured ? "Set GOOGLE_ANALYTICS_PROPERTY_ID to the numeric GA4 property ID." : null,
    propertyIdConfigured && !propertyIdFormatValid
      ? "GOOGLE_ANALYTICS_PROPERTY_ID must be numeric, not the G- measurement ID."
      : null,
    credentialConfig.error,
  ].filter((message): message is string => Boolean(message));

  return {
    propertyId,
    propertyIdConfigured,
    propertyIdFormatValid,
    credentialsConfigured: credentialConfig.credentialsConfigured,
    credentialsValid: credentialConfig.credentialsValid,
    credentialsSource: credentialConfig.credentialsSource,
    serviceAccountEmail: credentialConfig.serviceAccountEmail,
    oauthEmail: credentialConfig.oauthEmail,
    credentials: credentialConfig.credentials,
    keyFile: credentialConfig.keyFile,
    oauthRefreshToken: credentialConfig.oauthRefreshToken,
    oauthRefreshTokenFromStore: credentialConfig.oauthRefreshTokenFromStore,
    ready: Boolean(propertyId && propertyIdFormatValid && credentialConfig.credentialsValid),
    configurationError: configurationErrors[0] ?? null,
  };
}

async function resolveGa4ReportingConfigForRequest(): Promise<ResolvedGa4ReportingConfig> {
  const config = resolveGa4ReportingConfig();
  if (!config.oauthRefreshTokenFromStore || !config.oauthEmail || config.oauthRefreshToken) {
    return config;
  }

  const refreshToken = await getGoogleRefreshToken(config.oauthEmail);
  if (refreshToken) {
    return {
      ...config,
      oauthRefreshToken: refreshToken,
    };
  }

  return {
    ...config,
    ready: false,
    configurationError: `Authorize ${config.oauthEmail} through /api/google/auth?consent=1&analytics=1 so Envitefy can store a Google refresh token with Analytics read access.`,
  };
}

export function getGa4ReportingConfigStatus(): AdminGa4ReportingConfigStatus {
  const config = resolveGa4ReportingConfig();
  return {
    propertyId: config.propertyId,
    propertyIdConfigured: config.propertyIdConfigured,
    propertyIdFormatValid: config.propertyIdFormatValid,
    credentialsConfigured: config.credentialsConfigured,
    credentialsValid: config.credentialsValid,
    credentialsSource: config.credentialsSource,
    serviceAccountEmail: config.serviceAccountEmail,
    oauthEmail: config.oauthEmail,
    ready: config.ready,
    configurationError: config.configurationError,
  };
}

function createAnalyticsDataClient(config: ResolvedGa4ReportingConfig) {
  if (config.oauthRefreshToken) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    auth.setCredentials({ refresh_token: config.oauthRefreshToken });
    return google.analyticsdata({ version: "v1beta", auth });
  }

  const auth = new google.auth.GoogleAuth({
    scopes: [GA4_READONLY_SCOPE],
    credentials: config.credentials ?? undefined,
    keyFile: config.keyFile ?? undefined,
  });

  return google.analyticsdata({ version: "v1beta", auth });
}

function mapDimensionMetricRows(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
): AdminGa4DimensionMetricRow[] {
  return (rows ?? []).map((row) => ({
    label: getDimension(row, 0),
    value: getMetric(row, 0),
  }));
}

function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return null;
}

function isGa4PermissionError(error: unknown, message: string | null): boolean {
  if (message?.toLowerCase().includes("sufficient permissions")) return true;
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  return record.code === 403 || record.status === 403;
}

function toGa4ErrorMessage(error: unknown, config: ResolvedGa4ReportingConfig): string {
  const message = getErrorMessage(error);
  if (isGa4PermissionError(error, message)) {
    const account = config.serviceAccountEmail
      ? `service account ${config.serviceAccountEmail}`
      : config.oauthEmail
        ? `Google user ${config.oauthEmail}`
      : "configured service account";
    const property = config.propertyId ? `GA4 property ${config.propertyId}` : "this GA4 property";
    return `GA4 access denied. Add ${account} as a Viewer or Analyst in ${property}'s Property access management, then refresh this page.`;
  }
  return message ? `GA4 Data API request failed: ${message}` : "GA4 Data API request failed.";
}

export async function getGa4DashboardSnapshot(): Promise<AdminGa4DashboardSnapshot> {
  const config = await resolveGa4ReportingConfigForRequest();

  if (!config.ready) {
    return {
      status: "unconfigured",
      message: config.configurationError ?? "Google Analytics server reporting is not configured.",
      generatedAt: null,
      totals: EMPTY_GA4_TOTALS,
      topPages: [],
      topEvents: [],
    };
  }

  try {
    const analyticsData = createAnalyticsDataClient(config);
    const property = `properties/${config.propertyId}`;
    const [summary, todaySummary, realtimeSummary, topPages, topEvents] = await Promise.all([
      analyticsData.properties.runReport({
        property,
        requestBody: {
          dateRanges: GA4_DATE_RANGE,
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "eventCount" },
          ],
        },
      }),
      analyticsData.properties.runReport({
        property,
        requestBody: {
          dateRanges: GA4_TODAY_DATE_RANGE,
          metrics: [{ name: "activeUsers" }],
        },
      }),
      analyticsData.properties.runRealtimeReport({
        property,
        requestBody: {
          metrics: [{ name: "activeUsers" }],
        },
      }),
      analyticsData.properties.runReport({
        property,
        requestBody: {
          dateRanges: GA4_DATE_RANGE,
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: "8",
        },
      }),
      analyticsData.properties.runReport({
        property,
        requestBody: {
          dateRanges: GA4_DATE_RANGE,
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: "8",
        },
      }),
    ]);
    const summaryRow = summary.data.rows?.[0];
    const todaySummaryRow = todaySummary.data.rows?.[0];
    const realtimeSummaryRow = realtimeSummary.data.rows?.[0];

    return {
      status: "available",
      message: "Google Analytics Data API reporting is connected.",
      generatedAt: new Date().toISOString(),
      totals: {
        activeUsersNow: getMetric(realtimeSummaryRow, 0),
        activeUsersToday: getMetric(todaySummaryRow, 0),
        activeUsers30Days: getMetric(summaryRow, 0),
        sessions30Days: getMetric(summaryRow, 1),
        screenPageViews30Days: getMetric(summaryRow, 2),
        eventCount30Days: getMetric(summaryRow, 3),
      },
      topPages: mapDimensionMetricRows(topPages.data.rows),
      topEvents: mapDimensionMetricRows(topEvents.data.rows),
    };
  } catch (error) {
    return {
      status: "error",
      message: toGa4ErrorMessage(error, config),
      generatedAt: null,
      totals: EMPTY_GA4_TOTALS,
      topPages: [],
      topEvents: [],
    };
  }
}
