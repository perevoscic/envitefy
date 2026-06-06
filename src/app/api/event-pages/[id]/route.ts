import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { repairEventBlueprint } from "@/features/event-pages/ai/repairEventBlueprint";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryById,
  getEventPageById,
  getUserIdByEmail,
  publishEventPage,
  updateEventPageBlueprint,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

async function getCurrentUserId(): Promise<string | null> {
  const session: any = await getServerSession(authOptions as any);
  const email = cleanString(session?.user?.email);
  return email ? await getUserIdByEmail(email) : null;
}

async function requireOwnedPage(id: string, userId: string) {
  const page = await getEventPageById(id);
  if (!page) return { error: NextResponse.json({ ok: false, error: "Event page not found." }, { status: 404 }) };
  const event = await getEventHistoryById(page.event_id);
  if (!event) return { error: NextResponse.json({ ok: false, error: "Event not found." }, { status: 404 }) };
  if (event.user_id && event.user_id !== userId) {
    return { error: NextResponse.json({ ok: false, error: "You do not own this event page." }, { status: 403 }) };
  }
  return { page, event };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const owned = await requireOwnedPage(id, userId);
  if (owned.error) return owned.error;
  const body = (await request.json().catch(() => null)) as unknown;
  if (!isRecord(body)) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  const eventData = isRecord(owned.event.data) ? owned.event.data : {};
  const repair = repairEventBlueprint({
    candidate: body.blueprint,
    eventId: owned.event.id,
    title: owned.event.title,
    data: eventData,
    shareUrl: `/e/${owned.page.slug}`,
  });
  const page = await updateEventPageBlueprint({
    eventPageId: owned.page.id,
    blueprint: repair.blueprint,
    status: body.status === "draft" || body.status === "preview" ? body.status : "preview",
    createdBy: userId,
  });
  return NextResponse.json({ ok: true, page, repaired: repair.repaired, warnings: repair.warnings });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const owned = await requireOwnedPage(id, userId);
  if (owned.error) return owned.error;
  const body = (await request.json().catch(() => null)) as unknown;
  const action = isRecord(body) ? cleanString(body.action) : null;
  if (action !== "publish") {
    return NextResponse.json({ ok: false, error: "Unsupported event page action." }, { status: 400 });
  }
  const page = await publishEventPage(owned.page.id);
  return NextResponse.json({ ok: true, page });
}
