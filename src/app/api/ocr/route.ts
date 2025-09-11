import { NextResponse } from "next/server";
import * as chrono from "chrono-node";
import sharp from "sharp";
import { getVisionClient } from "@/lib/gcp";
import { GoogleAuth } from "google-auth-library";

/** Ensure this runs on Node (not Edge) and isn’t cached */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Give the route more time for large images + Vision */
export const maxDuration = 60;

/* ------------------------------ helpers ------------------------------ */

// Basic low-confidence heuristic for titles
function isTitleLowConfidence(title: string): boolean {
  if (!title) return true;
  const t = title.trim();
  if (t.length < 6) return true;
  const month = /(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)/i;
  if (month.test(t)) return true;
  if (/^event from flyer$/i.test(t)) return true;
  if (/^(party|birthday|event|celebration)$/i.test(t)) return true;
  if (/\b\d{1,2}(st|nd|rd|th)\b$/i.test(t)) return true;
  return false;
}

async function llmExtractEvent(raw: string): Promise<{
  title?: string;
  start?: string | null;
  end?: string | null;
  address?: string;
  description?: string;
} | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const system = "You extract calendar events from noisy OCR text. Return strict JSON only.";
  const user = `OCR TEXT:\n${raw}\n\nExtract fields as JSON with keys: title (string), start (ISO 8601 if possible or null), end (ISO 8601 or null), address (string), description (string).\n- Title should be a human-friendly event name without dates, e.g., "+Alice's Birthday Party+" not "+Party December 23rd+".\n- Parse date and time if present; if time missing, leave start null.\n- Keep address concise (street/city/state if present).\n- Description can include RSVP or extra lines.\n- Respond with ONLY JSON.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const text = j?.choices?.[0]?.message?.content || "";
    if (!text) return null;
    try {
      return JSON.parse(text) as any;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

// Football schedule extraction removed

function cleanAddressLabel(input: string): string {
  let s = input.trim();
  s = s.replace(/^\s*(location|address|venue|where)\s*[:\-]?\s*/i, "");
  s = s.replace(/^\s*at\s+/i, "");
  if (/\d/.test(s)) s = s.replace(/^[^\d]*?(?=\d)/, "");
  s = s.replace(/\s{2,}/g, " ").replace(/[\s,\-]+$/g, "");
  return s.trim();
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
  const months = /^(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?)$/i;
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
    const hasMonth = months.test(t);
    const hasGood = goodHints.test(t);
    const hasOrdinal = ordinal.test(t);

    if (goodHints.test(t)) score += 10;
    if (ordinal.test(t)) score += 2;
    if (/\b\w+[’']s\b/.test(t)) score += 3;
    if (/(birthday.*party|party.*birthday)/i.test(t)) score += 6;
    if (t.length >= 12 && t.length <= 60) score += 2;
    if (t.length >= 8 && t.length <= 80) score += 1;

    if (badHints.test(t)) score -= 4;
    if (simpleWord) score -= 6;
    if (isAllCaps && t.length <= 9) score -= 3;
    if (hasMonth && hasGood) score -= 8;
    if (hasMonth && hasOrdinal && hasGood) score -= 10;

    return score;
  };

  for (const l of cleanedLines) candidates.push({ text: l, score: scoreLine(l) });

  for (let i = 0; i < cleanedLines.length - 1; i++) {
    const combined = `${cleanedLines[i]} ${cleanedLines[i + 1]}`.replace(/\s+/g, " ").trim();
    if (/(birthday|party|wedding|concert|festival)/i.test(combined) && combined.length <= 90) {
      candidates.push({ text: combined, score: scoreLine(combined) + 1 });
    }
  }
  for (let i = 0; i < cleanedLines.length - 2; i++) {
    const triple = `${cleanedLines[i]} ${cleanedLines[i + 1]} ${cleanedLines[i + 2]}`
      .replace(/\s+/g, " ").trim();
    if (/(birthday|party|wedding|concert|festival)/i.test(triple) && triple.length <= 120) {
      let bonus = 2;
      if (/\b\w+(?:[’']s)?\s+birthday\s+party\b/i.test(triple)) bonus += 10;
      candidates.push({ text: triple, score: scoreLine(triple) + bonus });
    }
  }

  candidates.sort((x, y) => y.score - x.score);
  let best = candidates[0];
  if (best && best.score > 0) {
    const monthAlt = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?)";
    const dateTail = new RegExp(`(?:\\s*(?:on|,)?\\s*)?(?:${monthAlt})\\b\\s*\\d{1,2}(?:st|nd|rd|th)?(?:\\s*,?\\s*\\d{4})?\\s*$`, "i");
    let candidateText = best.text.replace(dateTail, "").trim();
    candidateText = candidateText.replace(/^(?:st|nd|rd|th)\b[\s\-.,:]*/i, "").trim();
    candidateText = candidateText.replace(/\b\d{1,2}(st|nd|rd|th)\b\s*$/i, "").trim();

    const normalized = candidateText
      .toLowerCase()
      .replace(/\b([a-z])(\w*)/g, (_m, a, b) => a.toUpperCase() + b)
      .replace(/\b(And|Or|Of|The|To|For|A|An|At|On|In|With)\b/g, (m) => m.toLowerCase())
      .replace(/\bBday\b/i, "Birthday");
    return normalized;
  }

  const fallback = cleanedLines.find((l) => l.length > 5 && !badHints.test(l) && !weekdays.test(l) && !months.test(l));
  return fallback || "Event from flyer";
}

/* ------------------------------ Vision REST fallback ------------------------------ */

async function visionRestOCR(ocrBuffer: Buffer) {
  const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  if (!b64) throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_BASE64");
  const creds = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));

  const auth = new GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 30_000); // 30s cap for REST
  const resp = await fetch("https://vision.googleapis.com/v1/images:annotate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{
        image: { content: ocrBuffer.toString("base64") },
        features: [{ type: "TEXT_DETECTION" }],
        imageContext: { languageHints: ["en"] },
      }],
    }),
    signal: ac.signal,
  }).catch((e) => {
    clearTimeout(timer);
    throw e;
  });
  clearTimeout(timer);

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    console.warn(">>> REST Vision non-OK", resp.status, txt.slice(0, 300));
    throw new Error(`REST Vision HTTP ${resp.status}`);
  }
  const j: any = await resp.json();
  return {
    fullTextAnnotation: { text: j?.responses?.[0]?.fullTextAnnotation?.text || "" },
    textAnnotations: j?.responses?.[0]?.textAnnotations || [],
  };
}


/* ------------------------------ route ------------------------------ */

export async function POST(request: Request) {
  // Minimal debug; we can remove once stable

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const mime = file.type || "";
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // Preprocess image for better OCR; gracefully fall back if sharp can't handle the format
    let ocrBuffer: Buffer = inputBuffer;
    if (!/pdf/i.test(mime)) {
      try {
        ocrBuffer = await sharp(inputBuffer).resize(2000).grayscale().normalize().toBuffer();
      } catch {
        ocrBuffer = inputBuffer;
      }
    }

    // --- Google Vision with SDK + timeout, then REST fallback ---
    const vision = getVisionClient();
    let result: any;

    try {
      const sdkCall = (async () => {
        const [res] = await vision.textDetection({
          image: { content: ocrBuffer },
          imageContext: { languageHints: ["en"] },
        });
        return res;
      })();
      const timeout = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("VISION_SDK_TIMEOUT")), 45_000)
      );
      result = await Promise.race([sdkCall, timeout]);
    } catch (e) {
      console.warn(">>> SDK failed, using REST:", (e as Error)?.message);
      result = await visionRestOCR(ocrBuffer);
      console.log(">>> Vision path: REST");
    }

    const text =
      result.fullTextAnnotation?.text ||
      result.textAnnotations?.[0]?.description ||
      "";
    const raw = (text || "").replace(/\s+\n/g, "\n").trim();

    // Title detection
    const lines = raw.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const title = pickTitle(lines, raw);

    // Time parsing via chrono
    const parsed = chrono.parse(raw, new Date(), { forwardDate: true });
    const timeLike = /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i;
    const rangeLike = /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b\s*[-–—]\s*\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i;
    let start: Date | null = null;
    let end: Date | null = null;
    let parsedText: string | null = null;

    if (parsed.length) {
      const score = (r: any): number => {
        const t = (r?.text || "") as string;
        const hasTime = timeLike.test(t);
        const hasRange = rangeLike.test(t);
        const known = r?.start?.knownValues || {};
        let s = 0;
        if (known.month && known.day) s += 6;
        if (known.weekday) s += 1;
        if (hasRange) s += 2;
        if (hasTime) s += 1;
        if (hasTime && !(known.month && known.day) && !known.weekday) s -= 4;
        return s;
      };
      const byPreference = [...parsed].sort((a, b) => score(b as any) - score(a as any));
      const c = byPreference[0];
      start = c.start?.date() ?? null;
      end = c.end?.date() ?? null;
      parsedText = (c as any).text || null;

      const cAny: any = c as any;
      const chosenHasExplicitDate = Boolean(cAny?.start?.knownValues?.month && cAny?.start?.knownValues?.day);
      const chosenHasExplicitTime = typeof cAny?.start?.knownValues?.hour === "number";
      if (start && chosenHasExplicitDate && !chosenHasExplicitTime) {
        const timeOnly = byPreference.find((r: any) => {
          const kv = r?.start?.knownValues || {};
          const hasTime = typeof kv.hour === "number";
          const hasExplicitDate = Boolean(kv.month && kv.day) || Boolean(kv.weekday);
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
          const tEnd: Date | null = (timeOnly.end?.date?.() as Date) || null;
          if (tEnd) {
            const endMerged = new Date(start);
            endMerged.setHours(tEnd.getHours(), tEnd.getMinutes(), 0, 0);
            end = endMerged;
          }
        }
      }
    }

    // Address extraction
    const timeToken = /\b\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)\b/i;
    const hasStreetNumber = /\b\d{1,6}\s+[A-Za-z]/;
    const venueOrSuffix =
      /\b(Auditorium|Center|Hall|Gym|Gymnastics|Park|Room|Suite|Ave(nue)?|St(reet)?|Blvd|Rd|Road|Dr|Drive|Ct|Court|Ln|Lane|Way|Pl|Place|Ter(race)?|Pkwy|Parkway|Hwy|Highway|Boulevard|Street|Avenue)\b/i;

    const lineScores = lines.map((l: string, idx: number) => {
      let score = 0;
      if (timeToken.test(l)) score -= 10;
      if (hasStreetNumber.test(l)) score += 5;
      if (venueOrSuffix.test(l)) score += 3;
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
      const badSegment = /(call|rsvp|tickets?|admission|instagram|facebook|twitter|www\.|\.com|\b(tel|phone)\b)/i;
      const monthName = /(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?)/i;
      const segments = line.split(/\s*[|•·]\s*/).map((s: string) => s.trim()).filter(Boolean);
      let bestSegment = "";
      let segScore = -Infinity;
      for (const s of (segments.length ? segments : [line])) {
        let sc = 0;
        if (badSegment.test(s)) sc -= 10;
        if (monthName.test(s) && !hasStreetNumber.test(s)) sc -= 4;
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
      if (!/\d/.test(addressOnly)) {
        const withNum = lines.find((l: string) => hasStreetNumber.test(l) && !timeToken.test(l));
        if (withNum) addressOnly = withNum.trim();
      }
      addressOnly = cleanAddressLabel(addressOnly);
    }

    // Description cleaning
    const cleanDescription = (() => {
      const normalize = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      const titleWords = normalize(title).split(" ").filter(Boolean);
      const addressNorm = normalize(addressOnly);
      const parsedNorm = parsedText ? normalize(parsedText) : null;
      const genericWords = new Set(["party", "birthday", "event", "celebration"]);
      const allowShortWord = new Set(["usa", "nyc", "bbq", "gym"]);
      const englishishSuffix =
        /(ing|tion|ment|ness|able|ible|less|ful|ship|day|night|house|hall|park|room|center|centre|party|birthday|concert|festival|meeting|reception|ceremony|gala|parade|show)$/i;
      const monthsShort = /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)/i;
      const weekdaysShort = /(mon|tue|tues|wed|thu|thur|fri|sat|sun)/i;

      const looksEnglishWord = (wRaw: string): boolean => {
        const w = (wRaw || "").toLowerCase().replace(/[^a-z]/g, "");
        if (!w) return false;
        if (allowShortWord.has(w)) return true;
        if (monthsShort.test(w) || weekdaysShort.test(w)) return true;
        if (w.length <= 2) return true;
        if (!/[aeiouy]/i.test(w) && w.length >= 3) return false;
        if (englishishSuffix.test(w)) return true;
        if (w.length >= 5) {
          const vowels = (w.match(/[aeiouy]/g) || []).length;
          if (vowels / w.length < 0.25) return false;
        }
        if (/(.)\1{2,}/.test(w)) return false;
        return true;
      };

      const hasEnoughOverlap = (line: string, words: string[]) => {
        if (!words.length) return false;
        const lineWords = normalize(line).split(" ").filter(Boolean);
        if (!lineWords.length) return false;
        let matches = 0;
        for (const w of words) if (lineWords.includes(w)) matches++;
        return matches / words.length >= 0.6 || matches >= Math.min(3, words.length);
      };

      const inviteRe = /\b(you\s+are\s+invited(\s+to)?|you'?re\s+invited(\s+to)?)\b/i;

      const keep: string[] = [];
      for (const line of lines) {
        if (!line) continue;
        const strippedOrig = stripInvitePhrases(line).trim();
        if (!strippedOrig) continue;
        let stripped = strippedOrig.replace(/^(?:st|nd|rd|th)\b[\s\-.,:]*/i, "").trim();
        if (!stripped) continue;

        if (stripped.length <= 2) continue;
        if (/^\d+$/.test(stripped)) continue;
        if (/^[A-Za-z]$/.test(stripped)) continue;
        if (/(^|\s)(ee+|oo+|ll+)(\s|$)/i.test(stripped) && stripped.replace(/\s+/g, "").length <= 3) continue;
        if (inviteRe.test(stripped)) continue;
        if (hasEnoughOverlap(stripped, titleWords)) continue;

        if (/^[A-Za-z]{3,}$/.test(stripped) && stripped.split(/\s+/).length === 1) {
          if (!looksEnglishWord(stripped)) continue;
        }
        const strippedNorm = normalize(stripped);
        if (addressNorm && (strippedNorm.includes(addressNorm) || (strippedNorm.length >= 8 && addressNorm.includes(strippedNorm)))) continue;
        if (parsedNorm && strippedNorm === parsedNorm) continue;

        if (/^[A-Za-z]+$/.test(stripped) && genericWords.has(stripped.toLowerCase())) continue;

        const tokens = stripped.split(/\s+/).filter(Boolean);
        if (tokens.length <= 3) {
          const good = tokens.filter((t) => /\d/.test(t) || looksEnglishWord(t)).length;
          if (good === 0) continue;
        }
        keep.push(stripped);
      }
      return keep.join("\n");
    })();

    // Build final fields
    let finalTitle = title;
    let finalStart = start;
    let finalEnd = end;
    let finalAddress = addressOnly;
    let finalDescription = cleanDescription;

    if (isTitleLowConfidence(finalTitle)) {
      const llm = await llmExtractEvent(raw);
      if (llm) {
        if (llm.title?.trim()) finalTitle = llm.title.trim();
        if (llm.address?.trim()) finalAddress = cleanAddressLabel(llm.address);
        if (llm.description?.trim()) finalDescription = llm.description.trim();
        const safeDate = (s?: string | null) => {
          if (!s) return null;
          const d = new Date(s);
          return isNaN(d.getTime()) ? null : d;
        };
        finalStart = safeDate(llm.start) ?? finalStart;
        finalEnd = safeDate(llm.end) ?? finalEnd;
      }
    }

    const descriptionHasTitle =
      (finalTitle || "").trim().length > 0 &&
      (finalDescription || "").toLowerCase().includes((finalTitle || "").toLowerCase());

    const descriptionWithTitle = descriptionHasTitle
      ? (finalDescription || "")
      : [finalTitle, finalDescription].filter((s) => (s || "").trim().length > 0).join("\n\n");

    const fieldsGuess = {
      title: finalTitle,
      start: finalStart?.toISOString() ?? null,
      end: finalEnd?.toISOString() ?? null,
      location: finalAddress,
      description: descriptionWithTitle,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    };

    // Schedule extraction removed
    const tz = fieldsGuess.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const schedule = { detected: false, homeTeam: null, season: null, games: [] };
    const events: any[] = [];

    // --- Category detection ---
    const detectCategory = (fullText: string, sched: any, guess: any): string | null => {
      try {
        const text = (fullText || "").toLowerCase();
        // Football handling removed
        // Doctor/Dentist/Clinic appointments
        const isDoctorLike = /(doctor|dr\.|dentist|orthodont|clinic|hospital|pediatric|dermatolog|cardiolog|optomet|eye\s+exam)/i.test(fullText);
        const hasAppt = /(appointment|appt)/i.test(fullText);
        if (isDoctorLike && hasAppt) return "Doctor Appointments";
        if (isDoctorLike) return "Doctor Appointments";
        if (hasAppt) return "Appointments";
        // Birthday
        if (/(birthday|b-?day)/i.test(fullText)) return "Birthdays";
        // Sports generic (fallback)
        if (/(schedule|game|vs\.|tournament|league)/i.test(fullText) && /(soccer|basketball|baseball|hockey|volleyball)/i.test(fullText)) {
          return "Sport Events";
        }
      } catch {}
      return null;
    };

    const intakeId: string | null = null;
    const category: string | null = detectCategory(raw, schedule, fieldsGuess);

    return NextResponse.json(
      { intakeId, ocrText: raw, fieldsGuess, schedule, events, category },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "OCR route failed", detail: message }, { status: 500 });
  }
}
