import { NextResponse } from "next/server";
import * as chrono from "chrono-node";
import sharp from "sharp";
import { ImageAnnotatorClient } from "@google-cloud/vision";

export const runtime = "nodejs";

function getVisionClient() {
  const inlineJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const inlineBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  let creds: any | null = null;
  if (inlineJson) {
    try {
      creds = JSON.parse(inlineJson);
    } catch {
      // ignore JSON parse error; fall back to default ADC
    }
  } else if (inlineBase64) {
    try {
      const decoded = Buffer.from(inlineBase64, "base64").toString("utf8");
      creds = JSON.parse(decoded);
    } catch {
      // ignore base64/JSON parse error; fall back to default ADC
    }
  }
  if (creds?.client_email && creds?.private_key) {
    // Ensure the SDK does not attempt to read GOOGLE_APPLICATION_CREDENTIALS
    // when inline credentials are supplied.
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      delete (process.env as any).GOOGLE_APPLICATION_CREDENTIALS;
    }
    return new ImageAnnotatorClient({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      projectId: creds.project_id,
    });
  }
  return new ImageAnnotatorClient();
}

function stripInvitePhrases(s: string): string {
  return s
    .replace(/^\s*(you\s+are\s+invited\s+to[:\s-]*)/i, "")
    .replace(/^\s*(you'?re\s+invited\s+to[:\s-]*)/i, "")
    .replace(/^\s*(you\s+are\s+invited[:\s-]*)/i, "")
    .replace(/^\s*(you'?re\s+invited[:\s-]*)/i, "")
    .trim();
}

 function pickTitle(lines: string[], raw: string): string {
  const cleanedLines = lines
    .map((l) => stripInvitePhrases(l.replace(/[•·\-–—\s]+$/g, "").replace(/^[•·\-–—\s]+/g, "").trim()))
    .filter((l) => l.length > 1);

  const weekdays = /^(mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(r(s(day)?)?)?|fri(day)?|sat(urday)?|sun(day)?)$/i;
  const months = /^(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)$/i;
  const badHints = /(rsvp|admission|tickets|door(s)? open|free entry|age|call|visit|www\.|\.com|\b(am|pm)\b|\b\d{1,2}[:\.]?\d{0,2}\b)/i;
  const goodHints = /(birthday|party|anniversary|wedding|concert|festival|meet(ing|up)|ceremony|reception|gala|fundraiser|show|conference|appointment|open\s*house|celebration)/i;
  const ordinal = /\b\d{1,2}(st|nd|rd|th)\b/i;

  type Candidate = { text: string; score: number };
  const candidates: Candidate[] = [];

  const scoreLine = (text: string): number => {
    const t = text.trim();
    if (!t) return -Infinity;
    let score = 0;
    const words = t.split(/\s+/);
    const isOneWord = words.length === 1;
    const isAllCaps = /[A-Z]/.test(t) && !/[a-z]/.test(t);
    const simpleWord = (isOneWord && (weekdays.test(t) || months.test(t))) || /^[A-Za-z]{3,10}$/.test(t);

    if (goodHints.test(t)) score += 10;
    if (ordinal.test(t) || /\b\w+'s\b/.test(t)) score += 3;
    if (t.length >= 12 && t.length <= 60) score += 2;
    if (t.length >= 8 && t.length <= 80) score += 1;

    if (badHints.test(t)) score -= 4;
    if (simpleWord) score -= 6; // avoid lines like "FRIDAY" or just a month
    if (isAllCaps && t.length <= 9) score -= 3; // short shouty words

    return score;
  };

  // Base candidates
  for (const l of cleanedLines) {
    candidates.push({ text: l, score: scoreLine(l) });
  }

  // Try combining adjacent lines, e.g. "YOU ARE INVITED TO JAMES 8TH" + "BIRTHDAY"
  for (let i = 0; i < cleanedLines.length - 1; i++) {
    const a = cleanedLines[i];
    const b = cleanedLines[i + 1];
    const combined = `${a} ${b}`.replace(/\s+/g, " ").trim();
    if (/(birthday|party|wedding|concert|festival)/i.test(combined) && combined.length <= 90) {
      candidates.push({ text: combined, score: scoreLine(combined) + 1 });
    }
  }

  candidates.sort((x, y) => y.score - x.score);
  const best = candidates[0];
  if (best && best.score > 0) {
    // Light normalization: Title Case-ish while keeping numbers/ordinals
    const normalized = best.text
      .toLowerCase()
      .replace(/\b([a-z])(\w*)/g, (_m, a, b) => a.toUpperCase() + b)
      .replace(/\b(And|Or|Of|The|To|For|A|An|At|On|In|With)\b/g, (m) => m.toLowerCase())
      .replace(/\bBday\b/i, "Birthday");
    return normalized;
  }

  // Fallback: first reasonable non-junk line
  const fallback = cleanedLines.find((l) => l.length > 5 && !badHints.test(l) && !weekdays.test(l) && !months.test(l));
  return fallback || "Event from flyer";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

    const mime = file.type || "";
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    let ocrBuffer: Buffer = inputBuffer;
    if (!/pdf/i.test(mime)) {
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
    const title = pickTitle(lines, raw);

    const parsed = chrono.parse(raw, new Date(), { forwardDate: true });
    const timeLike = /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i;
    const rangeLike = /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b\s*[-–—]\s*\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i;
    let start: Date | null = null;
    let end: Date | null = null;
    let parsedText: string | null = null;
    if (parsed.length) {
      // Prefer explicit calendar dates (month & day) over time-only fragments like
      // "doors open at 10pm". If both appear, choose the one with the richest
      // explicit date information; secondarily consider time/ranges.
      const score = (r: any): number => {
        const t = (r?.text || "") as string;
        const hasTime = timeLike.test(t);
        const hasRange = rangeLike.test(t);
        const known = r?.start?.knownValues || {};
        // Strong signal if month and day explicitly present
        let s = 0;
        if (known.month && known.day) s += 6;
        // Some signal for explicit weekday
        if (known.weekday) s += 1;
        // Time/range signals (weaker than explicit date)
        if (hasRange) s += 2;
        if (hasTime) s += 1;
        // Penalize time-only (no explicit date context)
        if (hasTime && !(known.month && known.day) && !known.weekday) s -= 4;
        return s;
      };
      const byPreference = [...parsed].sort((a, b) => score(b as any) - score(a as any));
      const c = byPreference[0];
      start = c.start?.date() ?? null;
      end = c.end?.date() ?? null;
      // Do not infer an end time; leave null unless explicitly present
      parsedText = (c as any).text || null;

      // If the chosen parse contains an explicit calendar date but NO explicit time,
      // try to merge in a separate time-only fragment like "2 PM" or a range.
      const cAny: any = c as any;
      const chosenHasExplicitDate = Boolean(cAny?.start?.knownValues?.month && cAny?.start?.knownValues?.day);
      const chosenHasExplicitTime = typeof cAny?.start?.knownValues?.hour === "number";
      if (start && chosenHasExplicitDate && !chosenHasExplicitTime) {
        // Look for a separate time-only parse result
        const timeOnly = byPreference.find((r: any) => {
          const kv = r?.start?.knownValues || {};
          const hasTime = typeof kv.hour === "number";
          const hasExplicitDate = Boolean(kv.month && kv.day) || Boolean(kv.weekday);
          // ensure it's really a time token like "2 PM" and not another date
          const t = (r?.text || "") as string;
          return hasTime && !hasExplicitDate && timeLike.test(t);
        }) as any | undefined;
        if (timeOnly) {
          const tStart: Date = timeOnly.start?.date() as Date;
          if (tStart && start) {
            const merged = new Date(start);
            merged.setHours(tStart.getHours(), tStart.getMinutes(), 0, 0);
            start = merged;
          }
          // If it's a time range, map the end as well on the same day
          const tEnd: Date | null = (timeOnly.end?.date?.() as Date) || null;
          if (tEnd) {
            const endMerged = new Date(start);
            endMerged.setHours(tEnd.getHours(), tEnd.getMinutes(), 0, 0);
            end = endMerged;
          }
        }
      }
    }

    // Address extraction: prefer lines that look like venue/street and NOT times
    const timeToken = /\b\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)\b/i;
    const hasStreetNumber = /\b\d{1,6}\s+[A-Za-z]/;
    const venueOrSuffix = /\b(Auditorium|Center|Hall|Gym|Gymnastics|Park|Room|Suite|Ave(nue)?|St(reet)?|Blvd|Rd|Road|Dr|Drive|Ct|Court|Ln|Lane|Way|Pl|Place|Ter(race)?|Pkwy|Parkway|Hwy|Highway|Parkway|Boulevard|Street|Avenue)\b/i;

    const lineScores = lines.map((l, idx) => {
      let score = 0;
      if (timeToken.test(l)) score -= 10; // never pick pure time lines
      if (hasStreetNumber.test(l)) score += 5;
      if (venueOrSuffix.test(l)) score += 3;
      // Prefer lines followed by city/state/zip
      const next = lines[idx + 1] || "";
      const cityStateZip = /\b[A-Za-z\.'\s]+,\s*[A-Z]{2}\s+\d{5}\b/;
      if (cityStateZip.test(next)) score += 2;
      return score;
    });
    let locIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < lineScores.length; i++) {
      if (lineScores[i] > bestScore) {
        bestScore = lineScores[i];
        locIdx = i;
      }
    }
    let addressOnly = "";
    if (locIdx >= 0 && bestScore > 0) {
      const parts: string[] = [];
      const line = lines[locIdx].replace(/[–—-]\s*$/g, "").trim();
      const prev = lines[locIdx - 1]?.replace(/[–—-]\s*$/g, "").trim();
      const next = lines[locIdx + 1]?.replace(/[–—-]\s*$/g, "").trim();
      const cityStateZip = /\b[A-Za-z\.'\s]+,\s*[A-Z]{2}\s+\d{5}\b/;
      if (prev && !timeToken.test(prev) && venueOrSuffix.test(prev) && !hasStreetNumber.test(prev)) {
        parts.push(prev);
      }
      // If the line is a compound like "21 OCTOBER | 256 ROAD, LOS ANGELES | CALL: ...",
      // pick the most address-like segment and drop date/cta segments.
      const badSegment = /(call|rsvp|tickets?|admission|instagram|facebook|twitter|www\.|\.com|\b(tel|phone)\b)/i;
      const monthName = /(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)/i;
      const segments = line.split(/\s*[|•·]\s*/).map((s) => s.trim()).filter(Boolean);
      let bestSegment = "";
      let segScore = -Infinity;
      for (const s of (segments.length ? segments : [line])) {
        let sc = 0;
        if (badSegment.test(s)) sc -= 10;
        if (monthName.test(s) && !hasStreetNumber.test(s)) sc -= 4; // looks like a pure date piece
        if (hasStreetNumber.test(s)) sc += 5;
        if (venueOrSuffix.test(s)) sc += 3;
        if (sc > segScore) {
          segScore = sc;
          bestSegment = s;
        }
      }
      parts.push(bestSegment || line);
      if (next && (cityStateZip.test(next) || hasStreetNumber.test(next)) && !timeToken.test(next)) {
        parts.push(next);
      }
      addressOnly = parts.join(", ").replace(/^\s*\|\s*/g, "").replace(/\s{2,}/g, " ").trim();
      // If still no digit in address, fall back to line with number elsewhere
      if (!/\d/.test(addressOnly)) {
        const withNum = lines.find((l) => hasStreetNumber.test(l) && !timeToken.test(l));
        if (withNum) addressOnly = withNum.trim();
      }
    }

    const cleanDescription = (() => {
      const normalize = (s: string) =>
        s
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      const titleWords = normalize(title).split(" ").filter(Boolean);
      const addressNorm = normalize(addressOnly);
      const parsedNorm = parsedText ? normalize(parsedText) : null;
      const genericWords = new Set(["party", "birthday", "event", "celebration"]);
      const hasEnoughOverlap = (line: string, words: string[]) => {
        if (!words.length) return false;
        const lineWords = normalize(line).split(" ").filter(Boolean);
        if (!lineWords.length) return false;
        let matches = 0;
        for (const w of words) if (lineWords.includes(w)) matches++;
        return matches / words.length >= 0.6 || matches >= Math.min(3, words.length);
      };
      const monthRe = /(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)/i;
      const timeRe = /\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i;
      const yearRe = /\b20\d{2}\b/;
      const inviteRe = /\b(you\s+are\s+invited(\s+to)?|you'?re\s+invited(\s+to)?)\b/i;
      const keep: string[] = [];
      for (const line of lines) {
        if (!line) continue;
        const stripped = stripInvitePhrases(line).trim();
        if (!stripped) continue;
        // Drop low-signal noise lines
        if (stripped.length <= 2) continue; // e, ee, 2
        if (/^\d+$/.test(stripped)) continue; // pure number
        if (/^[A-Za-z]$/.test(stripped)) continue; // single char
        if (/(^|\s)(ee+|oo+|ll+)(\s|$)/i.test(stripped) && stripped.replace(/\s+/g, "").length <= 3) continue;
        if (inviteRe.test(stripped)) continue;
        if (hasEnoughOverlap(stripped, titleWords)) continue;
        const strippedNorm = normalize(stripped);
        if (addressNorm && (strippedNorm.includes(addressNorm) || (strippedNorm.length >= 8 && addressNorm.includes(strippedNorm)))) continue;
        // Only drop the line if it is exactly the same as the parsed time fragment
        if (parsedNorm && strippedNorm === parsedNorm) continue;
        // Ignore generic single words like "Party" when alone
        if (/^[A-Za-z]+$/.test(stripped) && genericWords.has(stripped.toLowerCase())) continue;
        keep.push(stripped);
      }
      return keep.join("\n");
    })();

    return NextResponse.json({
      ocrText: raw,
      fieldsGuess: {
        title,
        start: start?.toISOString() ?? null,
        end: end?.toISOString() ?? null,
        location: addressOnly,
        description: cleanDescription,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


