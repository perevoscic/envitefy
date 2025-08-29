import { NextResponse } from "next/server";
import * as chrono from "chrono-node";
import sharp from "sharp";
import { getVisionClient } from "@/lib/gcp";
import { parseFootballSchedule, scheduleToEvents } from "@/lib/sports";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
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
      imageContext: { languageHints: ["en"] }
    });

    const text = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || "";
    const raw = (text || "").replace(/\s+\n/g, "\n").trim();

    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    const title =
      lines.find(l => l.length > 5 && !/rsvp|free entry|admission/i.test(l)) ||
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
      lines.find(l => /\d{1,5}\s+\w+|\b(Auditorium|Center|Hall|Gym|Park|Room|Suite|Ave|St|Blvd|Rd)\b/i.test(l)) ||
      "";

    const tz = "America/Chicago";
    const schedule = parseFootballSchedule(raw, tz);
    const events = scheduleToEvents(schedule, tz);

    return NextResponse.json({
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
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


