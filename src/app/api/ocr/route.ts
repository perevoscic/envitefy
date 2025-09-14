import { NextResponse } from "next/server";
import * as chrono from "chrono-node";
import sharp from "sharp";
import { getVisionClient } from "@/lib/gcp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { incrementCreditsByEmail } from "@/lib/db";
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
  const user = `OCR TEXT:\n${raw}\n\nExtract fields as JSON with keys: title (string), start (ISO 8601 if possible or null), end (ISO 8601 or null), address (string), description (string).\nRules:\n- Title should be a human-friendly event name without dates, e.g., "+Alice's Birthday Party+" not "+Party December 23rd+".\n- Parse date and time if present; if time missing, leave start null.\n- Keep address concise (street/city/state if present).\n- Description can include RSVP or extra lines.\n- For MEDICAL APPOINTMENT slips (doctor/clinic/hospital/Ascension/Sacred Heart):\n  * DO NOT use DOB/Date of Birth as the event date.\n  * Prefer the labeled lines \"Date\" and \"Time\" near an \"Appointment\" section.\n  * Include patient name, DOB, provider/doctor name, and clinic/facility in description.\n  * If the appointment type is shown (e.g., Annual Visit), use that as the title; otherwise use \'Doctor Appointment\'.\n- Respond with ONLY JSON.`;

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

async function llmExtractEventFromImage(imageBytes: Buffer, mime: string): Promise<{
  title?: string;
  start?: string | null;
  end?: string | null;
  address?: string;
  description?: string;
} | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const base64 = imageBytes.toString("base64");
  const system = "You are a precise assistant that reads event invitations and appointment slips from an image and returns clean JSON fields for calendar creation.";
  const userText =
    "Extract a calendar event as strict JSON {title,start,end,address,description}. Parse spelled-out times like 'four o'clock in the afternoon' and include timezone if visible, otherwise omit. Use ISO 8601 for dates. For MEDICAL APPOINTMENTS (doctor/clinic/hospital/Ascension/Sacred Heart), never use DOB/Date of Birth as the event date; instead, use the labeled 'Date' and 'Time' for the appointment. Put patient name, DOB, provider/doctor, and clinic/facility in description. If an appointment type like 'Annual Visit' exists, use it for title; otherwise use 'Doctor Appointment'.";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "input_image", image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
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

