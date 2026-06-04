import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  createConciergeV2ResourceRequirement,
  getConciergeV2ResourcePlanningCenter,
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertResourcesEnabled();
    const { id } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage requirements." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const requirement = await createConciergeV2ResourceRequirement({
      eventHistoryId: id,
      userId,
      occurrenceId: cleanString(body?.occurrenceId || body?.occurrence_id, 80),
      resourceType: cleanString(body?.resourceType || body?.type, 80),
      quantity: body?.quantity,
      notes: cleanString(body?.notes, 500),
      requiredAttributes: body?.requiredAttributes || body?.attributes || {},
    });
    const resources = await getConciergeV2ResourcePlanningCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, requirement, resources });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to create resource requirement.") },
      { status: statusFor(error) },
    );
  }
}
