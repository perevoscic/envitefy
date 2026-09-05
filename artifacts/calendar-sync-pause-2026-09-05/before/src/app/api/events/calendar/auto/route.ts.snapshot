import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { buildAutoCalendarEvent, type CalendarFlyer } from "@/lib/calendar-auto-sync";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  getEventHistoryById,
  getGoogleRefreshToken,
  getMicrosoftRefreshToken,
  getUserByEmail,
  updateEventHistoryDataMerge,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { toGoogleEvent, toMicrosoftEvent, type NormalizedEvent } from "@/lib/mappers";
import { buildEventPath } from "@/utils/event-url";

export const runtime = "nodejs";

type CalendarProvider = "google" | "microsoft";
type JsonRecord = Record<string, unknown>;

type ProviderSyncResult = {
  provider: CalendarProvider;
  externalEventId: string;
  webLink: string | null;
  attachmentAttached: boolean;
};

class CalendarProviderError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CalendarProviderError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readProviderErrorStatus(error: unknown): number {
  if (error instanceof CalendarProviderError) return error.status;
  if (!isRecord(error)) return 500;
  const direct = Number(error.code || error.status);
  if (Number.isFinite(direct)) return direct;
  const response = isRecord(error.response) ? error.response : {};
  const nested = Number(response.status);
  return Number.isFinite(nested) ? nested : 500;
}

function readProviderErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return String(error || "Calendar sync failed");
}

function googleEventId(eventId: string): string {
  // Google accepts base32hex characters. UUID hex is a safe subset and is deterministic for retries.
  return `e${eventId.toLowerCase().replace(/[^a-f0-9]/g, "")}`;
}

async function insertGoogleEvent(params: {
  refreshToken: string;
  eventId: string;
  eventUrl: string;
  event: NormalizedEvent;
  flyer: CalendarFlyer | null;
}): Promise<ProviderSyncResult> {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  );
  oAuth2Client.setCredentials({ refresh_token: params.refreshToken });
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
  const deterministicId = googleEventId(params.eventId);
  const baseRequestBody = {
    ...toGoogleEvent(params.event),
    id: deterministicId,
    source: { title: "Envitefy", url: params.eventUrl },
    extendedProperties: {
      private: {
        envitefyEventId: params.eventId,
        envitefyEventUrl: params.eventUrl,
      },
    },
  };
  const withAttachment = params.flyer
    ? {
        ...baseRequestBody,
        attachments: [
          {
            fileUrl: params.flyer.sourceUrl,
            title: params.flyer.name,
            mimeType: params.flyer.mimeType,
          },
        ],
      }
    : baseRequestBody;

  try {
    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: withAttachment,
      supportsAttachments: Boolean(params.flyer),
    });
    return {
      provider: "google",
      externalEventId: created.data.id || deterministicId,
      webLink: created.data.htmlLink || null,
      attachmentAttached: Boolean(params.flyer),
    };
  } catch (error: unknown) {
    const status = readProviderErrorStatus(error);
    if (status === 409) {
      const existing = await calendar.events.get({
        calendarId: "primary",
        eventId: deterministicId,
      });
      return {
        provider: "google",
        externalEventId: existing.data.id || deterministicId,
        webLink: existing.data.htmlLink || null,
        attachmentAttached: Boolean(existing.data.attachments?.length),
      };
    }
    // Some Google accounts reject third-party attachment URLs. The flyer remains linked in the
    // description, so retry the calendar event itself without losing the automatic add.
    if (params.flyer && status === 400) {
      const created = await calendar.events.insert({
        calendarId: "primary",
        requestBody: baseRequestBody,
      });
      return {
        provider: "google",
        externalEventId: created.data.id || deterministicId,
        webLink: created.data.htmlLink || null,
        attachmentAttached: false,
      };
    }
    throw error;
  }
}

async function getMicrosoftAccessToken(refreshToken: string): Promise<string> {
  const tenant = process.env.OUTLOOK_TENANT_ID || "common";
  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID || "",
    client_secret: process.env.OUTLOOK_CLIENT_SECRET || "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: "offline_access https://graph.microsoft.com/Calendars.ReadWrite",
  });
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload: JsonRecord = await response.json().catch(() => ({}));
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  if (!response.ok || !accessToken) {
    const message =
      (typeof payload.error_description === "string" && payload.error_description) ||
      (typeof payload.error === "string" && payload.error) ||
      "Microsoft Calendar authorization needs to be refreshed";
    throw new CalendarProviderError(message, response.status || 401);
  }
  return accessToken;
}