// OpenAI-only extraction for gymnastics season schedules: returns multiple events
async function llmExtractGymnasticsScheduleFromImage(
  imageBytes: Buffer,
  mime: string,
  timezone: string
): Promise<{
  season?: string | null;
  homeTeam?: string | null;
  homeAddress?: string | null;
  events?: Array<{
    title: string;
    start: string; // ISO date or datetime
    end: string; // ISO
    allDay?: boolean;
    timezone?: string;
    location?: string | null;
    description?: string | null;
  }>;
} | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const base64 = imageBytes.toString("base64");
  const system =
    "You read gymnastics season schedule posters and output clean JSON with a list of meets as calendar events. Use visual cues (colors, legends, 'VS' vs 'AT') to determine home vs away. Do not hallucinate dates.";
  const userText =
    "Extract gymnastics season schedule as strict JSON with keys: season (string|nullable), homeTeam (string|nullable), homeAddress (string|nullable if visible), events (array).\nRules: If the poster legend shows colors (e.g., red=HOME, black=AWAY), use that to set home vs away. Also use 'VS' for home and 'AT' for away when present. A trailing '*' means MAC MEETS; include 'MAC Meet' in description when starred.\nFor each event include: title (e.g., 'NIU Gymnastics: vs Central Michigan' or 'NIU Gymnastics: at Bowling Green'), start (ISO date at 00:00 local if time missing), end (ISO date next day for all-day), allDay:true, timezone set to provided TZ, location (home uses homeAddress if visible; away: leave empty if flyer doesn't show), description short (opponent + 'home' or 'away', include 'MAC Meet' when starred). Do not include any extra keys. Dates must include year from the poster heading if present.";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: userText + `\nTIMEZONE: ${timezone}` },
              { type: "input_image", image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const text = j?.choices?.[0]?.message?.content || "";
    if (!text) return null;
    try {
      const parsed = JSON.parse(text) as any;
      const events = Array.isArray(parsed?.events) ? parsed.events : [];
      // Normalize dates to ISO with all-day boundaries when only date provided
      const normalize = (ev: any) => {
        const title = String(ev?.title || "Meet").slice(0, 120);
        const loc = typeof ev?.location === "string" ? ev.location : "";
        const startIso = typeof ev?.start === "string" ? ev.start : null;
        const endIso = typeof ev?.end === "string" ? ev.end : null;
        let s = startIso;
        let e = endIso;
        try {
          if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
            // convert date to all-day UTC boundaries
            s = new Date(`${s}T00:00:00.000Z`).toISOString();
            const d = new Date(s);
            e = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString();
          }
        } catch {}
        return {
          title,
          start: s || new Date().toISOString(),
          end: e || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          allDay: Boolean(ev?.allDay ?? true),
          timezone,
          location: loc,
          description: typeof ev?.description === "string" ? ev.description.slice(0, 600) : "",
        };
      };
      const normalized = events.map(normalize);
      return {
        season: parsed?.season ?? null,
        homeTeam: parsed?.homeTeam ?? null,
        homeAddress: parsed?.homeAddress ?? null,
        events: normalized,
      };
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

// Detect spelled-out time phrases like "four o'clock in the afternoon"
function detectSpelledTime(raw: string): { hour: number; minute: number; meridiem: "am" | "pm" | null } | null {
  const text = (raw || "").toLowerCase();
  const numberMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
  };
  const word = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";
  const oc = "o(?:'|’|`)?clock";
  const mer = "(?:in\\s+the\\s+)?(morning|afternoon|evening|night)";
  // Examples: "four o'clock in the afternoon", "at seven in the evening", "eleven o’clock"
  const re1 = new RegExp(`\\b(${word})\\b(?:\\s+${oc})?(?:\\s+${mer})?`, "i");
  const m = text.match(re1);
  if (!m) return null;
  const numWord = (m[1] || "").toLowerCase();
  const hour = numberMap[numWord];
  if (!hour) return null;
  const meridiemWord = (m[2] || "").toLowerCase();
  let meridiem: "am" | "pm" | null = null;
  if (meridiemWord) {
    if (/(afternoon|evening|night)/i.test(meridiemWord)) meridiem = "pm";
    if (/morning/i.test(meridiemWord)) meridiem = "am";
  }
  return { hour, minute: 0, meridiem };
}

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

