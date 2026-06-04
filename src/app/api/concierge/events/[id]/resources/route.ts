import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  createConciergeV2Resource,
  getConciergeV2ResourcePlanningCenter,
} from "@/lib/concierge-v2/resource-planning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertResourcesEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_RESOURCE_PLANNING")) {
    throw new Error("Resource planning is disabled.");
  }
}

function cleanString(value: any, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertResourcesEnabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to open resources." }, { status: 401 });
    }
    const resources = await getConciergeV2ResourcePlanningCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, resources });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to load resources.") },
      { status: statusFor(error) },
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertResourcesEnabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage resources." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const resource = await createConciergeV2Resource({
      eventHistoryId: id,
      userId,
      name: cleanString(body?.name, 220),
      resourceType: cleanString(body?.resourceType || body?.type, 80),
      venueName: cleanString(body?.venueName || body?.venue, 220),
      capacity: body?.capacity,
      notes: cleanString(body?.notes, 500),
    });
    const resources = await getConciergeV2ResourcePlanningCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, resource, resources });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to create resource.") },
      { status: statusFor(error) },
    );
  }
}
