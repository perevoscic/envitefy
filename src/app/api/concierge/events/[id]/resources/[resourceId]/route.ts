import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  archiveConciergeV2Resource,
  getConciergeV2ResourcePlanningCenter,
  updateConciergeV2Resource,
} from "@/lib/concierge-v2/resource-planning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function assertResourcesEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_RESOURCE_PLANNING")) throw new Error("Resource planning is disabled.");
}

function statusFor(error: any) {
  return error instanceof ConciergeV2OperationError
    ? error.status
    : /disabled/i.test(String(error?.message || ""))
      ? 404
      : 500;
}

async function currentUserId() {
  const session: any = await getServerSession(authOptions as any);
  return resolveSessionUserId(session);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> },
) {
  try {
    assertResourcesEnabled();
    const { id, resourceId } = await params;
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in to manage resources." }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const resource = await updateConciergeV2Resource({
      eventHistoryId: id,
      userId,
      resourceId,
      name: cleanString(body?.name, 220) || undefined,
      resourceType: cleanString(body?.resourceType || body?.type, 80) || undefined,
      venueName: body?.venueName === undefined ? undefined : cleanString(body?.venueName, 220),
      capacity: body?.capacity,
      notes: body?.notes === undefined ? undefined : cleanString(body?.notes, 500),
      status: cleanString(body?.status, 40) || undefined,
    });
    const resources = await getConciergeV2ResourcePlanningCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, resource, resources });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to update resource.") },
      { status: statusFor(error) },
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; resourceId: string }> }) {
  try {
    assertResourcesEnabled();
    const { id, resourceId } = await params;
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in to manage resources." }, { status: 401 });
    const resource = await archiveConciergeV2Resource({ eventHistoryId: id, userId, resourceId });
    const resources = await getConciergeV2ResourcePlanningCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, resource, resources });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to archive resource.") },
      { status: statusFor(error) },
    );
  }
}
