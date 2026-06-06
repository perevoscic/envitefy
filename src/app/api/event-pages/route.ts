import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateDeterministicEventBlueprint } from "@/features/event-pages/ai/generateEventBlueprint";
import { repairEventBlueprint } from "@/features/event-pages/ai/repairEventBlueprint";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryById,
  getUserIdByEmail,
  upsertEventPageDraft,
} from "@/lib/db";
import { buildEventSlugSegment } from "@/utils/event-url";

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

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as unknown;
  if (!isRecord(body)) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });

  const eventId = cleanString(body.eventId);
  if (!eventId) return NextResponse.json({ ok: false, error: "eventId is required." }, { status: 400 });
  const event = await getEventHistoryById(eventId);
  if (!event) return NextResponse.json({ ok: false, error: "Event not found." }, { status: 404 });
  if (event.user_id && event.user_id !== userId) {
    return NextResponse.json({ ok: false, error: "You do not own this event." }, { status: 403 });
  }

  const data = isRecord(event.data) ? event.data : {};
  const slug = cleanString(body.slug) || buildEventSlugSegment(event.id, event.title, event.public_slug);
  const fallback = generateDeterministicEventBlueprint({
    eventId: event.id,
    title: event.title,
    data,
    shareUrl: `/e/${slug}`,
  });
  const repair = repairEventBlueprint({
    candidate: body.blueprint || fallback,
    eventId: event.id,
    title: event.title,
    data,
    shareUrl: `/e/${slug}`,
  });

  const page = await upsertEventPageDraft({
    eventId: event.id,
    slug,
    blueprint: repair.blueprint,
    aiGenerationVersion: cleanString(body.aiGenerationVersion) || "deterministic-v1",
    sourceConversationId: cleanString(body.sourceConversationId),
    createdBy: userId,
  });

  return NextResponse.json({ ok: true, page, repaired: repair.repaired, warnings: repair.warnings });
}
