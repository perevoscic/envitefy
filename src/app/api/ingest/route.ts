import * as chrono from "chrono-node";
import sharp from "sharp";
import { getVisionClient } from "@/lib/gcp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserIdByEmail,
  incrementCreditsByEmail,
  incrementUserScanCounters,
  insertEventHistory,
} from "@/lib/db";
import { corsJson, corsPreflight } from "@/lib/cors";
import { buildDefaultGymMeetData } from "@/lib/meet-discovery";
import { buildDefaultFootballDiscoveryData } from "@/lib/football-discovery";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

async function getSessionUserId() {
  const session: any = await getServerSession(authOptions);
  const sessionUser: any = (session && (session as any).user) || null;
  let userId: string | null = (sessionUser?.id as string | undefined) || null;
  if (!userId && sessionUser?.email) {
    userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
  }
  return userId;
}

async function handleDiscoveryIngest(
  request: Request,
  options: {
    workflow: "gymnastics" | "football";
    defaultTitle: string;
    buildBaseData: () => Record<string, any>;
  }
) {
  const formData = await request.formData();
  const file = formData.get("file");
  const rawUrl = String(formData.get("url") || "").trim();
  const hasFile = file instanceof File;
  const hasUrl = Boolean(rawUrl);
  if (!hasFile && !hasUrl) {
    return corsJson(
      request,
      { error: "Provide either file or url for meet discovery" },
      { status: 400 }
    );
  }
  if (hasFile && hasUrl) {
    return corsJson(
      request,
      { error: "Use one input at a time (file or url)" },
      { status: 400 }
    );
  }

  const userId = await getSessionUserId();
  const baseData = options.buildBaseData();
  const now = new Date().toISOString();
  let discoveryInput: any = null;
  let title = options.defaultTitle;

  if (hasFile) {
    const fileValue = file as File;
    const mimeType = fileValue.type || "";
    const validMime =
      /pdf/i.test(mimeType) ||
      /image\/(png|jpe?g)/i.test(mimeType) ||
      /\.(pdf|png|jpe?g)$/i.test(fileValue.name || "");
    if (!validMime) {
      return corsJson(
        request,
        { error: "Unsupported file. Use PDF, JPG/JPEG, or PNG." },
        { status: 400 }
      );
    }
    const bytes = Buffer.from(await fileValue.arrayBuffer());
    const dataUrl = `data:${mimeType || "application/octet-stream"};base64,${bytes.toString(
      "base64"
    )}`;
    discoveryInput = {
      type: "file",
      fileName: fileValue.name || "upload",
      mimeType: mimeType || "application/octet-stream",
      sizeBytes: fileValue.size || bytes.length,
      dataUrl,
    };
    title = fileValue.name?.replace(/\.[^.]+$/, "") || title;
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
  }

  const row = await insertEventHistory({
    userId: userId || null,
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

  const mime = file.type || "";
  const fileArrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(fileArrayBuffer);

  let ocrBuffer: Buffer = inputBuffer;
  if (!/pdf/i.test(mime)) {
    // Preprocess for OCR (resize, grayscale, normalize)
    ocrBuffer = await sharp(inputBuffer).resize(2000).grayscale().normalize().toBuffer();
  }

  const vision = getVisionClient();
  const [result] = await vision.textDetection({
    image: { content: ocrBuffer },
    imageContext: { languageHints: ["en"] },
  });

  const text = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || "";
  const raw = (text || "").replace(/\s+\n/g, "\n").trim();

  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const title =
    lines.find((l) => l.length > 5 && !/rsvp|free entry|admission/i.test(l)) ||
    "Event from flyer";

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
      /\d{1,5}\s+\w+|\b(Auditorium|Center|Hall|Gym|Park|Room|Suite|Ave|St|Blvd|Rd)\b/i.test(
        l
      )
    ) || "";

  const tz = "America/Chicago";
  const schedule = { detected: false, homeTeam: null, season: null, games: [] };
  const events: any[] = [];

  // Category detection (lightweight)
  const detectCategory = (fullText: string, sched: any): string | null => {
    try {
      // No special football handling
      // Weddings/Birthdays — words-only; if both present, do not prefer either
      const hasWedding =
        /(wedding|marriage|ceremony|reception|bride|groom|nupti(al)?|bridal)/i.test(fullText);
      const hasBirthday = /(birthday\s*party|\b(b-?day)\b|\bturns?\s+\d+|\bbirthday\b)/i.test(
        fullText
      );
      if (hasWedding && !hasBirthday) return "Weddings";
      if (hasBirthday && !hasWedding) return "Birthdays";
      const isDoctorLike =
        /(doctor|dr\.|dentist|orthodont|clinic|hospital|pediatric|dermatolog|cardiolog|optomet|eye\s+exam)/i.test(
          fullText
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
      if (/(car\s*pool|carpool|ride\s*share|school\s*pickup|school\s*drop[- ]?off)/i.test(fullText)) {
        return "Car Pool";
      }
    } catch {}
    return null;
  };
  const category = detectCategory(raw, schedule);

  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    if (email) {
      await incrementCreditsByEmail(email, -1);
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
    if (mode === "meet_discovery") {
      return await handleMeetDiscoveryIngest(request);
    }
    if (mode === "football_discovery") {
      return await handleFootballDiscoveryIngest(request);
    }
    return await handleLegacyIngest(request);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return corsJson(request, { error: message }, { status: 500 });
  }
}
