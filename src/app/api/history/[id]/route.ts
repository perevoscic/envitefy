import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  getEventHistoryById,
  updateEventHistoryTitle,
  deleteEventHistoryById,
  updateEventHistoryDataMerge,
  updateEventHistoryData,
  claimEventHistoryById,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { normalizeAccessControlPayload } from "@/lib/event-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const row = await getEventHistoryById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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
          { status: 409 }
        );
      }
      claimedRow = refreshed;
      claimed = true;
    } else if (existing.user_id === userId) {
      claimed = true;
    }
  }
  const titleInput =
    typeof body.title === "string" ? body.title.trim() : undefined;
  const hasTitleUpdate = Boolean(titleInput);
  const hasDataUpdate = body && (body.category != null || body.data != null);

  let updatedRow = claimedRow;
  let changed = false;

  if (hasDataUpdate) {
    const incomingData = body.data;
    const incomingCategory = body.category;
    const existingAccessControl =
      (existing.data && (existing.data as any).accessControl) || null;
    const processedData =
      incomingData && typeof incomingData === "object"
        ? { ...incomingData }
        : incomingData;
    if (processedData && typeof processedData === "object" && "accessControl" in processedData) {
      processedData.accessControl = await normalizeAccessControlPayload(
        processedData.accessControl,
        existingAccessControl
      );
      if (!processedData.accessControl) {
        delete processedData.accessControl;
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
        pageTemplateId:
          processedData.pageTemplateId ?? existingData.pageTemplateId,
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
      
      console.log("[API] Full update with meet design fields:", {
        pageTemplateId: mergedData.pageTemplateId,
        themeId: mergedData.themeId,
        theme: mergedData.theme?.name,
        fontId: mergedData.fontId,
        fontSize: mergedData.fontSize,
      });
      
      updatedRow = (await updateEventHistoryData(id, mergedData)) || updatedRow;
    } else {
      // For partial updates, use merge
      const patch: any = {};
      if (incomingCategory != null) patch.category = String(incomingCategory);
      if (processedData && typeof processedData === "object") {
        Object.assign(patch, processedData);
      }
      updatedRow =
        (await updateEventHistoryDataMerge(id, patch)) || updatedRow;
    }

    changed = true;
  }

  // Support updating title (alone or together with data)
  if (hasTitleUpdate) {
    updatedRow =
      (await updateEventHistoryTitle(id, String(titleInput))) || updatedRow;
    changed = true;
  }

  if (changed) {
    // Invalidate cache for the previous owner, or the new owner when a claim was performed.
    if (existing.user_id) {
      invalidateUserHistory(existing.user_id);
      invalidateUserDashboard(existing.user_id);
    } else if (claimed) {
      invalidateUserHistory(userId);
      invalidateUserDashboard(userId);
    }
    return NextResponse.json(updatedRow);
  }

  if (claimed) {
    invalidateUserHistory(userId);
    invalidateUserDashboard(userId);
    return NextResponse.json(updatedRow);
  }

  return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const existing = await getEventHistoryById(id);
  if (!existing) return NextResponse.json({ ok: true });
  if (existing.user_id && existing.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await deleteEventHistoryById(id);
  // Invalidate cache for the owner
  if (existing.user_id) {
    invalidateUserHistory(existing.user_id);
    invalidateUserDashboard(existing.user_id);
  }
  return NextResponse.json({ ok: true });
}
