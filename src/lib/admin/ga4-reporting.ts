import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { google, type analyticsdata_v1beta } from "googleapis";
import type { JWTInput } from "google-auth-library";

const GA4_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA4_DATE_RANGE = [{ startDate: "30daysAgo", endDate: "today" }];

export type AdminGa4CredentialSource = "base64" | "json" | "file" | "none";

export type AdminGa4ReportingConfigStatus = {
  propertyId: string | null;
  propertyIdConfigured: boolean;
  propertyIdFormatValid: boolean;
  credentialsConfigured: boolean;
  credentialsValid: boolean;
  credentialsSource: AdminGa4CredentialSource;
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
};

type ParsedCredentialResult = {
  credentials: JWTInput | null;
  error: string | null;
};

const EMPTY_GA4_TOTALS: AdminGa4DashboardSnapshot["totals"] = {
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
  "credentialsConfigured" | "credentialsValid" | "credentialsSource" | "credentials" | "keyFile"
> & { error: string | null } {
  const base64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64?.trim();
  if (base64) {
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    const result = parseCredentialJson(decoded, "GOOGLE_APPLICATION_CREDENTIALS_BASE64");
    return {
      credentialsConfigured: true,
      credentialsValid: Boolean(result.credentials),
      credentialsSource: "base64",
      credentials: result.credentials,
      keyFile: null,
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
      credentials: result.credentials,
      keyFile: null,
      error: result.error,
    };
  }

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credentialPath) {
    const resolvedPath = path.resolve(credentialPath);
    const pathExists = existsSync(resolvedPath);
    const isFile = pathExists && statSync(resolvedPath).isFile();
    return {
      credentialsConfigured: true,
      credentialsValid: isFile,
      credentialsSource: "file",
      credentials: null,
      keyFile: isFile ? resolvedPath : null,
      error: isFile
        ? null
        : "GOOGLE_APPLICATION_CREDENTIALS must point to an existing service-account JSON file.",
    };
  }

  return {
    credentialsConfigured: false,
    credentialsValid: false,
    credentialsSource: "none",
    credentials: null,
    keyFile: null,
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
    credentials: credentialConfig.credentials,
    keyFile: credentialConfig.keyFile,
    ready: Boolean(propertyId && propertyIdFormatValid && credentialConfig.credentialsValid),
    configurationError: configurationErrors[0] ?? null,
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
    ready: config.ready,
    configurationError: config.configurationError,
  };
}

function createAnalyticsDataClient(config: ResolvedGa4ReportingConfig) {
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

function toGa4ErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return `GA4 Data API request failed: ${error.message}`;
  }
  return "GA4 Data API request failed.";
}

export async function getGa4DashboardSnapshot(): Promise<AdminGa4DashboardSnapshot> {
  const config = resolveGa4ReportingConfig();

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
    const [summary, topPages, topEvents] = await Promise.all([
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

    return {
      status: "available",
      message: "Google Analytics Data API reporting is connected.",
      generatedAt: new Date().toISOString(),
      totals: {
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
      message: toGa4ErrorMessage(error),
      generatedAt: null,
      totals: EMPTY_GA4_TOTALS,
      topPages: [],
      topEvents: [],
    };
  }
}
