import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { repairEventBlueprint } from "@/features/event-pages/ai/repairEventBlueprint";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryById,
  getEventPageById,
  getUserIdByEmail,
  listEventPageVersions,
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

function cleanBoundedString(value: unknown, maxLength: number): string | null {
  const text = cleanString(value);
  return text ? text.replace(/\s+/g, " ").slice(0, maxLength) : null;
}

function cleanHexColor(value: unknown): string | null {
  const text = cleanBoundedString(value, 16);
  return text && /^#[0-9a-f]{6}$/i.test(text) ? text.toUpperCase() : null;
}

function cleanThemePatch(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  const out: Record<string, unknown> = {};
  for (const key of [
    "mood",
    "palette",
    "formality",
    "visualDensity",
    "typography",
    "heroStyle",
    "sectionRhythm",
    "backgroundTreatment",
  ]) {
    const text = cleanBoundedString(value[key], 80);
    if (text) out[key] = text;
  }
  const colors = isRecord(value.colors) ? value.colors : {};
  const cleanColors: Record<string, string> = {};
  for (const key of ["primary", "secondary", "background", "surface", "text", "mutedText"]) {
    const color = cleanHexColor(colors[key]);
    if (color) cleanColors[key] = color;
  }
  if (Object.keys(cleanColors).length) out.colors = cleanColors;
  return out;
}

function applySectionUpdates(
  sections: Array<Record<string, unknown>>,
  value: unknown,
): { sections: Array<Record<string, unknown>>; changed: boolean } {
  if (!Array.isArray(value)) return { sections, changed: false };
  let changed = false;
  const updates = value.filter(isRecord).slice(0, 12);
  const next = sections.map((section) => {
    const id = cleanBoundedString(section.id, 80);
    const type = cleanBoundedString(section.type, 80);
    const update = updates.find((item) => {
      const updateId = cleanBoundedString(item.sectionId || item.id, 80);
      const updateType = cleanBoundedString(item.sectionType || item.type, 80);
      return Boolean((updateId && updateId === id) || (updateType && updateType === type));
    });
    if (!update) return section;
    const patched = { ...section };
    const title = cleanBoundedString(update.title, 160);
    const body = cleanBoundedString(update.body || update.description, 900);
    const eyebrow = cleanBoundedString(update.eyebrow, 80);
    if (title) {
      patched.title = title;
      changed = true;
    }
    if (body) {
      patched.body = body;
      changed = true;
    }
    if (eyebrow) {
      patched.eyebrow = eyebrow;
      changed = true;
    }
    return patched;
  });
  return { sections: next, changed };
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const owned = await requireOwnedPage(id, userId);
  if (owned.error) return owned.error;
  const versions = await listEventPageVersions(owned.page.id);
  return NextResponse.json({ ok: true, page: owned.page, versions });
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
  if (action === "publish") {
    const page = await publishEventPage(owned.page.id);
    return NextResponse.json({ ok: true, page });
  }
  if (action === "revise") {
    const revisionText = cleanString(isRecord(body) ? body.revisionText : null);
    const sectionUpdateResult = applySectionUpdates(
      owned.page.page_blueprint_json.sections as Array<Record<string, unknown>>,
      isRecord(body) ? body.sectionUpdates : null,
    );
    const themePatch = cleanThemePatch(isRecord(body) ? body.themePatch : null);
    if (!revisionText && !sectionUpdateResult.changed && !Object.keys(themePatch).length) {
      return NextResponse.json(
        { ok: false, error: "revisionText, sectionUpdates, or themePatch is required." },
        { status: 400 },
      );
    }
    const blueprint = {
      ...owned.page.page_blueprint_json,
      theme: Object.keys(themePatch).length
        ? {
            ...owned.page.page_blueprint_json.theme,
            ...themePatch,
            colors: {
              ...owned.page.page_blueprint_json.theme.colors,
              ...(isRecord(themePatch.colors) ? themePatch.colors : {}),
            },
          }
        : owned.page.page_blueprint_json.theme,
      sections: sectionUpdateResult.changed
        ? sectionUpdateResult.sections
        : owned.page.page_blueprint_json.sections.map((section) =>
            section.type === "hero" && revisionText ? { ...section, body: revisionText } : section,
          ),
      generatedCopy: {
        ...(owned.page.page_blueprint_json.generatedCopy || {}),
        latestRevision: revisionText || "Blueprint sections or theme intent revised.",
      },
    };
    const page = await updateEventPageBlueprint({
      eventPageId: owned.page.id,
      blueprint,
      status: "preview",
      createdBy: userId,
    });
    return NextResponse.json({ ok: true, page });
  }
  if (action === "restore_version") {
    const versionNumber = Number(isRecord(body) ? body.versionNumber : null);
    if (!Number.isFinite(versionNumber) || versionNumber < 1) {
      return NextResponse.json({ ok: false, error: "versionNumber is required." }, { status: 400 });
    }
    const versions = await listEventPageVersions(owned.page.id);
    const version = versions.find((item) => item.version_number === Math.floor(versionNumber));
    if (!version) {
      return NextResponse.json({ ok: false, error: "Version not found." }, { status: 404 });
    }
    const page = await updateEventPageBlueprint({
      eventPageId: owned.page.id,
      blueprint: version.page_blueprint_json,
      status: "preview",
      createdBy: userId,
    });
    return NextResponse.json({ ok: true, page, restoredVersionNumber: version.version_number });
  }
  return NextResponse.json({ ok: false, error: "Unsupported event page action." }, { status: 400 });
}
