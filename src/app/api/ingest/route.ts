import { NextResponse } from "next/server";
import * as chrono from "chrono-node";
import sharp from "sharp";
import { getVisionClient } from "@/lib/gcp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { incrementCreditsByEmail, incrementUserScanCounters } from "@/lib/db";

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
    const schedule = { detected: false, homeTeam: null, season: null, games: [] };
    const events: any[] = [];

    // Category detection (lightweight)
    const detectCategory = (fullText: string, sched: any): string | null => {
      try {
        // No special football handling
        // Weddings/Birthdays — words-only; if both present, do not prefer either
        const hasWedding = /(wedding|marriage|ceremony|reception|bride|groom|nupti(al)?|bridal)/i.test(fullText);
        const hasBirthday = /(birthday\s*party|\b(b-?day)\b|\bturns?\s+\d+|\bbirthday\b)/i.test(fullText);
        if (hasWedding && !hasBirthday) return "Weddings";
        if (hasBirthday && !hasWedding) return "Birthdays";
        const isDoctorLike = /(doctor|dr\.|dentist|orthodont|clinic|hospital|pediatric|dermatolog|cardiolog|optomet|eye\s+exam)/i.test(fullText);
        const hasAppt = /(appointment|appt)/i.test(fullText);
        if (isDoctorLike && hasAppt) return "Doctor Appointments";
        if (isDoctorLike) return "Doctor Appointments";
        if (hasAppt) return "Appointments";
        if (/(schedule|game|vs\.|tournament|league)/i.test(fullText) && /(soccer|basketball|baseball|hockey|volleyball)/i.test(fullText)) {
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
        try { await incrementUserScanCounters({ email, category }); } catch {}
      }
    } catch {}

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
      category,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