// When the flyer has a standalone line "Join us for", enrich it with the
// birthday person's name if the title contains a possessive (e.g., "Livia’s"),
// and append a short venue label (e.g., "at US Gold Gymnastics") when available.
function improveJoinUsFor(description: string, title: string, location?: string): string {
  try {
    const lines = (description || "").split("\n").map((l) => l.trim()).filter(Boolean);
    const joinIdx = lines.findIndex((l) => /^join\s+us\s+for\s*$/i.test(l));
    if (joinIdx === -1) return description;

    const possessiveMatch = (title || "").match(/\b([A-Z][A-Za-z\-]+(?:\s+[A-Z][A-Za-z\-]+){0,2})[’']s\b/);
    if (!possessiveMatch) return description;

    const namePossessive = possessiveMatch[0];
    const nextIsBirthdayParty = !!lines[joinIdx + 1] && /\bbirthday\s*party\b/i.test(lines[joinIdx + 1]);
    // Try to pick a concise venue label either from provided location or nearby lines
    const venueKeywords = /\b(Arena|Center|Hall|Gym|Gymnastics|Park|Room|Studio|Lanes|Bowl|Skate|Club|Bar|Cafe|Restaurant|Brewery|Church|School|Community|Auditorium|Ballroom)\b/i;
    const timeToken = /\b\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?)\b/i;
    let usedVenueIdx: number | null = null;
    let venue: string = "";
    // 1) From location/address argument
    try {
      const loc = cleanAddressLabel(String(location || "")).split(",")[0].trim();
      if (loc && !/\d/.test(loc) && venueKeywords.test(loc)) venue = loc;
    } catch {}
    // 2) From nearby lines on the flyer description
    if (!venue) {
      const candidates: Array<{ idx: number; text: string }> = [];
      const consider = (idx: number) => {
        const s = lines[idx];
        if (!s) return;
        const t = cleanAddressLabel(s);
        if (!t || /\d/.test(t) || timeToken.test(t)) return;
        if (venueKeywords.test(t)) candidates.push({ idx, text: t });
      };
      // Prefer the line after "Birthday Party" if present, else immediate neighbors
      if (nextIsBirthdayParty) consider(joinIdx + 2);
      consider(joinIdx + 1);
      consider(joinIdx + 3);
      consider(joinIdx - 1);
      if (candidates.length) {
        const pick = candidates[0];
        venue = pick.text;
        usedVenueIdx = pick.idx;
      }
    }

    const replacement = `Join us for ${namePossessive}${nextIsBirthdayParty ? " Birthday Party" : ""}${venue ? ` at ${venue}` : ""}`
      .replace(/\s+/g, " ")
      .trim();

    lines[joinIdx] = replacement;
    if (nextIsBirthdayParty) lines.splice(joinIdx + 1, 1);
    if (usedVenueIdx !== null) {
      // Adjust for previous splice if we removed the Birthday Party line
      const adjustedIdx = usedVenueIdx > joinIdx && nextIsBirthdayParty ? usedVenueIdx - 1 : usedVenueIdx;
      if (adjustedIdx >= 0 && adjustedIdx < lines.length && lines[adjustedIdx] && /\b(birthday\s*party)\b/i.test(replacement)) {
        // Remove the venue line we inlined to avoid duplication
        lines.splice(adjustedIdx, 1);
      }
    }
    return lines.join("\n");
  } catch {
    return description;
  }
}

// Rewrite birthday descriptions into a single friendly sentence via LLM.
// Returns null on failure or when the feature is disabled (no OPENAI_API_KEY).
async function llmRewriteBirthdayDescription(
  title: string,
  location: string,
  description: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const system =
    "You rewrite short event notes into one friendly invitation sentence for a calendar description. Output plain text only (no JSON), one sentence, under 160 characters.";
  // Give the model explicit guidance so it standardizes the sentence while adapting to available fields
  const user =
    `TITLE: ${title || ""}\nLOCATION: ${location || ""}\nNOTES: ${description || ""}\n\n` +
    "Task: If this event is a birthday party, write ONE human-friendly sentence using this template when possible: 'Please, join us for <Name>'s Birthday Party at <Location>'. " +
    "Rules: If the location is missing, omit the 'at …' clause. Use proper capitalization and a straight apostrophe. Do not include dates, times, or RSVP details. Return only the sentence.";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json().catch(() => null);
    const text = (j?.choices?.[0]?.message?.content || "").trim();
    if (!text) return null;
    return text.replace(/\s+/g, " ").trim();
  } catch {
    return null;
  }
}

