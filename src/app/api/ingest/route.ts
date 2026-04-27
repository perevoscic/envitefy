import * as chrono from "chrono-node";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { corsJson, corsPreflight } from "@/lib/cors";
import {
  deleteEventHistoryById,
  incrementUserScanCounters,
  insertEventHistory,
  upsertEventHistoryInputBlob,
} from "@/lib/db";
import { uploadDiscoveryInputToBlob } from "@/lib/discovery-input-storage";
import { buildDefaultFootballDiscoveryData } from "@/lib/football-discovery";
import { getVisionClient } from "@/lib/gcp";
import { prepareDiscoverySourceFile, readAndValidateUploadFile } from "@/lib/media-upload";
import { buildDefaultGymMeetData } from "@/lib/meet-discovery";
import { rasterizePdfPageToPng } from "@/lib/pdf-raster";
import { hasProductScope, normalizeProductScopes } from "@/lib/product-scopes";

export const runtime = "nodejs";
const DISCOVERY_INGEST_LOG_PREFIX = "[discovery-ingest]";

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

async function handleDiscoveryIngest(
  request: Request,
  options: {
    workflow: "gymnastics" | "football";
    defaultTitle: string;
    buildBaseData: () => Record<string, any>;
  },
) {
  const session: any = await getServerSession(authOptions);
  const productScopes = normalizeProductScopes((session?.user as any)?.productScopes);
  const userId = await resolveSessionUserId(session);
  if (!userId) {
    return corsJson(request, { error: "Unauthorized" }, { status: 401 });
  }
  if (options.workflow === "football") {
    return corsJson(request, { error: "Football is not live yet." }, { status: 410 });
  }
  if (!hasProductScope(productScopes, "gymnastics")) {
    return corsJson(request, { error: "Gymnastics access required." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const rawUrl = String(formData.get("url") || "").trim();
  const hasFile = file instanceof File;
  const hasUrl = Boolean(rawUrl);
  console.log(`${DISCOVERY_INGEST_LOG_PREFIX} request received`, {
    workflow: options.workflow,
    hasFile,
    hasUrl,
  });
  if (!hasFile && !hasUrl) {
    return corsJson(
      request,
      { error: "Provide either file or url for meet discovery" },
      { status: 400 },
    );
  }
  if (hasFile && hasUrl) {
    return corsJson(request, { error: "Use one input at a time (file or url)" }, { status: 400 });
  }

  console.log(`${DISCOVERY_INGEST_LOG_PREFIX} resolved user`, {
    workflow: options.workflow,
    userId,
  });
  const baseData = options.buildBaseData();
  const now = new Date().toISOString();
  let discoveryInput: any = null;
  let title = options.defaultTitle;

  if (hasFile) {
    const fileValue = file as File;
    console.log(`${DISCOVERY_INGEST_LOG_PREFIX} validating file input`, {
      workflow: options.workflow,
      fileName: fileValue.name || "upload",
      mimeType: fileValue.type || "application/octet-stream",
      sizeBytes: fileValue.size || 0,
    });
    let prepared: Awaited<ReturnType<typeof prepareDiscoverySourceFile>>;
    try {
      prepared = await prepareDiscoverySourceFile(fileValue);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid file upload";
      const status =
        error && typeof error === "object" && "status" in error && Number.isFinite((error as any).status)
          ? Number((error as any).status)
          : 415;
      return corsJson(request, { error: message }, { status });
    }
    discoveryInput = {
      type: "file",
      fileName: prepared.fileName,
      mimeType: prepared.mimeType,
      sizeBytes: prepared.sizeBytes,
      blobStored: true,
      originalName: prepared.originalName,
      originalMimeType: prepared.originalMimeType,
      originalSizeBytes: prepared.originalSizeBytes,
      optimizedByQpdf: prepared.optimizedByQpdf,
    };
    title = fileValue.name?.replace(/\.[^.]+$/, "") || title;

    // Discovery ingest should not claim into user history until explicit Save/Publish.
    const row = await insertEventHistory({
      userId: null,
      title,
      data: {
        ...baseData,
        title,
        discoverySource: {
          status: "ingested",
          workflow: options.workflow,
          input: discoveryInput,
          extractedText: null,
          parseResult: null,
          modelUsed: null,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    console.log(`${DISCOVERY_INGEST_LOG_PREFIX} inserted discovery row`, {
      workflow: options.workflow,
      eventId: row.id,
      title,
    });
    try {
      const { pathname, url } = await uploadDiscoveryInputToBlob({
        eventId: row.id,
        fileName: prepared.fileName,
        mimeType: prepared.mimeType,
        bytes: prepared.buffer,
      });
      await upsertEventHistoryInputBlob({
        eventId: row.id,
        mimeType: prepared.mimeType,
        fileName: prepared.fileName,
        sizeBytes: prepared.sizeBytes,
        data: null,
        storagePathname: pathname,
        storageUrl: url,
      });
      console.log(`${DISCOVERY_INGEST_LOG_PREFIX} stored blob`, {
        workflow: options.workflow,
        eventId: row.id,
        sizeBytes: prepared.sizeBytes,
        storagePathname: pathname,
        optimizedByQpdf: prepared.optimizedByQpdf ?? null,
      });
    } catch (error) {
      console.error(`${DISCOVERY_INGEST_LOG_PREFIX} blob write failed`, {
        workflow: options.workflow,
        eventId: row.id,
        message: error instanceof Error ? error.message : String(error),
      });
      try {
        await deleteEventHistoryById(row.id);
      } catch {}
      throw error;
    }

    console.log(`${DISCOVERY_INGEST_LOG_PREFIX} request complete`, {
      workflow: options.workflow,
      eventId: row.id,
    });
    return corsJson(request, { eventId: row.id });
  } else {
    let normalizedUrl = "";
    try {
      const parsed = new URL(rawUrl);
      normalizedUrl = parsed.toString();
      title =
        parsed.hostname.replace(/^www\./i, "") +
        (options.workflow === "football" ? " Football" : " Meet");
    } catch {
      return corsJson(request, { error: "Invalid URL" }, { status: 400 });
    }
    discoveryInput = { type: "url", url: normalizedUrl };
    console.log(`${DISCOVERY_INGEST_LOG_PREFIX} accepted url input`, {
      workflow: options.workflow,
      url: normalizedUrl,
    });
  }

  // Discovery ingest should not claim into user history until explicit Save/Publish.
  const row = await insertEventHistory({
    userId: null,
    title,
    data: {
      ...baseData,
      title,
      discoverySource: {
        status: "ingested",
        workflow: options.workflow,
        input: discoveryInput,
        extractedText: null,
        parseResult: null,
        modelUsed: null,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  console.log(`${DISCOVERY_INGEST_LOG_PREFIX} inserted url discovery row`, {
    workflow: options.workflow,
    eventId: row.id,
    title,
  });
  return corsJson(request, { eventId: row.id });
}

async function handleMeetDiscoveryIngest(request: Request) {
  return handleDiscoveryIngest(request, {
    workflow: "gymnastics",
    defaultTitle: "Gymnastics Meet",
    buildBaseData: buildDefaultGymMeetData,
  });
}

async function handleFootballDiscoveryIngest(request: Request) {
  return handleDiscoveryIngest(request, {
    workflow: "football",
    defaultTitle: "Football Event",
    buildBaseData: buildDefaultFootballDiscoveryData,
  });
}

async function handleLegacyIngest(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return corsJson(request, { error: "No file" }, { status: 400 });
  }
  let validated: Awaited<ReturnType<typeof readAndValidateUploadFile>>;
  try {
    validated = await readAndValidateUploadFile(file, "attachment");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid file upload";
    const status =
      error && typeof error === "object" && "status" in error && Number.isFinite((error as any).status)
        ? Number((error as any).status)
        : 415;
    return corsJson(request, { error: message }, { status });
  }

  const mime = validated.mimeType;
  const inputBuffer = validated.bytes;

  let ocrBuffer: Buffer = inputBuffer;
  if (/pdf/i.test(mime)) {
    const pagePng = await rasterizePdfPageToPng(inputBuffer, 0);
    if (!pagePng) {
      return corsJson(
        request,
        { error: "Could not convert PDF to image for OCR" },
        { status: 422 },
      );
    }
    ocrBuffer = pagePng;
  }
  try {
    ocrBuffer = await (await import("sharp")).default(ocrBuffer)
      .resize(2000)
      .grayscale()
      .normalize()
      .toBuffer();
  } catch {
    // keep buffer as-is
  }

  const vision = getVisionClient();
  const [result] = await vision.documentTextDetection({
    image: { content: ocrBuffer },
    imageContext: { languageHints: ["en"] },
  });

  const text = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || "";
  const raw = (text || "").replace(/\s+\n/g, "\n").trim();

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const title =
    lines.find((l) => l.length > 5 && !/rsvp|free entry|admission/i.test(l)) || "Event from flyer";

  const parsed = chrono.parse(raw, new Date(), { forwardDate: true });
  let start: Date | null = null;
  let end: Date | null = null;
  if (parsed.length) {
    const c = parsed[0];
    start = c.start?.date() ?? null;
    end = c.end?.date() ?? null;
    if (!end && start) {
      end = new Date(start.getTime() + 90 * 60 * 1000);
    }
  }

  const locationLine =
    lines.find((l) =>
      /\d{1,5}\s+\w+|\b(Auditorium|Center|Hall|Gym|Park|Room|Suite|Ave|St|Blvd|Rd)\b/i.test(l),
    ) || "";

  const tz = "America/Chicago";
  const schedule = { detected: false, homeTeam: null, season: null, games: [] };
  const events: any[] = [];

  // Category detection (lightweight)
  const detectCategory = (fullText: string, _sched: any): string | null => {
    try {
      // No special football handling
      // Weddings/Birthdays — words-only; if both present, do not prefer either
      if (/\bbridal\s*shower\b/i.test(fullText)) return "Bridal Showers";
      const hasWedding =
        /(wedding|marriage|ceremony|reception|bride|groom|nupti(al)?|bridal)/i.test(fullText);
      const hasBirthday = /(birthday\s*party|\b(b-?day)\b|\bturns?\s+\d+|\bbirthday\b)/i.test(
        fullText,
      );
      if (hasWedding && !hasBirthday) return "Weddings";
      if (hasBirthday && !hasWedding) return "Birthdays";
      if (/(baby\s*shower|baby\s*sprinkle|gender\s*reveal|sip\s*(and|&)\s*see)/i.test(fullText)) {
        return "Baby Showers";
      }
      if (/(engagement\s*(party|celebration)?|she said yes|proposal party)/i.test(fullText)) {
        return "Engagements";
      }
      if (/(anniversary|vow\s*renewal)/i.test(fullText)) return "Anniversaries";
      if (/(house\s*warming|housewarming|new\s+home|new\s+place|new\s+house)/i.test(fullText)) {
        return "Housewarming";
      }
      if (/(graduation|grad\s*party|commencement|class of\s+\d{4})/i.test(fullText)) {
        return "Graduations";
      }
      if (
        /(baptism|christening|communion|first holy communion|confirmation|bar mitzvah|bat mitzvah|baby dedication)/i.test(
          fullText,
        )
      ) {
        return "Religious Events";
      }
      const isDoctorLike =
        /(doctor|dr\.|dentist|orthodont|clinic|hospital|pediatric|dermatolog|cardiolog|optomet|eye\s+exam)/i.test(
          fullText,
        );
      const hasAppt = /(appointment|appt)/i.test(fullText);
      if (isDoctorLike && hasAppt) return "Doctor Appointments";
      if (isDoctorLike) return "Doctor Appointments";
      if (hasAppt) return "Appointments";
      if (
        /(schedule|game|vs\.|tournament|league)/i.test(fullText) &&
        /(soccer|basketball|baseball|hockey|volleyball)/i.test(fullText)
      ) {
        return "Sport Events";
      }
      if (
        /(car\s*pool|carpool|ride\s*share|school\s*pickup|school\s*drop[- ]?off)/i.test(fullText)
      ) {
        return "Car Pool";
      }
      if (
        /(you'?re invited|join us|celebrat(e|ion)|party|open house|fundraiser|gala|cookout|bbq|picnic)/i.test(
          fullText,
        )
      ) {
        return "General Events";
      }
    } catch {}
    return null;
  };
  const category = detectCategory(raw, schedule);

  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    if (email) {
      try {
        await incrementUserScanCounters({ email, category });
      } catch {}
    }
  } catch {}

  return corsJson(request, {
    ocrText: raw,
    event: {
      title,
      start: start?.toISOString() ?? null,
      end: end?.toISOString() ?? null,
      location: locationLine,
      description: raw,
      timezone: tz,
    },
    schedule,
    events,
    category,
  });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = (url.searchParams.get("mode") || "").toLowerCase();
    console.log(`${DISCOVERY_INGEST_LOG_PREFIX} dispatch`, { mode });
    if (mode === "meet_discovery" || mode === "football_discovery") {
      return corsJson(
        request,
        { error: "Legacy discovery ingest route removed. Use /api/discovery/intake instead." },
        { status: 410 },
      );
    }
    return await handleLegacyIngest(request);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${DISCOVERY_INGEST_LOG_PREFIX} request failed`, {
      message,
    });
    return corsJson(request, { error: message }, { status: 500 });
  }
}