function flyerAttachmentName(contentType: string): string {
  if (contentType.includes("png")) return "Event flyer.png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "Event flyer.jpg";
  if (contentType.includes("pdf")) return "Event invite.pdf";
  return "Event flyer.webp";
}

async function attachFlyerToMicrosoftEvent(params: {
  accessToken: string;
  externalEventId: string;
  flyer: CalendarFlyer;
}): Promise<boolean> {
  try {
    const fileResponse = await fetch(params.flyer.previewUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (!fileResponse.ok) return false;
    const declaredLength = Number(fileResponse.headers.get("content-length") || 0);
    if (declaredLength > 2_900_000) return false;
    const bytes = Buffer.from(await fileResponse.arrayBuffer());
    if (!bytes.length || bytes.length > 2_900_000) return false;
    const contentType = fileResponse.headers.get("content-type") || "image/webp";
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(
        params.externalEventId,
      )}/attachments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.accessToken}`,
        },
        body: JSON.stringify({
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: flyerAttachmentName(contentType),
          contentType,
          contentBytes: bytes.toString("base64"),
        }),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function insertMicrosoftEvent(params: {
  refreshToken: string;
  eventId: string;
  event: NormalizedEvent;
  flyer: CalendarFlyer | null;
}): Promise<ProviderSyncResult> {
  const accessToken = await getMicrosoftAccessToken(params.refreshToken);
  const graphBody = {
    ...toMicrosoftEvent(params.event),
    body: {
      contentType: "text",
      content: params.event.description || "",
    },
    transactionId: `envitefy:${params.eventId}`,
  };
  const response = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(graphBody),
  });
  const payload: JsonRecord = await response.json().catch(() => ({}));
  const externalEventId = typeof payload.id === "string" ? payload.id : "";
  if (!response.ok || !externalEventId) {
    const graphError = isRecord(payload.error) ? payload.error : {};
    const message =
      (typeof graphError.message === "string" && graphError.message) ||
      (typeof payload.message === "string" && payload.message) ||
      "Microsoft Calendar could not create this event";
    throw new CalendarProviderError(message, response.status || 500);
  }
  const attachmentAttached = params.flyer
    ? await attachFlyerToMicrosoftEvent({
        accessToken,
        externalEventId,
        flyer: params.flyer,
      })
    : false;
  return {
    provider: "microsoft",
    externalEventId,
    webLink: typeof payload.webLink === "string" ? payload.webLink : null,
    attachmentAttached,
  };
}

function readExistingCalendarSync(data: JsonRecord): JsonRecord {
  return isRecord(data.calendarSync) ? data.calendarSync : {};
}

async function persistCalendarSync(params: {
  eventId: string;
  userId: string;
  data: JsonRecord;
  provider: CalendarProvider;
  status: "synced" | "failed" | "needs_reconnect";
  externalEventId?: string | null;
  webLink?: string | null;
  attachmentAttached?: boolean;
  error?: string | null;
}) {
  const existing = readExistingCalendarSync(params.data);
  const providers = isRecord(existing.providers) ? existing.providers : {};
  const providerState = {
    status: params.status,
    externalEventId: params.externalEventId || null,
    webLink: params.webLink || null,
    attachmentAttached: Boolean(params.attachmentAttached),
    error: params.error || null,
    updatedAt: new Date().toISOString(),
  };
  await updateEventHistoryDataMerge(params.eventId, {
    calendarSync: {
      ...existing,
      status: params.status,
      autoProvider: params.provider,
      reason: params.error || null,
      updatedAt: new Date().toISOString(),
      providers: { ...providers, [params.provider]: providerState },
    },
  });
  invalidateUserHistory(params.userId);
  invalidateUserDashboard(params.userId);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = await resolveSessionUserId(session);
  const email = session?.user?.email?.trim().toLowerCase() || "";
  if (!userId || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: JsonRecord = await request.json().catch(() => ({}));
  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const row = await getEventHistoryById(eventId);
  if (!row) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data: JsonRecord = isRecord(row.data) ? row.data : {};
  const user = await getUserByEmail(email);
  const [googleRefreshToken, microsoftRefreshToken] = await Promise.all([
    getGoogleRefreshToken(email),
    getMicrosoftRefreshToken(email),
  ]);
  const preferred = String(user?.preferred_provider || "").toLowerCase();
  const existingSync = readExistingCalendarSync(data);
  let provider: CalendarProvider | null = null;
  let refreshToken = "";
  if (preferred === "google" && googleRefreshToken) {
    provider = "google";
    refreshToken = googleRefreshToken;
  } else if (preferred === "microsoft" && microsoftRefreshToken) {
    provider = "microsoft";
    refreshToken = microsoftRefreshToken;
  } else if (googleRefreshToken) {
    provider = "google";
    refreshToken = googleRefreshToken;
  } else if (microsoftRefreshToken) {
    provider = "microsoft";
    refreshToken = microsoftRefreshToken;
  }

  if (!provider || !refreshToken) {
    const updatedAt = new Date().toISOString();
    await updateEventHistoryDataMerge(eventId, {
      calendarSync: {
        ...existingSync,
        status: "needs_connection",
        reason: "no_supported_calendar_connected",
        updatedAt,
      },
    }).catch(() => undefined);
    invalidateUserHistory(userId);
    invalidateUserDashboard(userId);
    return NextResponse.json({
      ok: false,
      status: "needs_connection",
      reason: "no_supported_calendar_connected",
      provider: null,
    });
  }

  const existingProviders = isRecord(existingSync.providers) ? existingSync.providers : {};
  const existingProviderCandidate = existingProviders[provider];
  const existingProvider: JsonRecord = isRecord(existingProviderCandidate)
    ? existingProviderCandidate
    : {};
  if (
    existingProvider.status === "synced" &&
    typeof existingProvider.externalEventId === "string"
  ) {
    return NextResponse.json({
      ok: true,
      status: "already_synced",
      alreadySynced: true,
      provider,
      externalEventId: existingProvider.externalEventId,
      webLink: existingProvider.webLink || null,
    });
  }

  const eventPath = buildEventPath(row.id, row.title, undefined, row.public_slug || undefined);
  const eventUrl = await absoluteUrl(eventPath);
  const hasFlyer = isRecord(data.attachment) || typeof data.thumbnail === "string";
  const mediaIdentifier = encodeURIComponent(row.public_slug || row.id);
  const flyerSourceUrl = hasFlyer
    ? await absoluteUrl(`/media/events/${mediaIdentifier}/thumbnail?variant=attachment`)
    : "";
  const flyerPreviewUrl = hasFlyer
    ? await absoluteUrl(`/media/events/${mediaIdentifier}/thumbnail?variant=thumbnail`)
    : "";
  const built = buildAutoCalendarEvent({
    title: row.title,
    data,
    envitefyUrl: eventUrl,
    flyerSourceUrl,
    flyerPreviewUrl,
  });
  if (!built.ok) {
    return NextResponse.json({ ok: true, status: "skipped", reason: built.reason });
  }

  try {
    const result =
      provider === "google"
        ? await insertGoogleEvent({
            refreshToken,
            eventId,
            eventUrl,
            event: built.value.event,
            flyer: built.value.flyer,
          })
        : await insertMicrosoftEvent({
            refreshToken,
            eventId,
            event: built.value.event,
            flyer: built.value.flyer,
          });
    await persistCalendarSync({
      eventId,
      userId,
      data,
      provider,
      status: "synced",
      externalEventId: result.externalEventId,
      webLink: result.webLink,
      attachmentAttached: result.attachmentAttached,
    });
    return NextResponse.json({ ok: true, status: "synced", ...result });
  } catch (error: unknown) {
    const status = readProviderErrorStatus(error);
    const message = readProviderErrorMessage(error).slice(0, 500);
    const needsReconnect =
      status === 401 ||
      status === 403 ||
      /invalid_grant|insufficient|unauthorized|forbidden/i.test(message);
    await persistCalendarSync({
      eventId,
      userId,
      data,
      provider,
      status: needsReconnect ? "needs_reconnect" : "failed",
      error: message,
    }).catch(() => undefined);
    return NextResponse.json({
      ok: false,
      provider,
      status: needsReconnect ? "needs_reconnect" : "failed",
    });
  }
}
