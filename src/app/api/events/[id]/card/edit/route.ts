import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  buildDeterministicScheduleLine,
  buildStudioPublishPayload,
  buildStudioRequest,
  refreshLiveCardInvitationData,
} from "@/app/studio/studio-workspace-builders";
import {
  createStudioMediaItemFromHistoryRow,
  sanitizeEventDetails,
} from "@/app/studio/studio-workspace-sanitize";
import type { EventDetails, MediaItem } from "@/app/studio/studio-workspace-types";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  getEventHistoryById,
  listShareRecipientUserIdsForEvent,
  updateEventHistoryDataMerge,
  updateEventHistoryTitle,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { processBufferUpload } from "@/lib/media-upload";
import { generateStudioInvitation } from "@/lib/studio/generate";
import { parseDataUrlBase64 } from "@/utils/data-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DesignFieldMapping = {
  inputKey: string;
  detailKey: keyof EventDetails;
  editLabel: string | null;
};

type CardEditAction = "preview" | "save";

const DESIGN_FIELD_MAPPINGS: DesignFieldMapping[] = [
  { inputKey: "title", detailKey: "eventTitle", editLabel: "event title" },
  { inputKey: "eventDate", detailKey: "eventDate", editLabel: "event date" },
  { inputKey: "startTime", detailKey: "startTime", editLabel: "start time" },
  { inputKey: "endTime", detailKey: "endTime", editLabel: "end time" },
  { inputKey: "venueName", detailKey: "venueName", editLabel: "venue name" },
  { inputKey: "location", detailKey: "location", editLabel: "address" },
  { inputKey: "rsvpContact", detailKey: "rsvpContact", editLabel: "RSVP contact" },
  { inputKey: "rsvpDeadline", detailKey: "rsvpDeadline", editLabel: "RSVP deadline" },
  { inputKey: "theme", detailKey: "theme", editLabel: "requested card change" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(source: Record<string, unknown>, key: string): string | undefined {
  if (!Object.hasOwn(source, key)) return undefined;
  return readString(source[key]);
}

function quoteEditValue(value: string): string {
  return `"${value.replace(/"/g, "'")}"`;
}

function readAction(value: unknown): CardEditAction {
  return readString(value) === "save" ? "save" : "preview";
}

function splitVenueAndAddress(venueName: string, location: string) {
  const venue = readString(venueName);
  const address = readString(location);
  if (venue && address && venue.toLowerCase() !== address.toLowerCase()) {
    return { venueName: venue, location: address };
  }

  const combined = venue || address;
  const commaIndex = combined.indexOf(",");
  if (commaIndex > 0 && commaIndex < combined.length - 1) {
    return {
      venueName: combined.slice(0, commaIndex).trim(),
      location: combined.slice(commaIndex + 1).trim(),
    };
  }

  return { venueName: venue, location: address };
}

function normalizeDesignFields(fields: Record<string, unknown>) {
  const normalized = { ...fields };
  if (Object.hasOwn(fields, "venueName") || Object.hasOwn(fields, "location")) {
    const splitLocation = splitVenueAndAddress(
      readString(fields.venueName),
      readString(fields.location),
    );
    normalized.venueName = splitLocation.venueName;
    normalized.location = splitLocation.location;
  }
  return normalized;
}

function buildExplicitEditPrompt(params: {
  changedFields: DesignFieldMapping[];
  nextDetails: EventDetails;
}) {
  const preserveExistingArtwork =
    "Make only the requested edit. Keep the rest of the card artwork, layout, style, colors, imagery, and existing text unchanged.";
  const instructions = params.changedFields
    .map((field) => {
      if (!field.editLabel) return "";
      const value = readString(params.nextDetails[field.detailKey]);
      if (!value) return "";
      if (field.detailKey === "theme") {
        return `User requested card change: ${value}.`;
      }
      return `Replace only the visible ${field.editLabel} with ${quoteEditValue(value)}.`;
    })
    .filter(Boolean);

  return [preserveExistingArtwork, ...instructions].join(" ");
}

function buildUpdatedInvitationData(nextDetails: EventDetails, item: MediaItem) {
  const refreshed = refreshLiveCardInvitationData(nextDetails, item.data || undefined);
  const locationLine =
    [readString(nextDetails.venueName), readString(nextDetails.location)]
      .filter(Boolean)
      .join(", ") || refreshed.locationLine;
  return {
    ...refreshed,
    title: readString(nextDetails.eventTitle) || refreshed.title,
    scheduleLine: buildDeterministicScheduleLine(nextDetails) || refreshed.scheduleLine,
    locationLine,
    theme: {
      ...refreshed.theme,
      themeStyle: readString(nextDetails.theme) || refreshed.theme.themeStyle,
    },
    eventDetails: nextDetails,
  };
}

function generationErrorMessage(result: Awaited<ReturnType<typeof generateStudioInvitation>>) {
  return (
    result.errors?.image?.message ||
    result.errors?.text?.message ||
    result.warnings?.[0] ||
    "The card could not be updated."
  );
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

function buildNextDetails(item: MediaItem, fields: Record<string, unknown>) {
  const normalizedFields = normalizeDesignFields(fields);
  const detailPatch: Partial<Record<keyof EventDetails, string>> = {};
  const changedFields: DesignFieldMapping[] = [];

  for (const mapping of DESIGN_FIELD_MAPPINGS) {
    const value = readOptionalString(normalizedFields, mapping.inputKey);
    if (value === undefined) continue;
    detailPatch[mapping.detailKey] = value;
  }

  const nextDetails = sanitizeEventDetails({
    ...item.details,
    ...detailPatch,
  });

  for (const mapping of DESIGN_FIELD_MAPPINGS) {
    if (!Object.hasOwn(detailPatch, mapping.detailKey)) continue;
    if (
      readString(item.details[mapping.detailKey]) !== readString(nextDetails[mapping.detailKey])
    ) {
      changedFields.push(mapping);
    }
  }

  return { nextDetails, changedFields };
}

async function previewCardEdit(item: MediaItem, fields: Record<string, unknown>) {
  const { nextDetails, changedFields } = buildNextDetails(item, fields);
  if (changedFields.length === 0) {
    return NextResponse.json({ error: "No design changes requested." }, { status: 400 });
  }

  const editPrompt = buildExplicitEditPrompt({
    changedFields,
    nextDetails,
  });
  const request = buildStudioRequest(
    nextDetails,
    "image",
    "page",
    editPrompt,
    item.url,
    item.details,
  );
  const result = await generateStudioInvitation(request);
  if (!result.ok || !result.imageDataUrl) {
    return NextResponse.json(
      { error: generationErrorMessage(result), warnings: result.warnings || [] },
      { status: result.errors?.image?.status || result.errors?.text?.status || 502 },
    );
  }

  const invitationData = buildUpdatedInvitationData(nextDetails, item);
  return NextResponse.json({
    ok: true,
    action: "preview",
    title: readString(nextDetails.eventTitle) || "Untitled event",
    imageDataUrl: result.imageDataUrl,
    invitationData,
    positions: item.positions || null,
    details: nextDetails,
    warnings: result.warnings || [],
  });
}

async function saveCardEdit(params: {
  id: string;
  item: MediaItem;
  userId: string;
  fields: Record<string, unknown>;
  imageDataUrl: string;
}) {
  const { nextDetails } = buildNextDetails(params.item, params.fields);
  const parsedImage = parseDataUrlBase64(params.imageDataUrl);
  if (!parsedImage) {
    return NextResponse.json(
      { error: "The updated card image could not be persisted." },
      { status: 400 },
    );
  }

  const uploaded = await processBufferUpload({
    bytes: Buffer.from(parsedImage.base64Payload, "base64"),
    fileName: "event-card-edit.png",
    mimeType: parsedImage.mimeType || "image/png",
    usage: "header",
  });
  const imageUrl = uploaded.stored.display?.url || uploaded.stored.source?.url || null;
  if (!imageUrl) {
    return NextResponse.json(
      { error: "The updated card image could not be saved." },
      { status: 502 },
    );
  }

  const invitationData = buildUpdatedInvitationData(nextDetails, params.item);
  const nextItem: MediaItem = {
    ...params.item,
    url: imageUrl,
    data: invitationData,
    details: nextDetails,
    status: "ready",
  };
  const payload = buildStudioPublishPayload(nextItem, imageUrl);

  await updateEventHistoryTitle(params.id, payload.title);
  const updatedRow = await updateEventHistoryDataMerge(params.id, payload.data);
  invalidateHistoryAndDashboardForUser(params.userId);
  await invalidateSharedHistoryViewers(params.id);

  return NextResponse.json({
    ok: true,
    action: "save",
    title: payload.title,
    imageUrl,
    invitationData,
    positions: nextItem.positions || null,
    details: nextDetails,
    event: updatedRow,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getEventHistoryById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const fields = isRecord(body) && isRecord(body.fields) ? body.fields : {};
    const action = isRecord(body) ? readAction(body.action) : "preview";
    const item = createStudioMediaItemFromHistoryRow(existing);
    if (!item?.url) {
      return NextResponse.json(
        { error: "This event does not have editable card artwork yet." },
        { status: 400 },
      );
    }

    if (action === "save") {
      const imageDataUrl = isRecord(body) ? readString(body.imageDataUrl) : "";
      if (!imageDataUrl) {
        return NextResponse.json({ error: "No updated card preview to save." }, { status: 400 });
      }
      return await saveCardEdit({ id, item, userId, fields, imageDataUrl });
    }

    return await previewCardEdit(item, fields);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}
