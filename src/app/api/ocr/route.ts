import { NextResponse } from "next/server";
import * as chrono from "chrono-node";
import sharp from "sharp";
import { getVisionClient } from "@/lib/gcp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { incrementCreditsByEmail, incrementUserScanCounters } from "@/lib/db";
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
  if (/^(party|birthday|event|celebration|invitation|invitation\s*card)$/i.test(t)) return true;
  if (/\b\d{1,2}(st|nd|rd|th)\b$/i.test(t)) return true;
  return false;
}

async function llmExtractEvent(raw: string): Promise<{
  title?: string;
  start?: string | null;
  end?: string | null;
  address?: string;
  description?: string;
  rsvp?: string | null;
} | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-4o";
  const system = "You extract calendar events from noisy OCR text. For medical/dental appointments, use ONLY clinical factual language - NEVER invitation phrases like 'Please join us', 'You're invited'. Return strict JSON only.";
  const user = `OCR TEXT:\n${raw}\n\nExtract fields as JSON with keys: title (string), start (ISO 8601 if possible or null), end (ISO 8601 or null), address (string), description (string), rsvp (string or null).\nRules:\n- For invitations, ignore boilerplate like 'Invitation', 'Invitation Card', 'You're invited'. Prefer a specific human title such as '<Name>'s Birthday Party' or '<Name> & <Name> Wedding'.\n- Parse dates and times; also handle spelled-out time phrases like 'four o'clock in the afternoon'.\n- Keep address concise (street/city/state if present).\n- CRITICAL: Extract RSVP contact info into the 'rsvp' field. Look for patterns like 'RSVP <Name> <Phone>', 'RSVP: <Name> <Phone>', 'RSVP to <Name> <Phone/Email>'. Format as 'RSVP: <Name> <Phone>' or 'RSVP: <Email>'. Examples: 'RSVP: Jennifer 555-895-9741', 'RSVP: contact@example.com'. Return null if no RSVP info found.\n- Description should NOT include RSVP contact info (it goes in the separate rsvp field).\n- For MEDICAL/DENTAL APPOINTMENTS (doctor/dentist/dental cleaning/clinic/hospital/Ascension/Sacred Heart):\n  * DO NOT use DOB/Date of Birth as the event date.\n  * Prefer the labeled lines 'Appointment Date' and 'Appointment Time'.\n  * Title: Extract the exact appointment type visible on the image (e.g., 'Dental Cleaning', 'Annual Visit').\n  * Description: Read the image and extract ONLY the clinical information that is actually visible. Include only what you see: appointment type, provider name (if shown), facility/location (if shown), time, or other relevant details. DO NOT use a template. DO NOT include patient name or DOB. DO NOT invent information. CRITICAL: This is a MEDICAL/DENTAL appointment, NOT a social event. NEVER EVER write invitation phrases like 'Please join us for', 'You're invited to', 'Join us', 'please', 'welcome'. These are medical appointments, not parties. WRONG: 'Please join us for a Dental Cleaning on...'. CORRECT: 'Dental cleaning appointment.' or 'Scheduled for October 6, 2023 at 10:30 AM.'. Write naturally based on what's visible, each fact on its own line. Be strictly factual and clinical.\n- Respond with ONLY JSON.`;

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
  category?: string;
  rsvp?: string | null;
  yearVisible?: boolean | null;
} | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(">>> OpenAI API key not found in environment");
    return null;
  }
  console.log(">>> OpenAI API key found:", apiKey ? `${apiKey.substring(0, 10)}...` : "missing");
  const model = process.env.LLM_MODEL || "gpt-4o";
  console.log(">>> Using OpenAI model:", model);
  const base64 = imageBytes.toString("base64");
  const system =
    "You are a careful assistant that reads invitations and appointment slips from images. You transcribe ALL text accurately including decorative cursive, handwritten notes, and printed labels. CRITICAL: For medical/dental appointment cards, use ONLY clinical, factual language. NEVER use invitation phrases like 'Please join us', 'You're invited', 'Join us' for medical appointments. These are appointments, not social events. Carefully read the handwritten appointment type (e.g., 'Dental Cleaning', 'Annual Visit'). Return only clean JSON fields for calendar creation.";
  const todayIso = new Date().toISOString().slice(0, 10);
  const userText =
    [
      "Task: From the image, extract a single calendar event as strict JSON with keys {title,start,end,address,description,category,rsvp}.",
      "General rules:",
      "- Read ornate/cursive fonts carefully (names often appear in large script).",
      "- Treat boilerplate headers like 'Invitation', 'Invitation Card', 'You're Invited' as NOT the title.",
      "- Build a specific, human title without dates, e.g., '<Name> & <Name> Wedding' or " +
        "'<Name>'s Birthday Party'.",
      "- Parse spelled-out times such as 'four o'clock in the afternoon' and combine with any nearby date text.",
      "- Copy the exact hour/minute markers from the flyer (e.g., '7 p.m.' -> 19:00, '7:00 PM' -> 19:00). Never invent a time or flip AM/PM—only output a time when the flyer clearly shows it.",
      "- Before finalizing, double-check that the chosen time matches the flyer; if uncertain, leave the time off (set start to the date at 00:00).",
      "- Use ISO 8601 for start/end when possible. If only a date is present, set start to that date at 00:00 and leave end null.",
      "- Keep address concise (street, city, state). Remove leading labels like 'Venue:', 'Address:', 'Location:'.",
      "- CRITICAL RSVP RULE: Extract RSVP contact information into the 'rsvp' field. Look for patterns like 'RSVP <Name> <Phone>', 'RSVP: <Name> <Phone>', 'RSVP to <Name> at <Phone/Email>'. Format as 'RSVP: <Name> <Phone>' or 'RSVP: <Email>'. Examples: 'RSVP: Jennifer 555-895-9741', 'RSVP: Sarah Jones 212-555-1234', 'RSVP: contact@example.com'. Return null if no RSVP info visible.",
      "- Description should NOT include RSVP contact info (it goes in the separate rsvp field).",
      "- category should be one of: Weddings, Birthdays, Baby Showers, Bridal Showers, Engagements, Anniversaries, Graduations, Religious Events, Doctor Appointments, Appointments, Sport Events, General Events.",
      `- Today's date is ${todayIso}. If the flyer does NOT display the event year, choose the next occurrence on or after today and set start accordingly. Do NOT reuse a past year like 2023 unless the flyer explicitly shows it.`,
      "- Add a boolean field yearVisible. Set yearVisible=true only when the flyer explicitly prints a 4-digit year next to the event date. When the year is missing and you infer it, set yearVisible=false.",
      "Special cases — MEDICAL/DENTAL APPOINTMENTS (doctor/dentist/dental cleaning/clinic/hospital): never use DOB/Date of Birth as the event date; instead use the labeled 'Appointment Date/Time'. Title: Extract the exact appointment type visible on the image (e.g., 'Dental Cleaning', 'Annual Visit'). For description, read the image carefully and extract ONLY the clinical information that is actually visible. Include only what you see: appointment type, provider name (if shown), facility/location (if shown), time, or other relevant details. DO NOT use a template. DO NOT include patient name or DOB. DO NOT invent information. CRITICAL: This is a medical/dental appointment, NOT a social event. NEVER EVER write invitation-style descriptions like 'Please join us for a Dental Cleaning' or 'You're invited to'. These are MEDICAL appointments, not parties. WRONG examples: 'Please join us for a Dental Cleaning on...', 'You're invited to a dental cleaning appointment...'. CORRECT examples: 'Dental cleaning appointment.', 'Scheduled for October 6, 2023 at 10:30 AM.'. Write naturally based on the actual visible content, each fact on its own line. Be strictly factual and clinical.",
    ].join("\n");
  try {
    console.log(">>> Making OpenAI Vision API call...");
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
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
      }),
    });
    console.log(">>> OpenAI API response status:", res.status);
    if (!res.ok) {
      const errorBody = await res.text();
      console.error(">>> OpenAI API error:", { status: res.status, body: errorBody });
      return null;
    }
    const j: any = await res.json();
    console.log(">>> OpenAI API response received");
    const text = j?.choices?.[0]?.message?.content || "";
    if (!text) {
      console.warn(">>> OpenAI returned no content");
      return null;
    }
    try {
      const parsed = JSON.parse(text) as any;
      console.log(">>> OpenAI extracted data:", parsed);
      return parsed;
    } catch (parseErr) {
      console.error(">>> Failed to parse OpenAI JSON:", parseErr, "Raw:", text);
      return null;
    }
  } catch (err) {
    console.error(">>> OpenAI Vision API exception:", err);
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
  const model = process.env.LLM_MODEL || "gpt-4o";
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

type PracticeScheduleLLMGroup = {
  name?: string;
  note?: string | null;
  sessions?: Array<{
    day?: string;
    startTime?: string;
    endTime?: string;
    note?: string | null;
  }>;
};

type PracticeScheduleLLMResponse = {
  title?: string | null;
  timeframe?: string | null;
  timezoneHint?: string | null;
  groups?: PracticeScheduleLLMGroup[];
};

async function llmExtractPracticeScheduleFromImage(
  imageBytes: Buffer,
  mime: string,
  timezone: string
): Promise<PracticeScheduleLLMResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-4o";
  const base64 = imageBytes.toString("base64");
  const system =
    "You read team practice schedules laid out as tables (groups vs. days) and return clean JSON describing weekly recurring sessions.";
  const userText =
    [
      "Extract the practice schedule as strict JSON with keys: title (string|null), timeframe (string|null), timezoneHint (string|null), groups (array).",
      "Each group object must have: name (string), optional note, sessions (array).",
      "Each session must include: day (three-letter uppercase code MON/TUE/WED/THU/FRI/SAT/SUN), startTime (HH:MM 24-hour), endTime (HH:MM 24-hour), optional note (string).",
      "Rules:",
      "- Ignore cells that only say OFF/Closed." ,
      "- If a cell contains text like '4:15-6:00 rec', parse startTime=04:15, endTime=06:00, note='rec'.",
      "- Preserve trailing labels such as 'team gym' or 'conditioning' in the session note (lowercase).",
      "- If a column header or legend indicates the season (e.g., '2025-2026 School Year'), set timeframe to that exact text.",
      "- If a headline names the gym/team, set title accordingly (e.g., 'Team Practice Schedule').",
      "- timezoneHint may include any location or timezone clues shown on the flyer; otherwise null.",
      "Return strict JSON only; omit any keys with unknown values by setting them to null." ,
    ].join("\n");

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
              { type: "text", text: userText + `\nTIMEZONE_GUESS: ${timezone}` },
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
      return JSON.parse(text) as PracticeScheduleLLMResponse;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

const DAY_NAME_TO_INDEX: Record<string, { index: number; code: string }> = {
  sunday: { index: 0, code: "SU" },
  sun: { index: 0, code: "SU" },
  mon: { index: 1, code: "MO" },
  monday: { index: 1, code: "MO" },
  tue: { index: 2, code: "TU" },
  tues: { index: 2, code: "TU" },
  tuesday: { index: 2, code: "TU" },
  wed: { index: 3, code: "WE" },
  weds: { index: 3, code: "WE" },
  wednesday: { index: 3, code: "WE" },
  thu: { index: 4, code: "TH" },
  thur: { index: 4, code: "TH" },
  thurs: { index: 4, code: "TH" },
  thursday: { index: 4, code: "TH" },
  fri: { index: 5, code: "FR" },
  friday: { index: 5, code: "FR" },
  sat: { index: 6, code: "SA" },
  saturday: { index: 6, code: "SA" },
};

function parseDayCode(day?: string | null): { index: number; code: string } | null {
  if (!day) return null;
  const key = day.trim().toLowerCase();
  if ((DAY_NAME_TO_INDEX as any)[key]) return DAY_NAME_TO_INDEX[key];
  const short = key.slice(0, 3);
  if ((DAY_NAME_TO_INDEX as any)[short]) return DAY_NAME_TO_INDEX[short];
  const upper = day.trim().toUpperCase();
  switch (upper) {
    case "MON":
      return DAY_NAME_TO_INDEX.mon;
    case "TUE":
    case "TUES":
      return DAY_NAME_TO_INDEX.tue;
    case "WED":
      return DAY_NAME_TO_INDEX.wed;
    case "THU":
    case "THUR":
    case "THURS":
      return DAY_NAME_TO_INDEX.thu;
    case "FRI":
      return DAY_NAME_TO_INDEX.fri;
    case "SAT":
      return DAY_NAME_TO_INDEX.sat;
    case "SUN":
      return DAY_NAME_TO_INDEX.sun;
  }
  return null;
}

function parseTimeTo24h(value?: string | null): { hour: number; minute: number } | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const twelveHour = trimmed.match(
    /^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?$/i
  );
  if (twelveHour) {
    let hour = Number(twelveHour[1]);
    const minute = Number(twelveHour[2] || "0");
    const mer = (twelveHour[3] || "").toLowerCase();
    if (mer.includes("p") && hour < 12) hour += 12;
    if (mer.includes("a") && hour === 12) hour = 0;
    return { hour: hour % 24, minute: minute % 60 };
  }
  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    const minute = Number(twentyFour[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
      return { hour, minute };
  }
  return null;
}

function parseTimeRange(text?: string | null): {
  start?: { hour: number; minute: number } | null;
  end?: { hour: number; minute: number } | null;
} {
  if (!text) return { start: null, end: null };
  const cleaned = text.replace(/–|—/g, "-");
  const rangeMatch = cleaned.match(/(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?)[^\d]{1,4}(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?)/i);
  if (rangeMatch) {
    const start = parseTimeTo24h(rangeMatch[1]);
    const end = parseTimeTo24h(rangeMatch[2]);
    return { start, end };
  }
  return { start: parseTimeTo24h(cleaned), end: null };
}

function getLocalNowInTimezone(tz: string): Date {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const obj: Record<string, string> = {};
    for (const p of parts) if (p.type !== "literal") obj[p.type] = p.value;
    return new Date(
      Number(obj.year || now.getFullYear()),
      Number(obj.month || now.getMonth() + 1) - 1,
      Number(obj.day || now.getDate()),
      Number(obj.hour || now.getHours()),
      Number(obj.minute || now.getMinutes()),
      Number(obj.second || now.getSeconds())
    );
  } catch {
    return new Date(now);
  }
}

function toLocalFloatingISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function buildNextOccurrence(
  baseTz: string,
  dayIndex: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): { start: string; end: string } {
  const nowLocal = getLocalNowInTimezone(baseTz);
  const currentDay = nowLocal.getDay();
  let delta = (dayIndex - currentDay + 7) % 7;
  const startDate = new Date(nowLocal);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() + delta);
  startDate.setHours(startHour, startMinute, 0, 0);
  if (delta === 0 && startDate <= nowLocal) {
    startDate.setDate(startDate.getDate() + 7);
  }
  const endDate = new Date(startDate);
  endDate.setHours(endHour, endMinute, 0, 0);
  if (endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  return { start: toLocalFloatingISO(startDate), end: toLocalFloatingISO(endDate) };
}

function normalizeDayToken(rawToken: string): string {
  return rawToken.toLowerCase().replace(/[^a-z]/g, "");
}

function isDayToken(rawToken: string): boolean {
  return Boolean(DAY_NAME_TO_INDEX[normalizeDayToken(rawToken)]);
}

function isOffToken(value: string): boolean {
  const lower = value.toLowerCase();
  return /\boff\b|closed|rest/i.test(lower);
}

function looksLikeGroupName(line: string): boolean {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isDayToken(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  if (isOffToken(lower)) return false;
  if (/schedule|calendar|mon\b|tue\b|wed\b|thu\b|fri\b|sat\b|sun\b/i.test(lower)) return false;
  if (/\d/.test(trimmed) && !/(level|group|team|squad|class|academy|session)/i.test(lower)) {
    // Numbers without a known keyword are likely times, not group names
    return false;
  }
  // Time ranges or standalone times should not be treated as group names
  if (/\d{1,2}\s*[:\-]/.test(trimmed)) return false;
  return /[A-Za-z]/.test(trimmed);
}

function isValueNoteLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isDayToken(trimmed)) return false;
  if (looksLikeGroupName(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  if (/^off$/i.test(trimmed)) return true;
  if (/\d/.test(trimmed)) return true;
  if (/rec|conditioning|gym|team|practice|train|session|open|meet/i.test(lower)) return true;
  return false;
}

function parsePracticeTimeRange(value: string): {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  note: string | null;
} | null {
  const lower = value.toLowerCase().trim();
  if (!lower) return null;
  if (isOffToken(lower)) return null;

  const normalized = lower.replace(/\s+/g, " ");
  const noteParts: string[] = [];
  let timePart = normalized;
  const noteMatch = normalized.match(/(?:\d|:|am|pm|\s|-)+\s*(.*)$/i);
  if (noteMatch && noteMatch[1]) {
    const remainder = noteMatch[1].trim();
    if (remainder && !/^(?:am|pm)$/i.test(remainder)) {
      noteParts.push(remainder);
      timePart = normalized.slice(0, noteMatch.index! + noteMatch[0].length - remainder.length).trim();
    }
  }

  const range = timePart.match(
    /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?/
  );
  if (!range) {
    const single = timePart.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?/);
    if (!single) return null;
    const startHourRaw = Number(single[1]);
    const startMinuteRaw = Number(single[2] || 0);
    const mer = (single[3] || "").toLowerCase();
    const { hour: startHour, minute: startMinute } = convertTo24Hour(
      startHourRaw,
      startMinuteRaw,
      mer || null
    );
    const end = new Date(0, 0, 0, startHour, startMinute + 90);
    return {
      startHour,
      startMinute,
      endHour: end.getHours(),
      endMinute: end.getMinutes(),
      note: noteParts.length ? noteParts.join(" ") : null,
    };
  }

  const startHourRaw = Number(range[1]);
  const startMinuteRaw = Number(range[2] || 0);
  const startMer = (range[3] || "").toLowerCase();
  const endHourRaw = Number(range[4]);
  const endMinuteRaw = Number(range[5] || 0);
  const endMer = (range[6] || "").toLowerCase();

  const { hour: startHour, minute: startMinute } = convertTo24Hour(
    startHourRaw,
    startMinuteRaw,
    startMer || null
  );
  const { hour: endHour, minute: endMinute } = convertTo24Hour(
    endHourRaw,
    endMinuteRaw,
    endMer || null,
    startHour
  );

  return {
    startHour,
    startMinute,
    endHour,
    endMinute,
    note: noteParts.length ? noteParts.join(" ") : null,
  };
}

