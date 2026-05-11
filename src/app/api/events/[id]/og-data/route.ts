import { NextRequest, NextResponse } from "next/server";
import { getEventHistoryPublicRenderBySlugOrId } from "@/lib/db";
import { sanitizePersistedMediaUrl } from "@/lib/public-asset-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
}

function normalizeImageUrl(value: unknown, origin: string): string | null {
  const raw = sanitizePersistedMediaUrl(readString(value));
  if (!raw) return null;
  if (/^data:image\//i.test(raw)) return raw;
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return new URL(raw, origin).toString();
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}

function resolveOgImageUrl(data: Record<string, unknown>, origin: string): string | null {
  const studioCard = isRecord(data.studioCard) ? data.studioCard : null;
  const attachment = isRecord(data.attachment) ? data.attachment : null;
  const attachmentType = readString(attachment?.type).toLowerCase();
  const attachmentImageUrl = attachmentType.startsWith("image/")
    ? firstString(attachment?.dataUrl, attachment?.previewImageUrl, attachment?.thumbnailUrl)
    : null;

  return normalizeImageUrl(
    firstString(
      data.coverImageUrl,
      studioCard?.imageUrl,
      data.customHeroImage,
      data.heroImage,
      data.thumbnail,
      attachmentImageUrl,
    ),
    origin,
  );
}

function resolveLocation(data: Record<string, unknown>): string | null {
  const event = isRecord(data.event) ? data.event : null;
  const publicEvent = isRecord(data.publicEvent) ? data.publicEvent : null;
  return firstString(
    publicEvent?.locationLine,
    data.locationLabel,
    data.placeName,
    data.venueName,
    data.venue,
    data.location,
    event?.location,
    event?.venue,
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const awaitedParams = await params;
    const row = await getEventHistoryPublicRenderBySlugOrId({
      value: awaitedParams.id,
      userId: undefined,
    });

    if (!row) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const data = isRecord(row.data) ? row.data : {};
    const title = firstString(data.title, row.title) || "Envitefy Event";
    const imageUrl = resolveOgImageUrl(data, req.nextUrl.origin);

    return NextResponse.json(
      {
        title,
        description: null,
        location: resolveLocation(data),
        thumbnail: imageUrl,
        attachmentDataUrl: null,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      },
    );
  } catch (error) {
    console.error("[events/og-data] failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Error loading event preview data" }, { status: 500 });
  }
}
