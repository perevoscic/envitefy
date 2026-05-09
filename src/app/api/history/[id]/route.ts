import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  claimEventHistoryById,
  getEventHistoryById,
  getEventHistoryPublicRenderById,
  isEventSharedWithUser,
  listShareRecipientUserIdsForEvent,
  updateEventHistoryData,
  updateEventHistoryDataMerge,
  updateEventHistoryTitle,
} from "@/lib/db";
import { redactDiscoverySourceForPublicView } from "@/lib/discovery-public-redact";
import {
  getEventAccessCookieName,
  normalizeAccessControlPayload,
  verifyEventAccessCookieValue,
} from "@/lib/event-access";
import { deleteEventHistoryWithCleanup } from "@/lib/event-cleanup";
import { findTransientEventMedia } from "@/lib/event-media";
import { invalidateUserHistory } from "@/lib/history-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HISTORY_ITEM_DEBUG =
  process.env.HISTORY_DEBUG === "1" || process.env.NODE_ENV !== "production";

function estimateJsonBytes(value: unknown): number | null {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return null;
  }
}

function buildMediaValidationResponse(issues: ReturnType<typeof findTransientEventMedia>) {
  return NextResponse.json(
    {
      error: "Upload media before saving. Inline data URLs and browser blob URLs are not allowed.",
      issues,
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sanitizeHistoryPublicData(data: unknown): Record<string, any> {
  const source = isRecord(data) ? { ...data } : {};
  const redacted = { ...redactDiscoverySourceForPublicView(source) };
  delete redacted.conciergeDraft;
  delete redacted.sourceContext;
  delete redacted.missingFields;
  delete redacted.ocrText;

  if (isRecord(redacted.accessControl)) {
    redacted.accessControl = {
      ...redacted.accessControl,
      passcodeHash: undefined,
      passcodePlain: undefined,
    };
  }

  return redacted;
}

function buildPublicHistoryResponse(
  row: Awaited<ReturnType<typeof getEventHistoryPublicRenderById>>,
) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    data: sanitizeHistoryPublicData(row.data),
    created_at: row.created_at,
    media: row.media,
  };
}

function invalidateHistoryAndDashboardForUser(userId: string | null | undefined) {
  if (!userId) return;
  invalidateUserHistory(userId);
  invalidateUserDashboard(userId);
}

async function invalidateSharedHistoryViewers(eventId: string) {
  const recipientUserIds = await listShareRecipientUserIdsForEvent(eventId).catch(() => []);
  for (const recipientUserId of recipientUserIds) {
    invalidateHistoryAndDashboardForUser(recipientUserId);
  }
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const row = await getEventHistoryById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (userId && row.user_id === userId) {
    if (HISTORY_ITEM_DEBUG) {
      console.error("[history] GET by id: response_bytes", {
        id,
        bytes: estimateJsonBytes(row),
      });
    }
    return NextResponse.json(row);
  }

  const url = new URL(req.url);
  const publicRequested =
    url.searchParams.get("public") === "1" || url.searchParams.get("view") === "public";
  if (!publicRequested) {
    return NextResponse.json(
      { error: userId ? "Forbidden" : "Unauthorized" },
      { status: userId ? 403 : 401 },
    );
  }

  const accessControl = isRecord(row.data?.accessControl) ? row.data.accessControl : null;
  const requiresPasscode = Boolean(accessControl?.requirePasscode && accessControl?.passcodeHash);
  const recipientAccepted = userId
    ? Boolean(await isEventSharedWithUser(id, userId).catch(() => false))
    : false;
  let hasPasscodeAccess = !requiresPasscode || recipientAccepted;
  if (!hasPasscodeAccess && typeof accessControl?.passcodeHash === "string") {
    const cookieStore = await cookies();
    hasPasscodeAccess = verifyEventAccessCookieValue(
      cookieStore.get(getEventAccessCookieName(id))?.value,
      id,
      accessControl.passcodeHash,
    );
  }

  if (!hasPasscodeAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const publicRow = buildPublicHistoryResponse(await getEventHistoryPublicRenderById(id));
  if (!publicRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (HISTORY_ITEM_DEBUG) {
    console.error("[history] GET by id: response_bytes", {
      id,
      bytes: estimateJsonBytes(publicRow),
    });
  }
  return NextResponse.json(publicRow);
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const existing = await getEventHistoryById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.user_id && existing.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const claimRequested = body?.claim === true;
  let claimedRow = existing;
  let claimed = false;
  if (claimRequested) {
    if (!existing.user_id) {
      const claimedAttempt = await claimEventHistoryById(id, userId);
      const refreshed = claimedAttempt || (await getEventHistoryById(id));
      if (!refreshed || refreshed.user_id !== userId) {
        return NextResponse.json(
          { error: "Unable to claim this draft right now." },
          { status: 409 },
        );
      }
      claimedRow = refreshed;
      claimed = true;
    } else if (existing.user_id === userId) {
      claimed = true;
    }
  }
  const titleInput = typeof body.title === "string" ? body.title.trim() : undefined;
  const hasTitleUpdate = Boolean(titleInput);
  const hasDataUpdate = body && (body.category != null || body.data != null);

  let updatedRow = claimedRow;
  let changed = false;

  if (hasDataUpdate) {
    const incomingData = body.data;
    const incomingCategory = body.category;
    const existingAccessControl = (existing.data && (existing.data as any).accessControl) || null;
    const processedData =
      incomingData && typeof incomingData === "object" ? { ...incomingData } : incomingData;
    if (processedData && typeof processedData === "object" && "accessControl" in processedData) {
      processedData.accessControl = await normalizeAccessControlPayload(
        processedData.accessControl,
        existingAccessControl,
      );
      if (!processedData.accessControl) {
        delete processedData.accessControl;
      }
    }
    if (processedData && typeof processedData === "object") {
      const mediaIssues = findTransientEventMedia(processedData);
      if (mediaIssues.length > 0) {
        return buildMediaValidationResponse(mediaIssues);
      }
    }

    // Check if this is a full data update (has themeId, theme, fontId, etc.)
    // If so, use full replace instead of merge to ensure nested objects are properly updated
    const isFullUpdate =
      processedData &&
      typeof processedData === "object" &&
      (processedData.themeId != null ||
        processedData.pageTemplateId != null ||
        processedData.theme != null ||
        processedData.fontId != null ||
        processedData.fontSize != null ||
        processedData.advancedSections != null);

    if (isFullUpdate && processedData) {
      // For full updates with theme/font, merge existing data with new data to preserve other fields
      // But ensure theme and font fields are fully replaced
      const existingData = existing.data || {};
      const mergedData = {
        ...existingData,
        ...processedData,
        // Explicitly ensure theme and font are replaced (not merged)
        themeId: processedData.themeId ?? existingData.themeId,
        pageTemplateId: processedData.pageTemplateId ?? existingData.pageTemplateId,
        theme: processedData.theme ?? existingData.theme,
        fontId: processedData.fontId ?? existingData.fontId,
        fontSize: processedData.fontSize ?? existingData.fontSize,
        fontFamily: processedData.fontFamily ?? existingData.fontFamily,
        fontSizeClass: processedData.fontSizeClass ?? existingData.fontSizeClass,
      };

      // If category is provided separately, include it
      if (incomingCategory != null) {
        mergedData.category = String(incomingCategory);
      }

      updatedRow = (await updateEventHistoryData(id, mergedData)) || updatedRow;
    } else {
      // For partial updates, use merge
      const patch: any = {};
      if (incomingCategory != null) patch.category = String(incomingCategory);
      if (processedData && typeof processedData === "object") {
        Object.assign(patch, processedData);
      }
      updatedRow = (await updateEventHistoryDataMerge(id, patch)) || updatedRow;
    }

    changed = true;
  }

  // Support updating title (alone or together with data)
  if (hasTitleUpdate) {
    updatedRow = (await updateEventHistoryTitle(id, String(titleInput))) || updatedRow;
    changed = true;
  }

  if (changed) {
    // Invalidate cache for the previous owner, or the new owner when a claim was performed.
    if (existing.user_id) {
      invalidateHistoryAndDashboardForUser(existing.user_id);
    } else if (claimed) {
      invalidateHistoryAndDashboardForUser(userId);
    }
    await invalidateSharedHistoryViewers(id);
    return NextResponse.json(updatedRow);
  }

  if (claimed) {
    invalidateHistoryAndDashboardForUser(userId);
    await invalidateSharedHistoryViewers(id);
    return NextResponse.json(updatedRow);
  }

  return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const existing = await getEventHistoryById(id);
  if (!existing) return NextResponse.json({ ok: true });
  if (existing.user_id && existing.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const affectedRecipients = await listShareRecipientUserIdsForEvent(id).catch(() => []);
  await deleteEventHistoryWithCleanup({ id, row: existing });
  // Invalidate cache for the owner
  if (existing.user_id) {
    invalidateHistoryAndDashboardForUser(existing.user_id);
  }
  for (const recipientUserId of affectedRecipients) {
    invalidateHistoryAndDashboardForUser(recipientUserId);
  }
  return NextResponse.json({ ok: true });
}