function convertTo24Hour(
  hour: number,
  minute: number,
  meridiem: string | null,
  fallbackCompareHour?: number
): { hour: number; minute: number } {
  let h = hour % 12;
  if (meridiem) {
    if (/p/.test(meridiem) && h < 12) h += 12;
    if (/a/.test(meridiem) && hour === 12) h = 0;
  } else {
    if (typeof fallbackCompareHour === "number") {
      if (fallbackCompareHour >= 12 && hour < 12 && hour <= 7) {
        h += 12;
      }
    } else if (hour <= 7) {
      h += 12;
    }
  }
  return { hour: h, minute };
}

type PracticeHeuristicGroup = {
  name: string;
  note: string | null;
  values: Array<{ label: string; note: string | null }>;
};

function parsePracticeScheduleHeuristics(
  lines: string[],
  timezone: string
): {
  title: string | null;
  timeframe: string | null;
  groups: Array<{
    name: string;
    note: string | null;
    sessions: Array<{
      day: string;
      display: string;
      hasPractice: boolean;
      start?: string;
      end?: string;
      startTime?: string;
      endTime?: string;
      note: string | null;
    }>;
    events: any[];
  }>;
} | null {
  const normalizedLines = lines.map((l) => l.trim()).filter(Boolean);
  if (!normalizedLines.length) return null;

  let headerStart = -1;
  let headerEnd = -1;
  const dayOrder: string[] = [];
  for (let i = 0; i < normalizedLines.length; i++) {
    const token = normalizedLines[i];
    if (isDayToken(token)) {
      if (dayOrder.length === 0) headerStart = i;
      const mapKey = normalizeDayToken(token);
      const code = DAY_NAME_TO_INDEX[mapKey]?.code;
      if (code && dayOrder[dayOrder.length - 1] !== code) {
        dayOrder.push(code);
      }
    } else if (dayOrder.length) {
      headerEnd = i - 1;
      break;
    }
  }

  if (dayOrder.length < 3) return null;
  if (headerEnd < headerStart) headerEnd = headerStart + dayOrder.length - 1;

  const groups: PracticeHeuristicGroup[] = [];
  const groupKeywords = /(group|level|team|squad|class|crew|cohort|practice)/i;

  const collectValue = (startIdx: number): { value: string; consumed: number } => {
    let combined = normalizedLines[startIdx];
    let consumed = 1;
    let idx = startIdx + 1;
    while (idx < normalizedLines.length) {
      const next = normalizedLines[idx];
      if (!next) {
        idx++;
        consumed++;
        continue;
      }
      if (isDayToken(next)) break;
      if (looksLikeGroupName(next) && groupKeywords.test(next.toLowerCase())) break;
      if (/\d{1,2}:\d{2}/.test(next) && /\d{1,2}:\d{2}/.test(combined)) break;
      if (/\boff\b/i.test(next) && /\boff\b/i.test(combined)) {
        combined = "OFF";
        idx++;
        consumed++;
        continue;
      }
      if (!/\d/.test(next)) {
        combined = `${combined} ${next}`.trim();
        idx++;
        consumed++;
        continue;
      }
      break;
    }
    return { value: combined.trim(), consumed };
  };

  let idx = headerEnd + 1;
  while (idx < normalizedLines.length) {
    const token = normalizedLines[idx];
    if (!token) {
      idx++;
      continue;
    }
    if (isDayToken(token)) {
      idx++;
      continue;
    }
    if (!looksLikeGroupName(token) && !groupKeywords.test(token.toLowerCase())) {
      idx++;
      continue;
    }

    const groupName = token.trim();
    idx++;
    const values: Array<{ label: string; note: string | null }> = [];
    for (let dayIdx = 0; dayIdx < dayOrder.length && idx < normalizedLines.length; ) {
      const candidate = normalizedLines[idx];
      if (!candidate) {
        idx++;
        continue;
      }
      if (looksLikeGroupName(candidate) && groupKeywords.test(candidate.toLowerCase()) && values.length === 0) {
        break;
      }
      if (isDayToken(candidate)) {
        idx++;
        continue;
      }
      const { value, consumed } = collectValue(idx);
      idx += consumed;
      const noteMatch = value.match(/(.*?)(?:\s+(rec|conditioning|team gym|team\s+gym|open gym|weights))$/i);
      let label = value;
      let note: string | null = null;
      if (noteMatch && noteMatch[2]) {
        label = noteMatch[1].trim();
        note = noteMatch[2].trim();
      }
      values.push({ label: label || "OFF", note });
      dayIdx++;
    }
    if (!values.length) continue;
    groups.push({ name: groupName, note: null, values });
  }

  if (!groups.length) return null;

  const practiceTimezone = timezone;
  const builtGroups = groups.map((group) => {
    const sessions: Array<{
      day: string;
      display: string;
      hasPractice: boolean;
      start?: string;
      end?: string;
      startTime?: string;
      endTime?: string;
      note: string | null;
    }> = [];
    const events: any[] = [];

    group.values.forEach((entry, idxValue) => {
      const dayCode = dayOrder[idxValue] || dayOrder[0];
      const parsed = parsePracticeTimeRange(entry.label);
      if (!parsed) {
        sessions.push({
          day: dayCode,
          display: `${dayCode} ${entry.label}`.trim(),
          hasPractice: false,
          note: entry.note,
        });
        return;
      }
      const dayInfo = DAY_NAME_TO_INDEX[normalizeDayToken(dayCode)] || { index: idxValue, code: dayCode };
      const occurrence = buildNextOccurrence(
        practiceTimezone,
        dayInfo.index,
        parsed.startHour,
        parsed.startMinute,
        parsed.endHour,
        parsed.endMinute
      );
      const pad = (n: number) => String(n).padStart(2, "0");
      sessions.push({
        day: dayCode,
        display: `${dayCode} ${pad(parsed.startHour)}:${pad(parsed.startMinute)}-${pad(parsed.endHour)}:${pad(parsed.endMinute)}`,
        hasPractice: true,
        start: occurrence.start,
        end: occurrence.end,
        startTime: `${pad(parsed.startHour)}:${pad(parsed.startMinute)}`,
        endTime: `${pad(parsed.endHour)}:${pad(parsed.endMinute)}`,
        note: entry.note || parsed.note,
      });
      const descriptionParts = [group.name];
      descriptionParts.push(`${dayCode} ${pad(parsed.startHour)}:${pad(parsed.startMinute)}-${pad(parsed.endHour)}:${pad(parsed.endMinute)}`);
      if (entry.note || parsed.note) descriptionParts.push(entry.note || parsed.note || "");
      events.push({
        title: `${group.name} Practice`,
        start: occurrence.start,
        end: occurrence.end,
        allDay: false,
        timezone: practiceTimezone,
        location: "",
        description: descriptionParts.filter(Boolean).join(" · "),
        recurrence: `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
        reminders: [{ minutes: 1440 }],
        category: "Sport Events",
      });
    });

    return {
      name: group.name,
      note: group.note,
      sessions,
      events,
    };
  });

  return {
    title: normalizedLines.find((l) => /schedule/i.test(l)) || null,
    timeframe: normalizedLines.find((l) => /\d{4}\s*-\s*\d{4}/.test(l)) || null,
    groups: builtGroups,
  };
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

// Lightweight U.S. timezone guesser from address text (best-effort, no network)
function inferTimezoneFromAddress(addressOrText: string): string | null {
  const s = (addressOrText || "").toLowerCase();
  const has = (...parts: string[]) => parts.some((p) => s.includes(p.toLowerCase()));
  // Direct city hints
  if (has("fresno", "los angeles", "san francisco", "san jose", "sacramento", "oakland", "san diego")) return "America/Los_Angeles";
  if (has("phoenix", "mesa", "tucson", "az ", " arizona")) return "America/Phoenix";
  if (has("seattle", "spokane", "wa ", " washington")) return "America/Los_Angeles";
  if (has("portland", "or ", " oregon")) return "America/Los_Angeles";
  if (has("boise", "id ", " idaho")) return "America/Boise";
  if (has("denver", "co ", " colorado", "ut ", " utah", "nm ", " new mexico", "mt ", " montana", "wy ", " wyoming")) return "America/Denver";
  if (has("chicago", "il ", " illinois", "wi ", " wisconsin", "mn ", " minnesota", "ia ", " iowa", "mo ", " missouri", "ok ", " oklahoma", "ks ", " kansas", "ne ", " nebraska", "tx ", " texas", "la ", " louisiana", "ar ", " arkansas", "tn ", " tennessee")) return "America/Chicago";
  if (has("new york", "ny ", "nyc", "fl ", " florida", "ga ", " georgia", "nc ", " north carolina", "sc ", " south carolina", "pa ", " pennsylvania", "nj ", " new jersey", "oh ", " ohio", "mi ", " michigan", "va ", " virginia", "dc", "washington, dc", "ma ", " massachusetts", "ct ", " connecticut")) return "America/New_York";
  if (has("anchorage", "ak ", " alaska")) return "America/Anchorage";
  if (has("honolulu", "hi ", " hawaii")) return "Pacific/Honolulu";
  // State-only heuristics
  if (has(" ca ", " california")) return "America/Los_Angeles";
  if (has(" wa ", " washington")) return "America/Los_Angeles";
  if (has(" or ", " oregon")) return "America/Los_Angeles";
  if (has(" nv ", " nevada")) return "America/Los_Angeles";
  if (has(" az ", " arizona")) return "America/Phoenix";
  if (has(" co ", " colorado", " ut ", " utah", " nm ", " new mexico", " mt ", " montana", " wy ", " wyoming", " id ", " idaho")) return "America/Denver";
  if (has(" il ", " illinois", " wi ", " wisconsin", " mn ", " minnesota", " ia ", " iowa", " mo ", " missouri", " ok ", " oklahoma", " ks ", " kansas", " ne ", " nebraska", " la ", " louisiana", " ar ", " arkansas", " tx ", " texas")) return "America/Chicago";
  if (has(" ny ", " new york", " nj ", " new jersey", " pa ", " pennsylvania", " oh ", " ohio", " mi ", " michigan", " ga ", " georgia", " fl ", " florida", " ma ", " massachusetts", " ct ", " connecticut", " dc")) return "America/New_York";
  return null;
}

function stripInvitePhrases(s: string): string {
  return s
    .replace(/^\s*(you\s+are\s+invited\s+to[:\s-]*)/i, "")
    .replace(/^\s*(you'?re\s+invited\s+to[:\s-]*)/i, "")
    .replace(/^\s*(you\s+are\s+invited[:\s-]*)/i, "")
    .replace(/^\s*(you'?re\s+invited[:\s-]*)/i, "")
    .replace(/^\s*(please\s+)?join\s+us\s*(for)?[:\s,\-]*/i, "")
    .trim();
}

function stripJoinUsLanguage(description: string): string {
  if (!description) return description;
  const cleanedLines = description
    .split("\n")
    .map((line) => stripInvitePhrases(line))
    .map((line) => line.replace(/^\s*(please\s+)?join\s+us\s*(for)?[:\s,\-]*/i, ""))
    .map((line) => line.replace(/^\s*(let's\s+)?celebrate\s+with\s+us[:\s,\-]*/i, ""))
    .map((line) => line.trim())
    .filter((line, idx, arr) => line.length > 0 || (idx < arr.length - 1 && arr[idx + 1].length > 0));
  return cleanedLines.join("\n");
}

// When the flyer has a standalone line "Join us for", enrich it with the
// birthday person's name if the title contains a possessive (e.g., "Livia’s"),
// and append a short venue label (e.g., "at US Gold Gymnastics") when available.
// The rewrite avoids invitation phrasing like "Join us" in the final output.
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

    const replacement = `Celebrating ${namePossessive}${nextIsBirthdayParty ? " Birthday Party" : ""}${venue ? ` at ${venue}` : ""}`
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

// Pick a short human venue label for sentences like
// "<Name>'s Birthday Party at <Venue>".
// Prefers a business/venue name over a numeric street address.
function pickVenueLabelForSentence(
  location?: string,
  description?: string,
  rawText?: string
): string {
  try {
    const venueKeywords = /\b(Arena|Center|Hall|Gym|Gymnastics|Park|Room|Studio|Lanes|Bowl|Skate|Club|Cafe|Restaurant|Brewery|Church|School|Community|Auditorium|Ballroom|Course|Playground|Aquatic|Aquarium|Zoo|Museum|Stadium|Field|Court|Theater|Theatre)\b/i;
    // 1) Use a non-numeric first segment of the provided location if it looks like a venue
    if (location) {
      const first = cleanAddressLabel(String(location)).split(",")[0].trim();
      if (first && (!/\d/.test(first) || venueKeywords.test(first))) return first;
    }
    // 2) Try to extract from description text around an "at <Venue>" phrase
    const lineWithAt = (description || "")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /\bat\s+[^\d].{2,}/i.test(l));
    if (lineWithAt) {
      const m = lineWithAt.match(/\bat\s+([^,.\n]+?)(?:\s*[,.]|$)/i);
      const cand = (m?.[1] || "").replace(/\s{2,}/g, " ").trim();
      if (cand && (!/\d/.test(cand) || venueKeywords.test(cand))) return cand;
    }
    // 3) As a fallback, scan raw OCR text for prominent venue-like lines
    if (rawText) {
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines) {
        if (line.length < 4 || line.length > 80) continue;
        if (!venueKeywords.test(line)) continue;
        const alphaCount = line.replace(/[^A-Za-z\s]/g, "").length;
        if (alphaCount / line.length < 0.6) continue;
        return line.replace(/\s{2,}/g, " ");
      }
    }
  } catch {}
  return "";
}

function buildFriendlyBirthdaySentence(title: string, location?: string): string {
  const extractPossessive = (t: string): string | null => {
    const m = (t || "").match(/\b([A-Z][A-Za-z\-]+(?:\s+[A-Z][A-Za-z\-]+){0,2})[’']s\b/);
    if (m && m[1]) return `${m[1]}'s`;
    const first = (t || "").match(/\b([A-Z][A-Za-z\-]+)\b/);
    return first ? `${first[1]}'s` : null;
  };
  const who = extractPossessive(title) || "Our";
  const venue = (location || "").trim();
  const atPart = venue ? ` at ${venue}` : "";
  return `${who} Birthday Party${atPart}.`;
}

// Extract a compact RSVP string from raw OCR/description text, e.g.,
// "RSVP: Veronica 850-960-1214". Returns null when not found.
function extractRsvpCompact(rawText: string, fallbackText?: string): string | null {
  try {
    const text = [rawText || "", fallbackText || ""].join("\n");
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const phoneRe = /(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/;
    // Prefer explicit RSVP line
    const rsvpLine = lines.find((l) => /\brsvp\b/i.test(l));
    if (rsvpLine) {
      const nameMatch = rsvpLine.match(/rsvp[^a-z0-9]*to\s+([^,|]+?)(?:\s+at|\s*[-:,.]|$)/i);
      const phoneMatch = rsvpLine.match(phoneRe);
      const name = (nameMatch?.[1] || "").replace(/\s{2,}/g, " ").trim();
      if (name && phoneMatch) return `RSVP: ${name} ${phoneMatch[0]}`.trim();
      if (phoneMatch) return `RSVP: ${phoneMatch[0]}`;
    }
    // Otherwise, scan any line that has a phone + contact verb
    for (const l of lines) {
      const phone = l.match(phoneRe)?.[0] || null;
      if (!phone) continue;
      if (/\b(call|text|contact|rsvp)\b/i.test(l)) {
        const name = (l.match(/\bwith\s+([A-Z][A-Za-z'\-]+)\b/i)?.[1]
          || l.match(/\bto\s+([A-Z][A-Za-z'\-]+)\b/i)?.[1]
          || "").trim();
        return `RSVP: ${name ? name + " " : ""}${phone}`.trim();
      }
    }
    return null;
  } catch {
    return null;
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
    "Task: If this is a birthday party, write ONE friendly sentence like: '<Name>'s Birthday Party at <Location>'. " +
    "Rules: Prefer a concise venue/business name (e.g., 'US Gold Gymnastics') over a street address. If LOCATION looks like a street address (has numbers) but NOTES include a venue name, use the venue name. If no location is known, omit the 'at …' clause. Avoid phrases such as 'Join us' or 'You're invited'. Use proper capitalization and a straight apostrophe. Do not include dates, times, or RSVP details. Return only the sentence.";

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
    "You rewrite wedding invitation copy into a clean calendar title and a short description using ONLY facts present in the image text. Output strict JSON only.";
  const user =
    `OCR TEXT:\n${rawText}\n\n` +
    "Task: Detect the couple's full names (proper case, not all caps) and write:\n" +
    "- title: 'Wedding Celebration of <Name A> & <Name B>' (no date/time in title).\n" +
    "- description: ONE concise sentence using only information explicitly present in the text: couple names, venue/address (if present), and time (only if present). Do not invent or add template phrases. Include 'together with their parents' ONLY if that exact phrase appears. If the time is numeric (e.g., 17:00 or 5:00 PM), use a compact 'at 5:00 PM' style; if a spelled-out phrase like 'five o'clock in the afternoon' appears verbatim, you may keep it as-is. If time is missing, omit it. Do not add filler like 'Dinner and dancing to follow'.\n" +
    "Rules: Use names from the text; keep natural casing (capitalize names only); never fabricate details; maximum description 200 characters.\n" +
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
    let d = String(parsed?.description || "").trim();
    // Guard against templated hallucinations not in the original text
    const rawLower = (rawText || "").toLowerCase();
    if (!/parents?/i.test(rawLower)) {
      d = d.replace(/\s*together with their parents\s*/i, " ").replace(/\s{2,}/g, " ").trim();
    }
    if (!t || !d) return null;
    return { title: t.slice(0, 120), description: d.slice(0, 600) };
  } catch {
    return null;
  }
}

// Generic one-line description rewriter for any flyer type.
// Uses raw OCR text + current fields to produce a compact, human sentence.
async function llmRewriteSmartDescription(
  rawText: string,
  title: string,
  location: string,
  category: string | null,
  baseline: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const system =
    "You summarize event flyers into ONE friendly calendar sentence, using only facts present. Output plain text only, single line, under 160 characters.";
  const user =
    `OCR TEXT:\n${rawText}\n\n` +
    `TITLE: ${title || ""}\n` +
    `CATEGORY: ${category || ""}\n` +
    `LOCATION: ${location || ""}\n` +
    `BASELINE: ${baseline || ""}\n\n` +
    "Rules: Prefer venue/business names over street addresses. Skip RSVP/phone/email/URLs/prices. Don't invent times or places. Keep it natural and concise. Use a straightforward style like '<Team> vs <Team> at <Venue>', 'Don't miss …', or a simple declarative sentence. Avoid phrases like 'Join us' or 'You're invited'. Return only the sentence.";

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
    const text = (j?.choices?.[0]?.message?.content || "").replace(/\s+/g, " ").trim();
    if (!text) return null;
    if (text.length > 200) return null;
    // Ensure one sentence ending
    return /\.$/.test(text) ? text : `${text}.`;
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
  const badHints = /(invitation(\s*card)?|rsvp|admission|tickets|door(s)? open|free entry|age|call|visit|www\.|\.com|\b(am|pm)\b|\b\d{1,2}[:\.]?\d{0,2}\b)/i;
  const goodHints = /(birthday|party|anniversary|wedding|marriage|nupti(al)?|concert|festival|meet(ing|up)|ceremony|reception|gala|fundraiser|show|conference|appointment|open\s*house|celebration)/i;
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

    // =============================================================================
    // STEP 1: Try OpenAI Vision FIRST (PRIMARY OCR)
    // =============================================================================
    let llmImage: any = null;
    let raw = "";
    let ocrSource = "none";
    let openAiSucceeded = false;
    
    try {
      console.log(">>> OCR: Trying OpenAI Vision (primary)...");
      llmImage = await llmExtractEventFromImage(ocrBuffer, mime || "application/octet-stream");
      if (llmImage) {
        const parts: string[] = [];
        if (typeof llmImage.title === "string" && llmImage.title.trim()) parts.push(llmImage.title.trim());
        if (typeof llmImage.start === "string" && llmImage.start.trim()) parts.push(llmImage.start.trim());
        if (typeof llmImage.end === "string" && llmImage.end.trim()) parts.push(llmImage.end.trim());
        if (typeof llmImage.address === "string" && llmImage.address.trim()) parts.push(llmImage.address.trim());
        if (typeof llmImage.description === "string" && llmImage.description.trim())
          parts.push(llmImage.description.trim());
        if (typeof llmImage.rsvp === "string" && llmImage.rsvp.trim()) parts.push(llmImage.rsvp.trim());

        if (parts.length) {
          // OpenAI produced meaningful data; treat this as the authoritative OCR result.
          console.log(">>> OCR: OpenAI Vision succeeded ✓");
          raw = parts.join("\n");
          ocrSource = "openai";
          openAiSucceeded = true;
        } else {
          console.warn(">>> OCR: OpenAI returned an object without usable fields", llmImage);
        }
      } else {
        console.warn(">>> OCR: OpenAI returned empty/null result:", llmImage);
      }
    } catch (e) {
      console.error(">>> OCR: OpenAI Vision failed with error:", e);
      console.error(">>> Error details:", {
        message: (e as Error)?.message,
        stack: (e as Error)?.stack,
        fullError: e
      });
    }

    // =============================================================================
    // STEP 2: Fallback to Google Vision if OpenAI failed
    // =============================================================================
    if (!openAiSucceeded) {
      llmImage = null; // avoid mixing Google fallback with partial OpenAI fields
      console.log(">>> OCR: Falling back to Google Vision...");
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
        console.log(">>> OCR: Google Vision SDK succeeded ✓");
        ocrSource = "google-sdk";
      } catch (e) {
        console.warn(">>> Google Vision SDK failed, using REST:", (e as Error)?.message);
        result = await visionRestOCR(ocrBuffer);
        console.log(">>> OCR: Google Vision REST succeeded ✓");
        ocrSource = "google-rest";
      }

      const text =
        result.fullTextAnnotation?.text ||
        result.textAnnotations?.[0]?.description ||
        "";
      raw = (text || "").replace(/\s+\n/g, "\n").trim();
    }

    // Title detection
    const lines = raw.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const title = pickTitle(lines, raw);

    // Time parsing via chrono
    const parsed = chrono.parse(raw, new Date(), { forwardDate: true });
    const timeLike = /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i;
    const rangeLike = /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b\s*[-–—]\s*\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i;
    let start: Date | null = null;
    let end: Date | null = null;
    let startHasClockTime = false; // track if a time-of-day is present
    let parsedText: string | null = null;

    // Prefer explicit medical/dental Appointment Date/Time labels over DOB when detected
    const isMedical = /(doctor|dr\.|dentist|dental|clinic|hospital|ascension|sacred\s*heart)/i.test(raw) && /(appointment|appt)/i.test(raw);
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
      if (chosenHasExplicitTime) startHasClockTime = true;
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
          startHasClockTime = true;
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
        startHasClockTime = true;
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

    // Build final fields (llmImage already populated from primary OCR step)
    // Extract compact RSVP early so LLM can override it
    let deferredRsvp: string | null = null;
    
    // If OpenAI Vision was the primary source, prioritize its results
    let finalTitle = title;
    let finalStart = start;
    let finalEnd = end;
    let finalAddress = addressOnly;
    let finalDescription = cleanDescription;

    if (ocrSource === "openai" && llmImage) {
      // OpenAI was primary - use its results directly, fall back to heuristics only if missing
      const safeDate = (s?: string | null) => {
        if (!s) return null;
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      };
      
      finalTitle = (typeof llmImage.title === "string" && llmImage.title.trim()) ? llmImage.title.trim() : title;
      finalAddress = (typeof llmImage.address === "string" && llmImage.address.trim()) ? cleanAddressLabel(llmImage.address) : addressOnly;
      finalDescription = (typeof llmImage.description === "string" && llmImage.description.trim()) ? llmImage.description.trim() : cleanDescription;
      finalStart = safeDate(llmImage.start) ?? start;
      finalEnd = safeDate(llmImage.end) ?? end;
      
      // RSVP from OpenAI (most reliable)
      if (typeof llmImage.rsvp === "string" && llmImage.rsvp.trim()) {
        deferredRsvp = llmImage.rsvp.trim();
      } else {
        // Fallback to heuristic extraction
        try {
          deferredRsvp = extractRsvpCompact(raw, finalDescription);
        } catch {}
      }
    } else {
      // Google Vision was primary - extract RSVP from raw text
      try {
        deferredRsvp = extractRsvpCompact(raw, cleanDescription);
      } catch {}
    }

    if (isTitleLowConfidence(finalTitle)) {
      const llm = await llmExtractEvent(raw);
      if (llm) {
        if (llm.title?.trim()) finalTitle = llm.title.trim();
        if (llm.address?.trim()) finalAddress = cleanAddressLabel(llm.address);
        if (llm.description?.trim()) finalDescription = llm.description.trim();
        if (llm.rsvp?.trim()) deferredRsvp = llm.rsvp.trim();
        const safeDate = (s?: string | null) => {
          if (!s) return null;
          const d = new Date(s);
          return isNaN(d.getTime()) ? null : d;
        };
        finalStart = safeDate(llm.start) ?? finalStart;
        finalEnd = safeDate(llm.end) ?? finalEnd;
      }
    }

    const isMedicalAppointment =
      /(appointment|appt)/i.test(raw) && /(doctor|dr\.|dentist|dental|clinic|hospital|ascension|sacred\s*heart)/i.test(raw);

    // For medical slips, force title to "<Appointment Type> with Dr <Name>" when possible,
    // and keep notes minimal (just the title line)
    if (isMedicalAppointment) {
      // If OpenAI already provided a well-formatted description, preserve it
      const openAIHasProvider = ocrSource === "openai" && finalDescription && /Provider:.*Dr/i.test(finalDescription);
      // 1) Try to read appointment reason near the "Appointment" label
      const appIdx = lines.findIndex((l: string) => /^\s*appointment\s*$/i.test(l));
      let reasonLine: string | null = null;
      if (appIdx >= 0) {
        reasonLine = lines[appIdx + 1] || null;
      }
      // 2) Fallback regexes for common reasons (including dental)
      const reasonMatch = (raw.match(/\b(dental\s+cleaning|teeth\s+cleaning|annual\s+visit|annual\s+physical|follow\s*-?\s*up|new\s*patient(\s*visit)?|consult(ation)?|check\s*-?\s*up|well(ness)?\s*visit|routine\s*(exam|visit|check(\s*-?\s*up)?)|cleaning)\b/i) || [])[0];
      let apptTypeRaw = (reasonLine && reasonLine.trim()) || reasonMatch || "Doctor Appointment";
      // Clean trailing codes (e.g., "Annual Visit 20")
      apptTypeRaw = apptTypeRaw.replace(/\b\d+\b/g, "").replace(/\s{2,}/g, " ").trim();
      const apptType = apptTypeRaw;

      // Provider detection (enhanced for hyphenated and multi-part names):
      let provider: string | null = null;
      
      // a) Prefixed with Dr./Doctor (handles hyphenated last names like Parris-Ramie)
      const provA = raw.match(/\b(?:dr\.?\s*|doctor\s+)([A-Z][A-Za-z\-']+(?:\s+[A-Z][A-Za-z\-']+)*(?:\s*-\s*[A-Z][A-Za-z]+)?)\b/i);
      if (provA) provider = (provA[1] || "").trim();
      
      // b) "Provider:" or "Physician:" label followed by name
      if (!provider) {
        const provLabel = raw.match(/(?:Provider|Physician|Doctor):\s*([A-Z][A-Za-z\-'\s]+(?:-[A-Z][A-Za-z]+)?)/i);
        if (provLabel) provider = (provLabel[1] || "").replace(/\s*,?\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C|FNP|ARNP|CNM|DDS|DMD).*/i, "").trim();
      }
      
      // c) NAME , MD|DO|NP... (uppercase or titlecase, handles hyphens)
      if (!provider) {
        const provB = raw.match(/\b([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+){1,4})\s*,\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C|FNP|ARNP|CNM|DDS|DMD)\b/i);
        if (provB) provider = (provB[1] || "").trim();
      }
      
      // d) The line immediately after reason (often provider)
      if (!provider && reasonLine) {
        const cand = (lines[appIdx + 2] || "").trim();
        if (/^[A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+){1,4}(\s*,\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C))?$/i.test(cand)) {
          provider = cand.replace(/\s*,\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C)$/i, "").trim();
        }
      }

      // Debug logging for provider extraction
      console.log(">>> Medical appointment detected");
      console.log(">>> Raw OCR excerpt (first 500 chars):", raw.substring(0, 500));
      console.log(">>> Extracted provider:", provider || "NOT FOUND");
      console.log(">>> Heuristic appointment type:", apptType);
      console.log(">>> Current title before override:", finalTitle);
      
      // Title-case helper
      const toTitle = (s: string) => s.replace(/\s+/g, " ").trim().replace(/\b\w/g, (m: string) => m.toUpperCase());
      
      // Only override title if OpenAI didn't already extract a good one
      const openAIHasGoodTitle = ocrSource === "openai" && finalTitle && finalTitle !== "Doctor Appointment" && !/^\s*appointment\s*$/i.test(finalTitle);
      
      if (!openAIHasGoodTitle) {
        // Use heuristic extraction
        if (provider) finalTitle = `${toTitle(apptType)} with Dr ${toTitle(provider)}`;
        else finalTitle = toTitle(apptType);
        console.log(">>> Using heuristic title:", finalTitle);
      } else {
        console.log(">>> Preserving OpenAI title:", finalTitle);
      }
      
      // Build clinical description from ONLY what we found (no rigid template)
      // Add facts only if they were extracted
      const descParts: string[] = [];
      
      // Only add what we actually found
      if (apptType && apptType !== "Doctor Appointment") {
        descParts.push(`Appointment type: ${toTitle(apptType)}`);
      }
      if (provider) {
        descParts.push(`Provider: Dr ${toTitle(provider)}`);
      }
      const facilityMatch = raw.match(/(?:Ascension|Sacred\s*Heart)[^.\n]*/i);
      if (facilityMatch) {
        descParts.push(`Location: ${facilityMatch[0].trim()}`);
      }
      
      // Use factual description with line breaks, or fallback to title if no details extracted
      // UNLESS OpenAI already provided a good description
      const openAIHasGoodDesc = ocrSource === "openai" && finalDescription && finalDescription !== "Doctor Appointment." && finalDescription.length > 20;
      
      if (!openAIHasGoodDesc) {
        // If we found specific details, use them; otherwise just use a simple message
        if (descParts.length > 0) {
          finalDescription = descParts.map(p => p.endsWith('.') ? p : p + '.').join("\n");
        } else {
          finalDescription = `${toTitle(apptType)}.`;
        }
        console.log(">>> Using heuristic description:", finalDescription);
      } else {
        console.log(">>> Preserving OpenAI description:", finalDescription);
      }
    }

    // Enrich generic "Join us for" line with the birthday person's name from title (non-medical only)
    if (!isMedicalAppointment) {
      finalDescription = improveJoinUsFor(finalDescription, finalTitle, finalAddress);
    }

    // Re-extract RSVP from updated description if not already set by LLM
    if (!deferredRsvp) {
      try {
        deferredRsvp = extractRsvpCompact(raw, finalDescription);
      } catch {}
    }

    // If this looks like a birthday, let the LLM rewrite the description into a single polite sentence
    if (/(birthday|b-?day)/i.test(raw) || /(birthday)/i.test(finalTitle)) {
      try {
        const venueLabel =
          pickVenueLabelForSentence(finalAddress, finalDescription, raw) ||
          finalAddress;
        // First attempt: deterministic human sentence without LLM.
        const deterministic = buildFriendlyBirthdaySentence(finalTitle, venueLabel);
        finalDescription = deterministic;
        // Second attempt: let LLM refine; fall back to deterministic if LLM returns weird multiline text
        const rewritten = await llmRewriteBirthdayDescription(finalTitle, venueLabel, deterministic);
        const cleaned = (rewritten || "").replace(/\s+/g, " ").trim();
        if (cleaned && /\.$/.test(cleaned) && cleaned.length >= 20 && cleaned.length <= 200) {
          finalDescription = cleaned;
        }
      } catch {}
    }

    // If this looks like a wedding/marriage invite, produce a clean title and short human sentence
    if (/(wedding|marriage|marieage|bride|groom|ceremony|reception|nupti(al)?)/i.test(raw) || /(wedding|marriage)/i.test(finalTitle)) {
      try {
        const wr = await llmRewriteWedding(raw, finalTitle, finalAddress);
        if (wr?.title) finalTitle = wr.title;
        if (wr?.description) {
          let desc = wr.description;
          // If model produced a spelled-out phrase not present on the card, prefer numeric time if we have one
          if (!/o['’]?clock/i.test(raw) && /o['’]?clock/i.test(desc) && finalStart instanceof Date) {
            try {
              const timeStr = new Date(finalStart).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              desc = desc.replace(/at\s+[^,\n]*o['’]?clock[^,\n]*/i, `at ${timeStr}`);
            } catch {}
          }
          finalDescription = desc;
        }
      } catch {}
    }

    // Generic rewrite for non-birthday/wedding flyers or when current description is long/multiline
    const isBirthday = /(birthday|b-?day)/i.test(raw) || /(birthday)/i.test(finalTitle);
    const isWedding = /(wedding|marriage)/i.test(finalTitle) || /(wedding|marriage)/i.test(raw);
    if (!isBirthday && !isWedding && !isMedicalAppointment) {
      try {
        const looksMultiline = /\n/.test(finalDescription) || (finalDescription || "").length > 180;
        const refined = await llmRewriteSmartDescription(
          raw,
          finalTitle,
          pickVenueLabelForSentence(finalAddress, finalDescription, raw) || finalAddress,
          null,
          looksMultiline ? (finalTitle ? `${finalTitle}.` : "") : finalDescription
        );
        const cleaned = (refined || "").replace(/\s+/g, " ").trim();
        if (cleaned && cleaned.length >= 20 && cleaned.length <= 200) {
          finalDescription = cleaned;
        }
      } catch {}
    }

    const rawHasYearDigits = /\b(19|20)\d{2}\b/.test(raw);
    let containsExplicitYear = rawHasYearDigits;
    if (ocrSource === "openai") {
      if (typeof (llmImage as any)?.yearVisible === "boolean") {
        containsExplicitYear = Boolean((llmImage as any).yearVisible);
      } else {
        containsExplicitYear = rawHasYearDigits;
      }
    }
    if (!containsExplicitYear && finalStart instanceof Date) {
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const sixtyDaysMs = 60 * dayMs;
      const duration = finalEnd instanceof Date ? finalEnd.getTime() - finalStart.getTime() : null;
      const adjustedStart = new Date(finalStart);
      let shifts = 0;
      while (adjustedStart.getTime() < now.getTime() - sixtyDaysMs && shifts < 3) {
        adjustedStart.setFullYear(adjustedStart.getFullYear() + 1);
        shifts += 1;
      }
      if (shifts > 0 && adjustedStart.getTime() > finalStart.getTime()) {
        finalStart = adjustedStart;
        if (duration !== null) {
          finalEnd = new Date(adjustedStart.getTime() + duration);
        } else if (finalEnd instanceof Date) {
          const endAdjusted = new Date(finalEnd);
          endAdjusted.setFullYear(endAdjusted.getFullYear() + shifts);
          finalEnd = endAdjusted;
        }
      }
    }

    if (finalEnd instanceof Date && finalStart instanceof Date) {
      const durationMs = finalEnd.getTime() - finalStart.getTime();
      const dashRangeRe =
        /\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?\s*[-\u2013\u2014]\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?/i;
      const fromToRangeRe =
        /\bfrom\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?\s+(?:to|until|through|till|til)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?/i;
      const hasExplicitRange = dashRangeRe.test(raw) || fromToRangeRe.test(raw);
      const hasRangeVerb = /(?:\buntil\b|\btill?\b|\bthrough\b)/i.test(raw);
      const timeTokenSet = new Set<string>();
      const time12hMatches =
        raw.match(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)\b/gi) || [];
      for (const token of time12hMatches) {
        const normalized = token.toLowerCase().replace(/\s+/g, "").replace(/\./g, "");
        timeTokenSet.add(normalized);
      }
      const time24hMatches = raw.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) || [];
      for (const token of time24hMatches) {
        timeTokenSet.add(token.trim());
      }
      const spelledMatches =
        raw.match(/\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*o['\u2019]?clock\b/gi) || [];
      const totalTimeMentions = timeTokenSet.size + spelledMatches.length;
      const looksLikeSingleTime = !hasExplicitRange && !hasRangeVerb && totalTimeMentions <= 1;
      if (durationMs <= 0 || looksLikeSingleTime) {
        finalEnd = null;
      }
    }

    // RSVP is now stored in a separate field, no longer appended to description

    if (typeof finalDescription === "string" && finalDescription.trim()) {
      finalDescription = stripJoinUsLanguage(finalDescription.trim());
    }

    const descriptionHasTitle =
      (finalTitle || "").trim().length > 0 &&
      (finalDescription || "").toLowerCase().includes((finalTitle || "").toLowerCase());

    const descriptionWithTitle = descriptionHasTitle
      ? (finalDescription || "")
      : [finalTitle, finalDescription].filter((s) => (s || "").trim().length > 0).join("\n\n");
    // Do NOT adjust for timezones: preserve the time exactly as it appears on
    // the flyer/invite. Downstream clients can treat it as a floating time.
    const toLocalNoZ = (d: Date | null) => {
      if (!d) return null;
      const pad = (n: number) => String(n).padStart(2, "0");
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${y}-${m}-${day}T${hh}:${mm}:${ss}`; // no timezone designator → floating local time
    };

    const fieldsGuess = {
      title: finalTitle,
      start: toLocalNoZ(finalStart),
      end: toLocalNoZ(finalEnd),
      location: finalAddress,
      description: descriptionWithTitle,
      timezone: "", // omit timezone; UI will show times as typed
      rsvp: deferredRsvp || null, // Store RSVP separately
    };

    const tz = fieldsGuess.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const practiceSchedule = {
      detected: false as boolean,
      title: null as string | null,
      timeframe: null as string | null,
      timezone: tz,
      groups: [] as Array<{
        name: string;
        note: string | null;
        sessions: Array<{
          day: string;
          display: string;
          hasPractice: boolean;
          start?: string;
          end?: string;
          startTime?: string;
          endTime?: string;
          note: string | null;
        }>;
        events: any[];
      }>,
    };

    // ---------------- Gymnastics schedule extraction ----------------
    const schedule = { detected: false as boolean, homeTeam: null as string | null, season: null as string | null, games: [] as any[] };
    let events: any[] = [];

    // ---------------- Weekly practice schedule extraction ----------------
    const dayMentions = raw.match(/\b(mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(rs(day)?)?|fri(day)?|sat(urday)?|sun(day)?)\b/gi) || [];
    const hasTimeRange = /\d{1,2}:\d{2}\s*[\-–—]\s*\d{1,2}:\d{2}/.test(raw) || /\b\d{1,2}:\d{2}\b/.test(raw);
    const hasPracticeKeyword = /(practice|training|schedule|team)/i.test(raw);
    const looksLikePracticeSchedule = hasPracticeKeyword && hasTimeRange && dayMentions.length >= 4;

    if (looksLikePracticeSchedule) {
      let practiceTz = tz;
      let practiceTitle: string | null = null;
      let practiceTimeframe: string | null = null;
      let practiceGroups: Array<{
        name: string;
        note: string | null;
        sessions: Array<{
          day: string;
          display: string;
          hasPractice: boolean;
          start?: string;
          end?: string;
          startTime?: string;
          endTime?: string;
          note: string | null;
        }>;
        events: any[];
      }> = [];

      let llmPractice: PracticeScheduleLLMResponse | null = null;
      try {
        llmPractice = await llmExtractPracticeScheduleFromImage(
          ocrBuffer,
          mime || "application/octet-stream",
          tz
        );
      } catch {
        llmPractice = null;
      }

      if (llmPractice?.groups && llmPractice.groups.length) {
        const locationHint = llmPractice?.timezoneHint || finalAddress || fieldsGuess.location || "";
        practiceTz = inferTimezoneFromAddress(locationHint || "") || tz;
        const builtGroups: typeof practiceGroups = [];
        for (const group of llmPractice.groups) {
          const groupName = String(group?.name || "Practice Group").trim() || "Practice Group";
          const groupNote = (group?.note && String(group.note).trim()) || null;
          const sessions = Array.isArray(group?.sessions) ? group.sessions : [];
          const normalizedSessions: Array<{
            day: string;
            display: string;
            hasPractice: boolean;
            start?: string;
            end?: string;
            startTime?: string;
            endTime?: string;
            note: string | null;
          }> = [];
          const groupEvents: any[] = [];

          for (const session of sessions) {
            const dayInfo = parseDayCode(session?.day || "");
            const range = parseTimeRange(`${session?.startTime || ""}-${session?.endTime || ""}`);
            const startParsed = range.start || parseTimeTo24h(session?.startTime || "");
            const endParsed = range.end || parseTimeTo24h(session?.endTime || "");
            if (!dayInfo || !startParsed || !endParsed) continue;
            const note = (session?.note && String(session.note).trim()) || null;
            const occurrence = buildNextOccurrence(
              practiceTz,
              dayInfo.index,
              startParsed.hour,
              startParsed.minute,
              endParsed.hour,
              endParsed.minute
            );
            const pad = (n: number) => String(n).padStart(2, "0");
            normalizedSessions.push({
              day: dayInfo.code,
              display: `${dayInfo.code} ${pad(startParsed.hour)}:${pad(startParsed.minute)}-${pad(endParsed.hour)}:${pad(endParsed.minute)}`,
              hasPractice: true,
              start: occurrence.start,
              end: occurrence.end,
              startTime: `${pad(startParsed.hour)}:${pad(startParsed.minute)}`,
              endTime: `${pad(endParsed.hour)}:${pad(endParsed.minute)}`,
              note,
            });
            const descParts = [
              llmPractice?.title?.trim() || null,
              llmPractice?.timeframe?.trim() || null,
              groupNote,
              note,
            ]
              .filter((p): p is string => Boolean((p || "").trim()))
              .map((p) => p.trim());
            const description = Array.from(new Set(descParts)).join("\n");
            groupEvents.push({
              title: `${groupName} Practice`,
              start: occurrence.start,
              end: occurrence.end,
              allDay: false,
              timezone: practiceTz,
              location: "",
              description,
              recurrence: `RRULE:FREQ=WEEKLY;BYDAY=${dayInfo.code}`,
              reminders: [{ minutes: 1440 }],
              category: "Sport Events",
            });
          }

          if (normalizedSessions.length) {
            builtGroups.push({
              name: groupName,
              note: groupNote,
              sessions: normalizedSessions,
              events: groupEvents,
            });
          }
        }
        practiceGroups = builtGroups;
        practiceTitle = llmPractice?.title || null;
        practiceTimeframe = llmPractice?.timeframe || null;
      }

      // Merge in heuristic groups to fill any that LLM missed
      const heuristic = parsePracticeScheduleHeuristics(lines, practiceTz);
      if (heuristic && Array.isArray(heuristic.groups) && heuristic.groups.length) {
        const seen = new Set(
          (practiceGroups || []).map((g) => String(g?.name || "").trim().toLowerCase())
        );
        for (const hg of heuristic.groups) {
          const key = String(hg?.name || "").trim().toLowerCase();
          if (!key) continue;
          if (!seen.has(key)) {
            practiceGroups.push(hg);
            seen.add(key);
          }
        }
        practiceTitle = practiceTitle || heuristic.title || null;
        practiceTimeframe = practiceTimeframe || heuristic.timeframe || null;
      }

      if (practiceGroups.length) {
        practiceSchedule.detected = true;
        practiceSchedule.groups = practiceGroups;
        practiceSchedule.title = practiceTitle;
        practiceSchedule.timeframe = practiceTimeframe;
        practiceSchedule.timezone = practiceTz;
      }

      // Fallback: if we still detected too few groups (e.g., only a subset),
      // run a simple row-based extractor to pick up missing group names and times.
      if (practiceSchedule.detected && practiceSchedule.groups.length < 7) {
        try {
          const groupNameRe = /(\b[A-Z][A-Za-z]+\s+Group\b|\bLevel\s*\d+\b)/i;
          const normalized = lines.map((l: string) => l.trim()).filter(Boolean);
          // Derive day order again
          const order: string[] = [];
          for (const tok of normalized) {
            if (isDayToken(tok)) {
              const code = DAY_NAME_TO_INDEX[normalizeDayToken(tok)]?.code;
              if (code && order[order.length - 1] !== code) order.push(code);
            } else if (order.length) break;
          }
          if (order.length >= 3) {
            const seen = new Set(
              (practiceSchedule.groups || []).map((g: any) => String(g?.name || "").trim().toLowerCase())
            );
            for (let i = 0; i < normalized.length; i++) {
              const line = normalized[i];
              if (!groupNameRe.test(line)) continue;
              const name = (line.match(groupNameRe)![0] || line).trim();
              if (seen.has(name.toLowerCase())) continue;
              // Collect the next order.length value-like tokens
              const values: string[] = [];
              let j = i + 1;
              while (j < normalized.length && values.length < order.length) {
                const cand = normalized[j];
                if (!cand) { j++; continue; }
                if (isDayToken(cand)) { j++; continue; }
                if (groupNameRe.test(cand)) break; // next group reached
                values.push(cand);
                j++;
              }
              if (!values.length) continue;
              const sessions: any[] = [];
              const groupEvents: any[] = [];
              for (let k = 0; k < Math.min(values.length, order.length); k++) {
                const label = values[k];
                const parsed = parsePracticeTimeRange(label);
                if (!parsed) continue;
                const dayInfo = DAY_NAME_TO_INDEX[normalizeDayToken(order[k])] || { index: k, code: order[k] };
                const occ = buildNextOccurrence(
                  practiceTz,
                  dayInfo.index,
                  parsed.startHour,
                  parsed.startMinute,
                  parsed.endHour,
                  parsed.endMinute
                );
                const pad = (n: number) => String(n).padStart(2, "0");
                sessions.push({
                  day: dayInfo.code,
                  display: `${dayInfo.code} ${pad(parsed.startHour)}:${pad(parsed.startMinute)}-${pad(parsed.endHour)}:${pad(parsed.endMinute)}`,
                  hasPractice: true,
                  start: occ.start,
                  end: occ.end,
                  startTime: `${pad(parsed.startHour)}:${pad(parsed.startMinute)}`,
                  endTime: `${pad(parsed.endHour)}:${pad(parsed.endMinute)}`,
                  note: parsed.note,
                });
                groupEvents.push({
                  title: `${name} Practice`,
                  start: occ.start,
                  end: occ.end,
                  allDay: false,
                  timezone: practiceTz,
                  location: "",
                  description: [practiceTitle, practiceTimeframe, parsed.note].filter(Boolean).join("\n"),
                  recurrence: `RRULE:FREQ=WEEKLY;BYDAY=${dayInfo.code}`,
                  reminders: [{ minutes: 1440 }],
                  category: "Sport Events",
                });
              }
              // Even if no sessions parsed, include the group name so the UI can show it
              (practiceSchedule.groups as any[]).push({
                name,
                note: null,
                sessions,
                events: groupEvents,
              });
              seen.add(name.toLowerCase());
            }
          }
        } catch {}
      }
    }

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

    // Do not auto-pick a practice group. Let the client prompt the user.
    // Keep events empty here; the UI will render the group chooser from practiceSchedule.

    if (practiceSchedule.detected) {
      // For weekly practice schedules, there is typically no single address on the flyer
      // and no single one-off start/end. Leave them blank so the UI prompts for a group.
      fieldsGuess.location = "";
      fieldsGuess.start = null as any;
      fieldsGuess.end = null as any;
      const schedLabel = [
        (practiceSchedule as any).title,
        (practiceSchedule as any).timeframe,
      ]
        .filter((s: string) => (s || "").trim())
        .join(" — ");
      if (schedLabel) fieldsGuess.description = schedLabel;
    }

    // --- Category detection ---
    const detectCategory = (fullText: string, sched: any, guess: any): string | null => {
      try {
        const text = (fullText || "").toLowerCase();
        // Football handling removed
        // Doctor/Dentist/Clinic appointments
        const isDoctorLike = /(doctor|dr\.|dentist|dental|orthodont|clinic|hospital|pediatric|dermatolog|cardiolog|optomet|eye\s+exam|ascension|sacred\s*heart)/i.test(fullText);
        const hasAppt = /(appointment|appt)/i.test(fullText);
        if (isDoctorLike && hasAppt) return "Doctor Appointments";
        if (isDoctorLike) return "Doctor Appointments";
        if (hasAppt) return "Appointments";
        // Weddings / Birthdays — words-only detection. If both appear, do not prefer either.
        const hasWedding = /(wedding|marriage|marieage|ceremony|reception|bride|groom|nupti(al)?|bridal)/i.test(fullText);
        const hasBirthday = /(birthday\s*party|\b(b-?day)\b|\bturns?\s+\d+|\bbirthday\b)/i.test(fullText);
        if (hasWedding && !hasBirthday) return "Weddings";
        if (hasBirthday && !hasWedding) return "Birthdays";
        // Sports: practice schedules and generic sports
        if (/(practice\s*schedule|team\s*practice|school\s*year\s*.*practice|group\s+.*\b\d{1,2}:\d{2})/i.test(fullText)) {
          return "Sport Events";
        }
        if (/(schedule|game|vs\.|tournament|league)/i.test(fullText) && /(soccer|basketball|baseball|hockey|volleyball|gymnastics|swim|tennis|track|softball|football)/i.test(fullText)) {
          return "Sport Events";
        }
        if (/(car\s*pool|carpool|ride\s*share|school\s*pickup|school\s*drop[- ]?off)/i.test(fullText)) {
          return "Car Pool";
        }
      } catch {}
      return null;
    };

    const intakeId: string | null = null;
    // Category is derived strictly from OCR text (words only); ignore any image-only LLM labels
    let category: string | null = detectCategory(raw, schedule, fieldsGuess);
    if (practiceSchedule.detected) category = "Sport Events";

    try {
      const session = await getServerSession(authOptions);
      const email = session?.user?.email as string | undefined;
      // Only decrement credits for free-plan users; paid plans are unlimited.
      if (email) {
        try {
          const profileRes = await fetch(`${new URL(request.url).origin}/api/user/profile`, { headers: { cookie: request.headers.get("cookie") || "" } } as any).catch(() => null);
          const plan = profileRes && profileRes.ok ? (await profileRes.json().catch(() => ({}))).subscriptionPlan : null;
          if (!plan || plan === "free") {
            await incrementCreditsByEmail(email, -1);
          }
        } catch {
          // Fallback: if plan is unknown, keep old behavior for safety
          await incrementCreditsByEmail(email, -1);
        }
        // Increment scan counters for admin metrics
        try { await incrementUserScanCounters({ email, category }); } catch {}
      }
    } catch {}

    return NextResponse.json(
      { intakeId, ocrText: raw, fieldsGuess, practiceSchedule, schedule, events, category, ocrSource },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "OCR route failed", detail: message }, { status: 500 });
  }
}