// Produce clean wedding title and description using the OCR text.
// Returns null on failure; otherwise returns a tuple [title, description].
async function llmRewriteWedding(
  rawText: string,
  title: string,
  location: string
): Promise<{ title: string; description: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const system =
    "You rewrite wedding invitation copy into a clean calendar title and a short, friendly description. Output strict JSON only.";
  const user =
    `OCR TEXT:\n${rawText}\n\n` +
    "Task: Detect the couple's full names (proper case, not all caps) and write:\n" +
    "- title: 'Wedding Celebration of <Name A> & <Name B>' (no date/time in title).\n" +
    "- description: one or two sentences like: '<Name A> & <Name B> invite you to join their wedding celebration together with their parents <time phrase if present>. Dinner and dancing to follow' and, if a venue or address is available, append 'at <venue or address>' to the end.\n" +
    "Rules: Use names from the text; keep casing normal (capitalize names only); do not repeat dates; prefer the natural time phrase from the text like 'at four o'clock in the afternoon' when it exists; maximum description 300 chars.\n" +
    `KNOWN LOCATION (optional): ${location || ""}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json().catch(() => null);
    const text = j?.choices?.[0]?.message?.content || "";
    if (!text) return null;
    const parsed = JSON.parse(text);
    const t = String(parsed?.title || "").trim();
    const d = String(parsed?.description || "").trim();
    if (!t || !d) return null;
    return { title: t.slice(0, 120), description: d.slice(0, 600) };
  } catch {
    return null;
  }
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
    const url = new URL(request.url);
    const forceLLM = url.searchParams.get("llm") === "1" || url.searchParams.get("engine") === "openai";
    const gymOnly = url.searchParams.get("gym") === "1" || url.searchParams.get("sport") === "gymnastics";
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

    // Prefer explicit medical Appointment Date/Time labels over DOB when detected
    const isMedical = /(doctor|dr\.|dentist|clinic|hospital|ascension|sacred\s*heart)/i.test(raw) && /(appointment|appt)/i.test(raw);
    let medicalStart: Date | null = null;
    let medicalParsedText: string | null = null;
    if (isMedical) {
      let apptDateStr: string | null = null;
      let apptTimeStr: string | null = null;
      const dobM = raw.match(/\b(dob|date\s*of\s*birth)[:#\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const dobStr = dobM?.[2] || null;
      // Labeled same-line patterns
      const dateLM = raw.match(/\b(appointment\s*date|appt\s*date|date)\b[:#\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const timeLM = raw.match(/\b(appointment\s*time|time)\b[:#\-]?\s*(\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?))/i);
      apptDateStr = (dateLM?.[2] || null);
      apptTimeStr = (timeLM?.[2] || null);
      // Two-line label followed by value
      if (!apptDateStr || (dobStr && apptDateStr === dobStr)) {
        for (let i = 0; i < lines.length - 1; i++) {
          if (/^\s*(appointment\s*date|appt\s*date|date)\s*:?\s*$/i.test(lines[i])) {
            const next = lines[i + 1];
            const m = next.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/);
            if (m) { apptDateStr = m[0]; break; }
          }
        }
      }
      if (!apptTimeStr) {
        for (let i = 0; i < lines.length - 1; i++) {
          if (/^\s*(appointment\s*time|time)\s*:?\s*$/i.test(lines[i])) {
            const next = lines[i + 1];
            const m = next.match(/\b\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?)\b/i);
            if (m) { apptTimeStr = m[0]; break; }
          }
        }
      }
      if (apptDateStr) {
        const [mm, dd, yy] = apptDateStr.split(/[\/\-]/).map((x) => x.trim());
        const year = Number(yy.length === 2 ? (Number(yy) + 2000) : yy);
        const month = Number(mm) - 1;
        const day = Number(dd);
        let hours = 9;
        let minutes = 0;
        if (apptTimeStr) {
          const tm = apptTimeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
          if (tm) {
            hours = Number(tm[1]);
            minutes = Number(tm[2] || 0);
            const mer = (tm[3] || "").toLowerCase();
            if (mer.includes("p") && hours < 12) hours += 12;
            if (mer.includes("a") && hours === 12) hours = 0;
          }
        }
        medicalStart = new Date(year, month, day, hours, minutes, 0, 0);
        medicalParsedText = `${apptDateStr}${apptTimeStr ? " " + apptTimeStr : ""}`;
      }
    }

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
      // Penalize obvious DOB matches (Date of Birth) so they are not selected as the event date
      const looksLikeDob = (t: string) => /\b(dob|date\s*of\s*birth)\b/i.test(t);
      const byPreference = [...parsed].sort((a, b) => {
        const sa = score(a as any) - (looksLikeDob((a as any).text || "") ? 10 : 0);
        const sb = score(b as any) - (looksLikeDob((b as any).text || "") ? 10 : 0);
        return sb - sa;
      });
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

    // Spelled-out time fallback (e.g., "four o'clock in the afternoon")
    if (start && !medicalStart) {
      const spelled = detectSpelledTime(raw);
      if (spelled) {
        const hasAfternoon = /\bafternoon\b/i.test(raw);
        const hasEvening = /\b(evening|night)\b/i.test(raw);
        const hasMorning = /\bmorning\b/i.test(raw);
        let hour24 = spelled.hour % 12;
        if (spelled.meridiem === "pm") hour24 += 12;
        if (spelled.meridiem === null) {
          if (hasAfternoon || hasEvening) {
            hour24 += 12;
          } else if (!hasMorning && /(wedding|ceremony|reception)/i.test(raw) && hour24 >= 1 && hour24 <= 6) {
            hour24 += 12;
          }
        }
        const merged = new Date(start);
        merged.setHours(hour24, spelled.minute, 0, 0);
        start = merged;
      }
    }
    // If we detected explicit medical appointment Date/Time, prefer it over other parses
    if (medicalStart) {
      start = medicalStart;
      end = null;
      parsedText = medicalParsedText;
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
    // Medical-specific: prefer Dept./Address block when present
    if (isMedical) {
      const idx = lines.findIndex((l: string) => /^(dept\.?\s*\/\s*address|department\s*\/\s*address|dept\.?\s*\/?\s*address|dept\.?\s*\/\s*adr(?:ess)?)$/i.test(l));
      if (idx >= 0) {
        const block = [lines[idx + 1], lines[idx + 2], lines[idx + 3]].filter(Boolean) as string[];
        const hasStreetNo = /\b\d{1,6}\s+[A-Za-z]/;
        const cityStateZip = /\b[A-Za-z\.'\s]+,\s*[A-Z]{2}\s+\d{5}\b/;
        const pick = block.find((s) => hasStreetNo.test(s) || cityStateZip.test(s));
        if (pick) addressOnly = pick.trim();
      }
    }
    if (locIdx >= 0 && bestScore > 0 && !addressOnly) {
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

        // Skip standalone time-like tokens (e.g., "3:30", "3:30PM") and score-like "1-0"/"1:0"
        if (/^\d{1,2}([:\.]\d{1,2})\s*(a\.?m\.?|p\.?m\.?)?$/i.test(stripped)) continue;
        if (/^\d+\s*[:\-]\s*\d+$/.test(stripped)) continue;

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
      // Surface key medical fields if present: patient, DOB, provider, facility
      try {
        const full = lines.join("\n");
        const patientMatch = full.match(/\bpatient\s*(name|id)?[:#\-]?\s*([A-Z][A-Za-z'\-]+\s+[A-Z][A-Za-z'\-]+)\b/i);
        const dobMatch = full.match(/\b(dob|date\s*of\s*birth)[:#\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        const providerMatch = full.match(/\b(dr\.?|doctor)\s*([A-Z][A-Za-z\s\-']+)|\bprovider[:#\-]?\s*([A-Z][A-Za-z\s\-']+)/i);
        const facilityMatch = full.match(/\b(ascension|sacred\s*heart|medical\s+group|clinic|hospital)[^\n]*\b/iu);
        const extras: string[] = [];
        if (patientMatch) extras.push(`Patient: ${(patientMatch[2] || "").trim()}`);
        if (dobMatch) extras.push(`DOB: ${(dobMatch[2] || "").trim()}`);
        const provider = (providerMatch?.[2] || providerMatch?.[3] || "").trim();
        if (provider) extras.push(`Provider: ${provider}`);
        if (facilityMatch) extras.push(`Facility: ${facilityMatch[0].trim()}`);
        if (extras.length) return [keep.join("\n"), extras.join(" | ")].filter(Boolean).join("\n\n");
      } catch {}
      return keep.join("\n");
    })();

    // Optional LLM-from-image extraction
    let llmImage: any = null;
    if (forceLLM) {
      try {
        llmImage = await llmExtractEventFromImage(ocrBuffer, mime || "application/octet-stream");
      } catch {}
    }

    // Build final fields
    let finalTitle = title;
    let finalStart = start;
    let finalEnd = end;
    let finalAddress = addressOnly;
    let finalDescription = cleanDescription;

    if (llmImage) {
      const safeDate = (s?: string | null) => {
        if (!s) return null;
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      };
      if (typeof llmImage.title === "string" && llmImage.title.trim()) finalTitle = llmImage.title.trim();
      if (typeof llmImage.address === "string" && llmImage.address.trim()) finalAddress = cleanAddressLabel(llmImage.address);
      if (typeof llmImage.description === "string" && llmImage.description.trim()) finalDescription = llmImage.description.trim();
      finalStart = safeDate(llmImage.start) ?? finalStart;
      finalEnd = safeDate(llmImage.end) ?? finalEnd;
    }

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

    // For medical slips, force title to "<Appointment Type> with Dr <Name>" when possible,
    // and keep notes minimal (just the title line)
    if (/(appointment|appt)/i.test(raw) && /(doctor|dr\.|clinic|hospital|ascension|sacred\s*heart)/i.test(raw)) {
      // 1) Try to read appointment reason near the "Appointment" label
      const appIdx = lines.findIndex((l: string) => /^\s*appointment\s*$/i.test(l));
      let reasonLine: string | null = null;
      if (appIdx >= 0) {
        reasonLine = lines[appIdx + 1] || null;
      }
      // 2) Fallback regexes for common reasons
      const reasonMatch = (raw.match(/\b(annual\s+visit|annual\s+physical|follow\s*-?\s*up|new\s*patient(\s*visit)?|consult(ation)?|check\s*-?\s*up|well(ness)?\s*visit|routine\s*(exam|visit|check(\s*-?\s*up)?))\b/i) || [])[0];
      let apptTypeRaw = (reasonLine && reasonLine.trim()) || reasonMatch || "Doctor Appointment";
      // Clean trailing codes (e.g., "Annual Visit 20")
      apptTypeRaw = apptTypeRaw.replace(/\b\d+\b/g, "").replace(/\s{2,}/g, " ").trim();
      const apptType = apptTypeRaw;

      // Provider detection:
      // a) Prefixed with Dr./Doctor
      let provider: string | null = null;
      const provA = raw.match(/\b(?:dr\.?\s*|doctor\s+)([A-Z][A-Za-z\-']+(?:\s+[A-Z][A-Za-z\-']+)*)\b/);
      if (provA) provider = (provA[1] || "").trim();
      // b) NAME , MD|DO|NP... (uppercase or titlecase)
      if (!provider) {
        const provB = raw.match(/\b([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+){1,4})\s*,\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C|FNP|ARNP|CNM|DDS|DMD)\b/i);
        if (provB) provider = (provB[1] || "").trim();
      }
      // c) The line immediately after reason (often provider)
      if (!provider && reasonLine) {
        const cand = (lines[appIdx + 2] || "").trim();
        if (/^[A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+){1,4}(\s*,\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C))?$/i.test(cand)) provider = cand.replace(/\s*,\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C)$/i, "").trim();
      }

      // Title-case helper
      const toTitle = (s: string) => s.replace(/\s+/g, " ").trim().replace(/\b\w/g, (m: string) => m.toUpperCase());
      if (provider) finalTitle = `${toTitle(apptType)} with Dr ${toTitle(provider)}`;
      else finalTitle = toTitle(apptType);
      // Notes should be just the title to avoid clutter as requested
      finalDescription = finalTitle;
    }

    // Enrich generic "Join us for" line with the birthday person's name from title
    finalDescription = improveJoinUsFor(finalDescription, finalTitle, finalAddress);

    // If this looks like a birthday, let the LLM rewrite the description into a single polite sentence
    if (/(birthday|b-?day)/i.test(raw) || /(birthday)/i.test(finalTitle)) {
      try {
        const rewritten = await llmRewriteBirthdayDescription(finalTitle, finalAddress, finalDescription);
        if (rewritten && rewritten.length >= 20) {
          finalDescription = rewritten.slice(0, 300);
        }
      } catch {}
    }

    // If this looks like a wedding invite, produce a clean title and short human sentence
    if (/(wedding|bride|groom|ceremony|reception)/i.test(raw) || /wedding/i.test(finalTitle)) {
      try {
        const wr = await llmRewriteWedding(raw, finalTitle, finalAddress);
        if (wr?.title) finalTitle = wr.title;
        if (wr?.description) finalDescription = wr.description;
      } catch {}
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

    // ---------------- Gymnastics schedule extraction ----------------
    const tz = fieldsGuess.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const schedule = { detected: false as boolean, homeTeam: null as string | null, season: null as string | null, games: [] as any[] };
    let events: any[] = [];

    const monthMap: Record<string, number> = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };

    const hasGymnasticsSchedule = /gymnastics/i.test(raw) && /schedule/i.test(raw);
    if (hasGymnasticsSchedule && (gymOnly || forceLLM)) {
      // OpenAI-exclusive path for gymnastics schedules
      const llmSched = await llmExtractGymnasticsScheduleFromImage(ocrBuffer, mime || "application/octet-stream", tz);
      if (llmSched && Array.isArray(llmSched.events) && llmSched.events.length) {
        schedule.detected = true;
        schedule.homeTeam = (llmSched.homeTeam as any) || schedule.homeTeam;
        schedule.season = (llmSched.season as any) || schedule.season;

        // Minimal geocode helper for away meets when location missing
        const geocode = async (query: string): Promise<string | null> => {
          try {
            const ac = new AbortController();
            const timer = setTimeout(() => ac.abort(), 2500);
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
            const r = await fetch(url, {
              headers: { "Accept-Language": "en", "User-Agent": "snapmydate/1.0 (+https://snapmydate.app)" },
              signal: ac.signal,
            });
            clearTimeout(timer);
            const j: any[] = await r.json().catch(() => []);
            const top = Array.isArray(j) && j.length ? j[0] : null;
            return top?.display_name || null;
          } catch {
            return null;
          }
        };

        const homeAddress = (llmSched.homeAddress as any) || "";
        const filled: any[] = [];
        for (const rawEv of llmSched.events) {
          let ev = { ...rawEv } as any;
          const t = String(ev.title || "");
          const isAway = /\bat\b/i.test(t) && !/\bvs\.?\b/i.test(t);
          if (!ev.location) {
            if (!isAway) {
              if (homeAddress) ev.location = homeAddress;
            } else {
              // Try to infer opponent from title after 'at'
              const m = t.split(/\bat\b/i)[1];
              const opponent = m ? m.replace(/\*/g, "").trim() : "";
              if (opponent) {
                const addr = await geocode(`${opponent} gymnastics`);
                if (addr) ev.location = addr;
              }
            }
          }
          filled.push({ ...ev, category: "Sport Events" });
        }
        events = filled;
      }
    } else if (hasGymnasticsSchedule) {
      schedule.detected = true;

      // Try to capture the season year (e.g., 2026) if present near header
      const yearMatch = raw.match(/\b(20\d{2})\b.*?gymnastics.*?schedule/i) || raw.match(/gymnastics.*?schedule.*?\b(20\d{2})\b/i);
      const season = yearMatch ? yearMatch[1] : null;
      schedule.season = season;

      // Heuristic home team from top-most large acronym or title
      const acr = lines.find((l: string) => /^[A-Z]{2,6}$/.test(l.trim())) || null;
      schedule.homeTeam = acr;

      // Collapse lines into date-led blocks
      const monthRe = /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i;
      const dateStartRe = new RegExp(`^\\s*${monthRe.source}\\s*\\b(\\d{1,2})\\b`, "i");

      type Block = { month: string; day: number; text: string };
      const blocks: Block[] = [];
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const m = l.match(dateStartRe);
        if (m) {
          const month = (m[1] || m[0]).toLowerCase();
          const day = Number(m[2] || m[1]);
          let text = l;
          // join subsequent lines until next date-start or blank separator
          let j = i + 1;
          while (j < lines.length && !dateStartRe.test(lines[j])) {
            const s = lines[j];
            // stop at obvious footer legend
            if (/home\b|away\b|mac\s*meets?/i.test(s)) break;
            if (/^\s*$/.test(s)) break;
            text += "\n" + s;
            j++;
          }
          i = j - 1;
          blocks.push({ month, day, text });
        }
      }

      // Opponent parsing: detect at/vs and list of opponents
      const normalizeOpponents = (s: string): { homeAway: "home" | "away"; opponents: string[]; label: string } | null => {
        const t = s.replace(/\s+/g, " ").trim();
        let homeAway: "home" | "away" | null = null;
        let label = t;
        if (/\bvs\b|\bvs\.\b/i.test(t)) {
          homeAway = "home";
          label = t.replace(/.*?\bvs\.?\s*/i, "");
        } else if (/\bat\b/i.test(t)) {
          homeAway = "away";
          label = t.replace(/.*?\bat\s*/i, "");
        }
        if (!homeAway) return null;
        const cleaned = label
          .replace(/\*(?:\s|$)/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
        // Split multiple opponents if separated by newlines or obvious delimiters
        const opponents = cleaned
          .split(/[\n|•·]/)
          .join(" ")
          .split(/\s{2,}|\s{1}(?=[A-Z]{2,}(?:\s|$))/)
          .join(" ")
          .split(/\s{2,}/)
          .filter(Boolean);
        // Fallback: further split by separators
        const dedup = Array.from(new Set(cleaned.split(/[,/]|\s{2,}|\s{1}\u00B7\s{1}/).map((x) => x.trim()).filter(Boolean)));
        const finalOpponents = opponents.length >= 1 ? [cleaned] : dedup;
        return { homeAway, opponents: finalOpponents.length ? finalOpponents : [cleaned], label: cleaned };
      };

      // Optional away geocode using Nominatim with tight timeout
      const geocode = async (query: string): Promise<{ label: string; confidence: number } | null> => {
        try {
          const ac = new AbortController();
          const timer = setTimeout(() => ac.abort(), 2500);
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
          const r = await fetch(url, {
            headers: { "Accept-Language": "en", "User-Agent": "snapmydate/1.0 (+https://snapmydate.app)" },
            signal: ac.signal,
          });
          clearTimeout(timer);
          const j: any[] = await r.json().catch(() => []);
          const top = Array.isArray(j) && j.length ? j[0] : null;
          if (!top) return null;
          const disp = (top.display_name as string) || "";
          return { label: disp, confidence: 0.6 };
        } catch {
          return null;
        }
      };

      for (const b of blocks) {
        // Determine at/vs line inside block
        const linesIn = b.text.split("\n").map((x) => x.trim()).filter(Boolean);
        const main = linesIn.find((x) => /\b(vs\.?|at)\b/i.test(x)) || linesIn[0];
        const opp = normalizeOpponents(main || "");
        if (!opp) continue;

        // Build date
        const mKey = (b.month || "").toLowerCase();
        const monthIndex = monthMap[mKey];
        if (typeof monthIndex !== "number") continue;
        const nowYear = new Date().getFullYear();
        const seasonYear = season ? Number(season) : nowYear;
        let year = seasonYear;
        // If month is Jan/Feb/Mar and season likely spans academic year, keep seasonYear
        const dateLocal = new Date(Date.UTC(year, monthIndex, b.day, 0, 0, 0));

        // Times are usually not on schedule images; mark as all-day
        const startISO = new Date(dateLocal).toISOString().slice(0, 10);
        const endISO = new Date(Date.UTC(year, monthIndex, b.day + 1, 0, 0, 0)).toISOString().slice(0, 10);

        // Location: home uses detected address; away attempts geocode
        let location = "";
        let locationNote = "";
        if (opp.homeAway === "home") {
          location = finalAddress || fieldsGuess.location || "";
          if (!location) locationNote = "Home meet — address missing";
        } else {
          const q = `${opp.opponents[0]} gymnastics arena`;
          const g = await geocode(q);
          if (g?.label) location = g.label;
          if (!location) locationNote = `Away meet at ${opp.opponents[0]}`;
        }

        const prettyOpp = opp.label.replace(/\s{2,}/g, " ");
        const evTitle = `${schedule.homeTeam ? schedule.homeTeam + " " : ""}Gymnastics: ${opp.homeAway === "home" ? "vs" : "at"} ${prettyOpp}`.trim();

        // Push both schedule game (semantic) and normalized event
        schedule.games.push({
          date: { month: monthIndex + 1, day: b.day, year },
          opponent: prettyOpp,
          home: opp.homeAway === "home",
        });

        events.push({
          title: evTitle,
          start: startISO + "T00:00:00.000Z",
          end: endISO + "T00:00:00.000Z",
          allDay: true,
          timezone: tz,
          location,
          description: [evTitle, locationNote].filter(Boolean).join("\n"),
          category: "Sport Events",
        });
      }
    }

    // --- Category detection ---
    const detectCategory = (fullText: string, sched: any, guess: any): string | null => {
      try {
        const text = (fullText || "").toLowerCase();
        // Football handling removed
        // Doctor/Dentist/Clinic appointments
        const isDoctorLike = /(doctor|dr\.|dentist|orthodont|clinic|hospital|pediatric|dermatolog|cardiolog|optomet|eye\s+exam|ascension|sacred\s*heart)/i.test(fullText);
        const hasAppt = /(appointment|appt)/i.test(fullText);
        if (isDoctorLike && hasAppt) return "Doctor Appointments";
        if (isDoctorLike) return "Doctor Appointments";
        if (hasAppt) return "Appointments";
        // Birthday
        if (/(birthday|b-?day)/i.test(fullText)) return "Birthdays";
        // Weddings
        if (/(wedding|ceremony|reception|bride|groom|nupti(al)?|bridal)/i.test(fullText)) return "Weddings";
        // Sports generic (fallback)
        if (/(schedule|game|vs\.|tournament|league)/i.test(fullText) && /(soccer|basketball|baseball|hockey|volleyball)/i.test(fullText)) {
          return "Sport Events";
        }
      } catch {}
      return null;
    };

    const intakeId: string | null = null;
    const category: string | null = detectCategory(raw, schedule, fieldsGuess);

    try {
      const session = await getServerSession(authOptions);
      const email = session?.user?.email as string | undefined;
      if (email) await incrementCreditsByEmail(email, -1);
    } catch {}

    return NextResponse.json(
      { intakeId, ocrText: raw, fieldsGuess, schedule, events, category },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "OCR route failed", detail: message }, { status: 500 });
  }
}
