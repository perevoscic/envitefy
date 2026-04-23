import * as chrono from "chrono-node";
import { getServerSession } from "next-auth";
import sharp from "sharp";
import { authOptions } from "@/lib/auth";
import { normalizeBirthdayTemplateHint } from "@/lib/birthday-ocr-template";
import { corsJson } from "@/lib/cors";
import { incrementUserScanCounters } from "@/lib/db";
import { rasterizePdfPageToPng } from "@/lib/pdf-raster";
import {
  clampTimeoutMs,
  OCR_TOTAL_BUDGET_MS,
  OPENAI_TIMEOUT_MS,
  remainingBudgetMs,
  resolveOcrModel,
} from "@/lib/ocr/constants";
import {
  extractGymnasticsScheduleHeuristics,
  extractGymnasticsScheduleWithLlm,
  hasGymnasticsScheduleText,
} from "@/lib/ocr/gymnastics-schedule";
import {
  llmExtractEventFromImage,
  llmExtractPracticeScheduleFromImage,
  llmEventToRawText,
  llmRewriteBirthdayDescription,
  llmRewriteSmartDescription,
  llmRewriteWedding,
} from "@/lib/ocr/openai";
import { inferOcrSkinSelection, isOcrInviteCategory } from "@/lib/ocr/skin";
import {
  buildNextOccurrence,
  createEmptyPracticeSchedule,
  DAY_NAME_TO_INDEX,
  isDayToken,
  normalizeDayToken,
  parseDayCode,
  parsePracticeScheduleHeuristics,
  parsePracticeTimeRange,
  parseTimeRange,
  parseTimeTo24h,
} from "@/lib/ocr/practice-schedule";
import {
  cleanAddressLabel,
  detectCategory,
  detectSpelledTime,
  extractRsvpDetails,
  extractRsvpCompact,
  improveJoinUsFor,
  inferTimezoneFromAddress,
  pickTitle,
  pickVenueLabelForSentence,
  splitVenueFromAddress,
  stripJoinUsLanguage,
  extractGuestReminderFromFlyerText,
} from "@/lib/ocr/text";
import { validateUploadFileMeta } from "@/lib/upload-config";
import { resolveInferredInviteDatetime } from "@/lib/ocr/inferred-invite-date.mjs";

function toLocalNoZ(date: Date | null) {
  if (!date) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
}

/** Party headline from title when combined with birthday (e.g. "Name's 9th Birthday — Pool Bash"). */
function extractBirthdayPartyThemeFromTitle(title: string): string | null {
  const t = title.trim();
  if (!t) return null;
  const dashParts = t
    .split(/\s*[—–-]\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (dashParts.length >= 2) {
    const left = dashParts[0];
    const right = dashParts[dashParts.length - 1];
    const leftBirthday = /birthday/i.test(left);
    const rightBirthday = /birthday/i.test(right);
    if (leftBirthday && !rightBirthday && right.length >= 3) return right;
    if (rightBirthday && !leftBirthday && left.length >= 3) return left;
  }
  const openIdx = t.indexOf("(");
  if (openIdx > 0) {
    const closeIdx = t.lastIndexOf(")");
    if (closeIdx > openIdx) {
      const inner = t.slice(openIdx + 1, closeIdx).trim();
      const outer = t.slice(0, openIdx).trim();
      if (/birthday/i.test(inner) && outer.length >= 3) return outer;
      if (
        /birthday/i.test(outer) &&
        inner.length >= 3 &&
        !/^(party|birthday)$/i.test(inner)
      ) {
        return inner;
      }
    }
  }
  return null;
}

function buildCleanDescription(
  lines: string[],
  title: string,
  addressOnly: string,
  parsedText: string | null,
) {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const titleWords = normalize(title).split(" ").filter(Boolean);
  const addressNorm = normalize(addressOnly);
  const parsedNorm = parsedText ? normalize(parsedText) : null;
  const genericWords = new Set(["party", "birthday", "event", "celebration"]);
  const allowShortWord = new Set(["usa", "nyc", "bbq", "gym"]);
  const englishishSuffix =
    /(ing|tion|ment|ness|able|ible|less|ful|ship|day|night|house|hall|park|room|center|centre|party|birthday|concert|festival|meeting|reception|ceremony|gala|parade|show)$/i;
  const monthsShort = /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)/i;
  const weekdaysShort = /(mon|tue|tues|wed|thu|thur|fri|sat|sun)/i;

  const looksEnglishWord = (rawWord: string): boolean => {
    const word = (rawWord || "").toLowerCase().replace(/[^a-z]/g, "");
    if (!word) return false;
    if (allowShortWord.has(word)) return true;
    if (monthsShort.test(word) || weekdaysShort.test(word)) return true;
    if (word.length <= 2) return true;
    if (!/[aeiouy]/i.test(word) && word.length >= 3) return false;
    if (englishishSuffix.test(word)) return true;
    if (word.length >= 5) {
      const vowels = (word.match(/[aeiouy]/g) || []).length;
      if (vowels / word.length < 0.25) return false;
    }
    if (/(.)\1{2,}/.test(word)) return false;
    return true;
  };

  const hasEnoughOverlap = (line: string, words: string[]) => {
    if (!words.length) return false;
    const lineWords = normalize(line).split(" ").filter(Boolean);
    if (!lineWords.length) return false;
    let matches = 0;
    for (const word of words) if (lineWords.includes(word)) matches++;
    return matches / words.length >= 0.6 || matches >= Math.min(3, words.length);
  };

  const inviteRe = /\b(you\s+are\s+invited(\s+to)?|you'?re\s+invited(\s+to)?)\b/i;
  const keep: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    const strippedOrig = line.trim();
    if (!strippedOrig) continue;
    const stripped = strippedOrig.replace(/^(?:st|nd|rd|th)\b[\s\-.,:]*/i, "").trim();
    if (!stripped) continue;
    if (stripped.length <= 2 || /^\d+$/.test(stripped) || /^[A-Za-z]$/.test(stripped)) continue;
    if (/(^|\s)(ee+|oo+|ll+)(\s|$)/i.test(stripped) && stripped.replace(/\s+/g, "").length <= 3)
      continue;
    if (inviteRe.test(stripped)) continue;
    if (hasEnoughOverlap(stripped, titleWords)) continue;
    if (/^\d{1,2}([:.]\d{1,2})\s*(a\.?m\.?|p\.?m\.?)?$/i.test(stripped)) continue;
    if (/^\d+\s*[:-]\s*\d+$/.test(stripped)) continue;

    if (/^[A-Za-z]{3,}$/.test(stripped) && stripped.split(/\s+/).length === 1) {
      if (!looksEnglishWord(stripped)) continue;
    }
    const strippedNorm = normalize(stripped);
    if (
      addressNorm &&
      (strippedNorm.includes(addressNorm) || (strippedNorm.length >= 8 && addressNorm.includes(strippedNorm)))
    ) {
      continue;
    }
    if (parsedNorm && strippedNorm === parsedNorm) continue;
    if (/^[A-Za-z]+$/.test(stripped) && genericWords.has(stripped.toLowerCase())) continue;

    const tokens = stripped.split(/\s+/).filter(Boolean);
    if (tokens.length <= 3) {
      const good = tokens.filter((token) => /\d/.test(token) || looksEnglishWord(token)).length;
      if (good === 0) continue;
    }
    keep.push(stripped);
  }

  try {
    const full = lines.join("\n");
    const patientMatch = full.match(
      /\bpatient\s*(name|id)?[:#-]?\s*([A-Z][A-Za-z'-]+\s+[A-Z][A-Za-z'-]+)\b/i,
    );
    const dobMatch = full.match(
      /\b(dob|date\s*of\s*birth)[:#-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    );
    const providerMatch = full.match(
      /\b(dr\.?|doctor)\s*([A-Z][A-Za-z\s\-']+)|\bprovider[:#-]?\s*([A-Z][A-Za-z\s\-']+)/i,
    );
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
}

export async function handleOcrRequest(request: Request) {
  try {
    const debug = process.env.NODE_ENV !== "production";
    const log = (...args: any[]) => {
      if (debug) console.log(...args);
    };

    const startedAt = Date.now();
    const configuredBudgetMs = Number(process.env.OCR_TOTAL_BUDGET_MS);
    const totalBudgetMs =
      Number.isFinite(configuredBudgetMs) && configuredBudgetMs >= 10_000
        ? configuredBudgetMs
        : OCR_TOTAL_BUDGET_MS;

    const stage = {
      preprocessMs: 0,
      primaryOcrMs: 0,
      fallbackOcrMs: 0,
      rewriteMs: 0,
      scheduleMs: 0,
    };

    const url = new URL(request.url);
    const forceLLM =
      url.searchParams.get("llm") === "1" || url.searchParams.get("engine") === "openai";
    const gymOnly =
      url.searchParams.get("gym") === "1" || url.searchParams.get("sport") === "gymnastics";
    const fastMode = url.searchParams.get("fast") === "1";
    const turboMode = url.searchParams.get("turbo") === "1";
    const includeTimings =
      url.searchParams.get("timing") === "1" || url.searchParams.get("debug") === "1";
    const rewritesRequested = url.searchParams.get("rewrite") === "1";
    const enableRewrites =
      rewritesRequested || !fastMode || process.env.OCR_ENABLE_REWRITES === "1";
    const allowDeepScheduleExtraction = !fastMode || forceLLM || gymOnly;
    const ocrModel = resolveOcrModel(fastMode);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return corsJson(request, { error: "No file" }, { status: 400 });
    }

    const validation = validateUploadFileMeta({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      usage: "attachment",
    });
    if (!validation.ok) {
      return corsJson(request, { error: validation.error }, { status: validation.status });
    }

    const mime = validation.mimeType;
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    let ocrBuffer = inputBuffer;
    let visionMime = mime || "application/octet-stream";

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
      visionMime = "image/png";
    }

    let colorBuffer = ocrBuffer;
    let colorMime = visionMime;
    try {
      colorBuffer = await sharp(ocrBuffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toBuffer();
      colorMime = "image/jpeg";
    } catch {}

    const preprocessStartedAt = Date.now();
    try {
      ocrBuffer = await sharp(ocrBuffer)
        .rotate()
        .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
        .grayscale()
        .normalize()
        .toBuffer();
    } catch {}
    stage.preprocessMs = Date.now() - preprocessStartedAt;

    let llmImage: any = null;
    let raw = "";
    let ocrSource = "none";

    const runOpenAiPrimary = async (timeoutMs: number) => {
      const llm = await llmExtractEventFromImage(ocrBuffer, visionMime, timeoutMs, ocrModel);
      const rawText = llmEventToRawText(llm);
      if (!llm || !rawText) throw new Error("OPENAI_EMPTY");
      return { rawText, llm };
    };

    const primaryStartedAt = Date.now();
    if (turboMode && remainingBudgetMs(startedAt, totalBudgetMs, 2_000) > 0) {
      const openAiTimeoutMs = clampTimeoutMs(
        Math.min(12_000, OPENAI_TIMEOUT_MS, remainingBudgetMs(startedAt, totalBudgetMs, 4_000)),
        OPENAI_TIMEOUT_MS,
      );
      if (openAiTimeoutMs >= 3_000) {
        try {
          log(">>> OCR turbo mode: Trying OpenAI Vision (primary)...", {
            timeoutMs: openAiTimeoutMs,
            fastMode,
            ocrModel,
          });
          const primary = await runOpenAiPrimary(openAiTimeoutMs);
          raw = primary.rawText;
          llmImage = primary.llm;
          ocrSource = "openai";
        } catch (error) {
          console.error(">>> OCR turbo mode: OpenAI Vision failed with error:", error);
        }
      }
    }

    if (!raw) {
      const primaryTimeoutMs = clampTimeoutMs(
        Math.min(OPENAI_TIMEOUT_MS, remainingBudgetMs(startedAt, totalBudgetMs, 5_000)),
        OPENAI_TIMEOUT_MS,
      );
      if (primaryTimeoutMs >= 3_000) {
        try {
          log(">>> OCR: Trying OpenAI Vision (primary)...", {
            timeoutMs: primaryTimeoutMs,
            fastMode,
            ocrModel,
          });
          const primary = await runOpenAiPrimary(primaryTimeoutMs);
          raw = primary.rawText;
          llmImage = primary.llm;
          ocrSource = "openai";
        } catch (error) {
          console.error(">>> OCR: OpenAI Vision failed with error:", error);
        }
      }
    }
    stage.primaryOcrMs = Date.now() - primaryStartedAt;

    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const title = pickTitle(lines, raw);

    const parsed = chrono.parse(raw, new Date(), { forwardDate: true });
    const timeLike = /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i;
    const rangeLike =
      /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b\s*[-–—]\s*\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i;
    let start: Date | null = null;
    let end: Date | null = null;
    let parsedText: string | null = null;

    const isMedical =
      /(doctor|dr\.|dentist|dental|clinic|hospital|ascension|sacred\s*heart)/i.test(raw) &&
      /(appointment|appt)/i.test(raw);
    let medicalStart: Date | null = null;
    let medicalParsedText: string | null = null;

    if (isMedical) {
      let apptDateStr: string | null = null;
      let apptTimeStr: string | null = null;
      const dobMatch = raw.match(/\b(dob|date\s*of\s*birth)[:#-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
      const dobStr = dobMatch?.[2] || null;
      const dateLM = raw.match(
        /\b(appointment\s*date|appt\s*date|date)\b[:#-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      );
      const timeLM = raw.match(
        /\b(appointment\s*time|time)\b[:#-]?\s*(\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?))/i,
      );
      apptDateStr = dateLM?.[2] || null;
      apptTimeStr = timeLM?.[2] || null;
      if (!apptDateStr || (dobStr && apptDateStr === dobStr)) {
        for (let i = 0; i < lines.length - 1; i++) {
          if (/^\s*(appointment\s*date|appt\s*date|date)\s*:?\s*$/i.test(lines[i])) {
            const match = lines[i + 1].match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
            if (match) {
              apptDateStr = match[0];
              break;
            }
          }
        }
      }
      if (!apptTimeStr) {
        for (let i = 0; i < lines.length - 1; i++) {
          if (/^\s*(appointment\s*time|time)\s*:?\s*$/i.test(lines[i])) {
            const match = lines[i + 1].match(/\b\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?)\b/i);
            if (match) {
              apptTimeStr = match[0];
              break;
            }
          }
        }
      }
      if (apptDateStr) {
        const [mm, dd, yy] = apptDateStr.split(/[/-]/).map((x) => x.trim());
        const year = Number(yy.length === 2 ? Number(yy) + 2000 : yy);
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
        medicalParsedText = `${apptDateStr}${apptTimeStr ? ` ${apptTimeStr}` : ""}`;
      }
    }

    if (parsed.length) {
      const score = (value: any) => {
        const text = (value?.text || "") as string;
        const hasTime = timeLike.test(text);
        const hasRange = rangeLike.test(text);
        const known = value?.start?.knownValues || {};
        let scoreValue = 0;
        if (known.month && known.day) scoreValue += 6;
        if (known.weekday) scoreValue += 1;
        if (hasRange) scoreValue += 2;
        if (hasTime) scoreValue += 1;
        if (hasTime && !(known.month && known.day) && !known.weekday) scoreValue -= 4;
        return scoreValue;
      };
      const looksLikeDob = (text: string) => /\b(dob|date\s*of\s*birth)\b/i.test(text);
      const byPreference = [...parsed].sort((a, b) => {
        const sa = score(a as any) - (looksLikeDob((a as any).text || "") ? 10 : 0);
        const sb = score(b as any) - (looksLikeDob((b as any).text || "") ? 10 : 0);
        return sb - sa;
      });
      const chosen = byPreference[0];
      start = chosen.start?.date() ?? null;
      end = chosen.end?.date() ?? null;
      parsedText = (chosen as any).text || null;

      const chosenAny: any = chosen;
      const chosenHasExplicitDate = Boolean(
        chosenAny?.start?.knownValues?.month && chosenAny?.start?.knownValues?.day,
      );
      const chosenHasExplicitTime = typeof chosenAny?.start?.knownValues?.hour === "number";
      if (start && chosenHasExplicitDate && !chosenHasExplicitTime) {
        const timeOnly = byPreference.find((value: any) => {
          const kv = value?.start?.knownValues || {};
          const hasTime = typeof kv.hour === "number";
          const hasExplicitDate = Boolean(kv.month && kv.day) || Boolean(kv.weekday);
          return hasTime && !hasExplicitDate && timeLike.test((value?.text || "") as string);
        }) as any | undefined;

        if (timeOnly) {
          const timeStart: Date = timeOnly.start?.date() as Date;
          if (timeStart && start) {
            const merged = new Date(start);
            merged.setHours(timeStart.getHours(), timeStart.getMinutes(), 0, 0);
            start = merged;
          }
          const timeEnd: Date | null = (timeOnly.end?.date?.() as Date) || null;
          if (timeEnd && start) {
            const endMerged = new Date(start);
            endMerged.setHours(timeEnd.getHours(), timeEnd.getMinutes(), 0, 0);
            end = endMerged;
          }
        }
      }
    }

    if (start && !medicalStart) {
      const spelled = detectSpelledTime(raw);
      if (spelled) {
        const hasAfternoon = /\bafternoon\b/i.test(raw);
        const hasEvening = /\b(evening|night)\b/i.test(raw);
        const hasMorning = /\bmorning\b/i.test(raw);
        let hour24 = spelled.hour % 12;
        if (spelled.meridiem === "pm") hour24 += 12;
        if (spelled.meridiem === null) {
          if (hasAfternoon || hasEvening) hour24 += 12;
          else if (!hasMorning && /(wedding|ceremony|reception)/i.test(raw) && hour24 >= 1 && hour24 <= 6) {
            hour24 += 12;
          }
        }
        const merged = new Date(start);
        merged.setHours(hour24, spelled.minute, 0, 0);
        start = merged;
      }
    }

    if (medicalStart) {
      start = medicalStart;
      end = null;
      parsedText = medicalParsedText;
    }

    const timeToken = /\b\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)\b/i;
    const hasStreetNumber = /\b\d{1,6}\s+[A-Za-z]/;
    const venueOrSuffix =
      /\b(Auditorium|Center|Hall|Gym|Gymnastics|Park|Room|Suite|Ave(nue)?|St(reet)?|Blvd|Rd|Road|Dr|Drive|Ct|Court|Ln|Lane|Way|Pl|Place|Ter(race)?|Pkwy|Parkway|Hwy|Highway|Boulevard|Street|Avenue)\b/i;

    const lineScores = lines.map((line, idx) => {
      let scoreValue = 0;
      if (timeToken.test(line)) scoreValue -= 10;
      if (hasStreetNumber.test(line)) scoreValue += 5;
      if (venueOrSuffix.test(line)) scoreValue += 3;
      const next = lines[idx + 1] || "";
      const cityStateZip = /\b[A-Za-z.'\s]+,\s*[A-Z]{2}\s+\d{5}\b/;
      if (cityStateZip.test(next)) scoreValue += 2;
      return scoreValue;
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
    if (isMedical) {
      const idx = lines.findIndex((line) =>
        /^(dept\.?\s*\/\s*address|department\s*\/\s*address|dept\.?\s*\/?\s*address|dept\.?\s*\/\s*adr(?:ess)?)$/i.test(
          line,
        ),
      );
      if (idx >= 0) {
        const block = [lines[idx + 1], lines[idx + 2], lines[idx + 3]].filter(Boolean) as string[];
        const cityStateZip = /\b[A-Za-z.'\s]+,\s*[A-Z]{2}\s+\d{5}\b/;
        const pick = block.find((value) => hasStreetNumber.test(value) || cityStateZip.test(value));
        if (pick) addressOnly = pick.trim();
      }
    }

    if (locIdx >= 0 && bestScore > 0 && !addressOnly) {
      const parts: string[] = [];
      const line = lines[locIdx].replace(/[–—-]\s*$/g, "").trim();
      const prev = lines[locIdx - 1]?.replace(/[–—-]\s*$/g, "").trim();
      const next = lines[locIdx + 1]?.replace(/[–—-]\s*$/g, "").trim();
      const cityStateZip = /\b[A-Za-z.'\s]+,\s*[A-Z]{2}\s+\d{5}\b/;
      if (prev && !timeToken.test(prev) && venueOrSuffix.test(prev) && !hasStreetNumber.test(prev)) {
        parts.push(prev);
      }
      const badSegment =
        /(call|rsvp|tickets?|admission|instagram|facebook|twitter|www\.|\.com|\b(tel|phone)\b)/i;
      const monthName =
        /(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?)/i;
      const segments = line
        .split(/\s*[|•·]\s*/)
        .map((value) => value.trim())
        .filter(Boolean);
      let bestSegment = "";
      let segScore = -Infinity;
      for (const segment of segments.length ? segments : [line]) {
        let scoreValue = 0;
        if (badSegment.test(segment)) scoreValue -= 10;
        if (monthName.test(segment) && !hasStreetNumber.test(segment)) scoreValue -= 4;
        if (hasStreetNumber.test(segment)) scoreValue += 5;
        if (venueOrSuffix.test(segment)) scoreValue += 3;
        if (scoreValue > segScore) {
          segScore = scoreValue;
          bestSegment = segment;
        }
      }
      parts.push(bestSegment || line);
      if (next && (cityStateZip.test(next) || hasStreetNumber.test(next)) && !timeToken.test(next)) {
        parts.push(next);
      }
      addressOnly = cleanAddressLabel(parts.join(", ").replace(/^\s*\|\s*/g, "").replace(/\s{2,}/g, " ").trim());
      if (!/\d/.test(addressOnly)) {
        const withNum = lines.find((value) => hasStreetNumber.test(value) && !timeToken.test(value));
        if (withNum) addressOnly = withNum.trim();
      }
    }

    const cleanDescription = buildCleanDescription(lines, title, addressOnly, parsedText);

    let deferredRsvp: string | null = null;
    let deferredRsvpUrl: string | null = null;
    let deferredRsvpDeadline: string | null = null;
    let finalTitle = title;
    let finalStart = start;
    let finalEnd = end;
    /** True when the vision model returned a non-empty `end` string (even if parsing falls back). */
    let llmReturnedEndString = false;
    let finalAddress = addressOnly;
    let finalVenue = "";
    let finalDescription = cleanDescription;
    let keepTitleInDescription = false;

    if (ocrSource === "openai" && llmImage) {
      const safeDate = (value?: string | null) => {
        if (!value) return null;
        const parsedDate = new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
      };

      finalTitle =
        typeof llmImage.title === "string" && llmImage.title.trim() ? llmImage.title.trim() : title;
      finalStart = safeDate(llmImage.start) || start;
      llmReturnedEndString = typeof llmImage.end === "string" && llmImage.end.trim().length > 0;
      finalEnd = safeDate(llmImage.end) || end;
      finalAddress =
        typeof llmImage.address === "string" && llmImage.address.trim()
          ? llmImage.address.trim()
          : addressOnly;
      finalDescription =
        typeof llmImage.description === "string" && llmImage.description.trim()
          ? llmImage.description.trim()
          : cleanDescription;

      if (/birthday/i.test(finalTitle) && !/\b\d{1,2}(st|nd|rd|th)\b/i.test(finalTitle)) {
        const agePattern = /\b([1-9]|1[0-9])\b/g;
        const ageMatches = [...raw.matchAll(agePattern)];
        const candidateAges = ageMatches
          .map((match) => ({ num: parseInt(match[1], 10), pos: match.index! }))
          .filter(({ pos }) => {
            const context = raw.substring(Math.max(0, pos - 20), Math.min(raw.length, pos + 20));
            return !/\b(Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|20\d{2})\b/i.test(context);
          });
        if (candidateAges.length) {
          const age = candidateAges[0].num;
          const suffix =
            age % 100 >= 11 && age % 100 <= 13
              ? "th"
              : age % 10 === 1
                ? "st"
                : age % 10 === 2
                  ? "nd"
                  : age % 10 === 3
                    ? "rd"
                    : "th";
          finalTitle = finalTitle.replace(/(\w+['’]s)\s+(Birthday\s+Party)/i, `$1 ${age}${suffix} $2`);
        }
      }

      if (typeof llmImage.rsvp === "string" && llmImage.rsvp.trim()) {
        deferredRsvp = llmImage.rsvp.trim();
      }
      if (typeof llmImage.rsvpUrl === "string" && llmImage.rsvpUrl.trim()) {
        deferredRsvpUrl = llmImage.rsvpUrl.trim();
      }
      if (typeof llmImage.rsvpDeadline === "string" && llmImage.rsvpDeadline.trim()) {
        deferredRsvpDeadline = llmImage.rsvpDeadline.trim();
      }
    }

    const isBirthdayTitle = /birthday/i.test(finalTitle);
    let ageOrdinal = "";
    if (isBirthdayTitle) {
      const ageMatch = finalTitle.match(/\b(\d{1,2})(st|nd|rd|th)\s+(Birthday|Party)/i);
      if (ageMatch) {
        ageOrdinal = `${ageMatch[1]}${ageMatch[2]}`;
      } else {
        const agePatterns = [
          /\b(\d{1,2})(st|nd|rd|th)\b/i,
          /\b(turning|age|aged)\s+(\d{1,2})\b/i,
          /\b(\d{1,2})\s+(years?\s+old|years?)\b/i,
        ];
        const standaloneNumber = /\b([1-9]|1[0-9]|20)\b/g;
        const matches = [...raw.matchAll(standaloneNumber)];
        let extractedAge: number | null = null;
        for (const pattern of agePatterns) {
          const match = raw.match(pattern);
          if (!match) continue;
          if (match[1] && match[2]) {
            if (/^(st|nd|rd|th)$/i.test(match[2])) extractedAge = parseInt(match[1], 10);
            else if (/^(turning|age|aged)$/i.test(match[1]) && match[2]) extractedAge = parseInt(match[2], 10);
            else if (/^years?/i.test(match[2])) extractedAge = parseInt(match[1], 10);
          }
          if (extractedAge) break;
        }
        if (!extractedAge && matches.length > 0) {
          const candidateNumbers = matches
            .map((match) => parseInt(match[1], 10))
            .filter((value) => value >= 1 && value <= 20 && value !== 20)
            .filter(
              (value) =>
                !raw.match(
                  new RegExp(
                    `\\b${value}\\s*(Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|December|January|February|March|April|May|June|July|August|September|October|November|202[0-9]|203[0-9])`,
                    "i",
                  ),
                ),
            );
          if (candidateNumbers.length > 0) extractedAge = candidateNumbers.sort((a, b) => a - b)[0];
        }
        if (extractedAge && extractedAge >= 1 && extractedAge <= 19) {
          const suffix =
            extractedAge % 100 >= 11 && extractedAge % 100 <= 13
              ? "th"
              : extractedAge % 10 === 1
                ? "st"
                : extractedAge % 10 === 2
                  ? "nd"
                  : extractedAge % 10 === 3
                    ? "rd"
                    : "th";
          ageOrdinal = `${extractedAge}${suffix}`;
          finalTitle = finalTitle.replace(/(\w+['']s)\s+(Birthday\s+Party)/i, `$1 ${ageOrdinal} $2`);
        }
      }
    }

    for (const pattern of [
      /\b(December|January|February|March|April|May|June|July|August|September|October|November)\b/gi,
      /\b(Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov)\.?\b/gi,
    ]) {
      finalTitle = finalTitle.replace(pattern, "").trim();
    }
    if (isBirthdayTitle && ageOrdinal) {
      finalTitle = finalTitle
        .replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, (match, num, suffix) =>
          match === ageOrdinal ? `__AGE__${num}${suffix}__` : "",
        )
        .trim();
    } else {
      finalTitle = finalTitle.replace(/\b\d{1,2}(st|nd|rd|th)\b/gi, "").trim();
    }
    finalTitle = finalTitle
      .replace(/\b(Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov)\.?\s+\d{1,2}\b/gi, "")
      .replace(/\b\d{4}\b/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/[,.;:]+$/, "")
      .trim();
    if (isBirthdayTitle && ageOrdinal) {
      finalTitle = finalTitle.replace(/__AGE__(\d+)(st|nd|rd|th)__/gi, ageOrdinal);
    }

    const isMedicalAppointment =
      /(appointment|appt)/i.test(raw) &&
      /(doctor|dr\.|dentist|dental|clinic|hospital|ascension|sacred\s*heart)/i.test(raw);

    if (isMedicalAppointment) {
      const appIdx = lines.findIndex((line) => /^\s*appointment\s*$/i.test(line));
      const reasonLine = appIdx >= 0 ? lines[appIdx + 1] || null : null;
      const reasonMatch = (raw.match(
        /\b(dental\s+cleaning|teeth\s+cleaning|annual\s+visit|annual\s+physical|follow\s*-?\s*up|new\s*patient(\s*visit)?|consult(ation)?|check\s*-?\s*up|well(ness)?\s*visit|routine\s*(exam|visit|check(\s*-?\s*up)?)|cleaning)\b/i,
      ) || [])[0];
      let apptTypeRaw = reasonLine?.trim() || reasonMatch || "Doctor Appointment";
      apptTypeRaw = apptTypeRaw.replace(/\b\d+\b/g, "").replace(/\s{2,}/g, " ").trim();
      const apptType = apptTypeRaw;

      let provider: string | null = null;
      const provA = raw.match(
        /\b(?:dr\.?\s*|doctor\s+)([A-Z][A-Za-z\-']+(?:\s+[A-Z][A-Za-z\-']+)*(?:\s*-\s*[A-Z][A-Za-z]+)?)\b/i,
      );
      if (provA) provider = (provA[1] || "").trim();
      if (!provider) {
        const provLabel = raw.match(
          /(?:Provider|Physician|Doctor):\s*([A-Z][A-Za-z\-'\s]+(?:-[A-Z][A-Za-z]+)?)/i,
        );
        if (provLabel) {
          provider = (provLabel[1] || "")
            .replace(/\s*,?\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C|FNP|ARNP|CNM|DDS|DMD).*/i, "")
            .trim();
        }
      }
      if (!provider) {
        const provB = raw.match(
          /\b([A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){1,4})\s*,\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C|FNP|ARNP|CNM|DDS|DMD)\b/i,
        );
        if (provB) provider = (provB[1] || "").trim();
      }
      if (!provider && reasonLine) {
        const cand = (lines[appIdx + 2] || "").trim();
        if (
          /^[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){1,4}(\s*,\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C))?$/i.test(
            cand,
          )
        ) {
          provider = cand.replace(/\s*,\s*(MD|M\.D\.|DO|D\.O\.|NP|PA-?C)$/i, "").trim();
        }
      }

      const toTitle = (value: string) =>
        value
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b\w/g, (match) => match.toUpperCase());

      const openAIHasGoodTitle =
        ocrSource === "openai" &&
        finalTitle &&
        finalTitle !== "Doctor Appointment" &&
        !/^\s*appointment\s*$/i.test(finalTitle);
      if (!openAIHasGoodTitle) {
        finalTitle = provider ? `${toTitle(apptType)} with Dr ${toTitle(provider)}` : toTitle(apptType);
      }

      const descParts: string[] = [];
      if (apptType && apptType !== "Doctor Appointment") descParts.push(`Appointment type: ${toTitle(apptType)}`);
      if (provider) descParts.push(`Provider: Dr ${toTitle(provider)}`);
      const facilityMatch = raw.match(/(?:Ascension|Sacred\s*Heart)[^.\n]*/i);
      if (facilityMatch) descParts.push(`Location: ${facilityMatch[0].trim()}`);

      const openAIHasGoodDesc =
        ocrSource === "openai" &&
        finalDescription &&
        finalDescription !== "Doctor Appointment." &&
        finalDescription.length > 20;
      if (!openAIHasGoodDesc) {
        finalDescription = descParts.length
          ? descParts.map((part) => (part.endsWith(".") ? part : `${part}.`)).join("\n")
          : `${toTitle(apptType)}.`;
      }
    }

    if (!isMedicalAppointment) {
      finalDescription = improveJoinUsFor(finalDescription, finalTitle, finalAddress);
    }

    try {
      if (!isMedicalAppointment && finalTitle && finalStart instanceof Date) {
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const day = finalStart.getDate();
        const ord = (n: number) => {
          if (n % 100 >= 11 && n % 100 <= 13) return "th";
          switch (n % 10) {
            case 1:
              return "st";
            case 2:
              return "nd";
            case 3:
              return "rd";
            default:
              return "th";
          }
        };
        const dateStr = `${monthNames[finalStart.getMonth()]} ${day}${ord(day)}`;
        const timeStr = finalStart
          .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
          .replace(":00 ", " ");
        finalDescription = `Join ${finalTitle} on ${dateStr}${timeStr ? ` at ${timeStr}` : ""}.`;
        keepTitleInDescription = true;
      }
    } catch {}

    const addressWithVenue = finalAddress;
    const splitLocation = splitVenueFromAddress(finalAddress, finalDescription, raw);
    finalAddress = splitLocation.address;
    if (splitLocation.venue) finalVenue = splitLocation.venue;
    if (!finalVenue) {
      const fallbackVenue = pickVenueLabelForSentence(addressWithVenue, finalDescription, raw);
      if (fallbackVenue) finalVenue = fallbackVenue;
    }

    const locationForNarrative = finalVenue
      ? `${finalVenue}${finalAddress ? `, ${finalAddress}` : ""}`
      : addressWithVenue || finalAddress;

    const isBirthdayForDesc = /(birthday|b-?day)/i.test(raw) || /birthday/i.test(finalTitle);
    let descriptionWasGeneratedAsBirthday = false;
    if (isBirthdayForDesc) {
      try {
        const venueLabel =
          finalVenue ||
          pickVenueLabelForSentence(addressWithVenue, finalDescription, raw) ||
          pickVenueLabelForSentence(finalAddress, finalDescription, raw) ||
          "";
        const venueForSentence = venueLabel || locationForNarrative || finalAddress;
        const nameMatch = finalTitle.match(/^([A-Z][A-Za-z’'-]+)['’]s/i);
        const ageOrdinalInTitle = finalTitle.match(/\b(\d{1,2})(st|nd|rd|th)\s+Birthday/i);
        let age = ageOrdinalInTitle ? `${ageOrdinalInTitle[1]}${ageOrdinalInTitle[2]}` : null;
        if (!age) {
          const ageCardinal = finalTitle.match(/\b(\d{1,2})\s+Birthday/i)?.[1];
          if (ageCardinal) {
            const suffix =
              ageCardinal === "11" || ageCardinal === "12" || ageCardinal === "13"
                ? "th"
                : ["th", "st", "nd", "rd"][Math.min(Number(ageCardinal) % 10, 4)] || "th";
            age = `${ageCardinal}${suffix}`;
          }
        }
        const name = nameMatch ? nameMatch[1] : null;
        const partyTheme = extractBirthdayPartyThemeFromTitle(finalTitle);
        const deterministic =
          name && partyTheme
            ? `Join us for ${partyTheme}${age ? ` — ${name}'s ${age} birthday` : ` — ${name}'s birthday`}${venueForSentence ? ` at ${venueForSentence}` : ""}.`
            : name
              ? `Join us to celebrate ${name}'s ${age ? `${age} ` : ""}Birthday${venueForSentence ? ` at ${venueForSentence}` : ""}.`
              : age
                ? `Join us to celebrate a ${age} Birthday${venueForSentence ? ` at ${venueForSentence}` : ""}.`
                : partyTheme
                  ? `Join us for ${partyTheme}${venueForSentence ? ` at ${venueForSentence}` : ""}.`
                  : venueForSentence
                    ? `Join us to celebrate a Birthday at ${venueForSentence}.`
                    : "Join us to celebrate a Birthday.";
        finalDescription = deterministic;
        descriptionWasGeneratedAsBirthday = true;

        if (enableRewrites) {
          const rewriteStartedAt = Date.now();
          const rewriteTimeoutMs = clampTimeoutMs(
            Math.min(OPENAI_TIMEOUT_MS, remainingBudgetMs(startedAt, totalBudgetMs, 2_500)),
            OPENAI_TIMEOUT_MS,
          );
          if (rewriteTimeoutMs >= 3_000) {
            const rewritten = await llmRewriteBirthdayDescription(
              finalTitle,
              venueForSentence,
              deterministic,
              rewriteTimeoutMs,
            );
            const cleaned = (rewritten || "").replace(/\s+/g, " ").trim();
            if (cleaned && /\.$/.test(cleaned) && cleaned.length >= 20 && cleaned.length <= 200) {
              const titleLower = finalTitle.toLowerCase();
              const cleanedLower = cleaned.toLowerCase();
              if (cleanedLower.includes(titleLower)) {
                const withoutTitle = cleaned
                  .replace(new RegExp(finalTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
                  .trim();
                finalDescription =
                  withoutTitle
                    .replace(/^[\s\n.,;:!?-]+/, "")
                    .replace(/[\s\n.,;:!?-]+$/, "")
                    .trim() || deterministic;
              } else {
                finalDescription = cleaned;
              }
            }
          }
          stage.rewriteMs += Date.now() - rewriteStartedAt;
        }
      } catch {}
    }

    if (
      enableRewrites &&
      (/(wedding|marriage|marieage|bride|groom|ceremony|reception|nupti(al)?)/i.test(raw) ||
        /(wedding|marriage)/i.test(finalTitle))
    ) {
      try {
        const rewriteStartedAt = Date.now();
        const rewriteTimeoutMs = clampTimeoutMs(
          Math.min(OPENAI_TIMEOUT_MS, remainingBudgetMs(startedAt, totalBudgetMs, 2_000)),
          OPENAI_TIMEOUT_MS,
        );
        if (rewriteTimeoutMs >= 3_000) {
          const weddingRewrite = await llmRewriteWedding(
            raw,
            finalTitle,
            locationForNarrative || finalAddress,
            rewriteTimeoutMs,
          );
          if (weddingRewrite?.title) finalTitle = weddingRewrite.title;
          if (weddingRewrite?.description) {
            let desc = weddingRewrite.description;
            if (!/o['’]?clock/i.test(raw) && /o['’]?clock/i.test(desc) && finalStart instanceof Date) {
              try {
                const timeStr = new Date(finalStart).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
                desc = desc.replace(/at\s+[^,\n]*o['’]?clock[^,\n]*/i, `at ${timeStr}`);
              } catch {}
            }
            finalDescription = desc;
          }
        }
        stage.rewriteMs += Date.now() - rewriteStartedAt;
      } catch {}
    }

    const isWedding = /(wedding|marriage)/i.test(finalTitle) || /(wedding|marriage)/i.test(raw);
    if (enableRewrites && !isBirthdayForDesc && !isWedding && !isMedicalAppointment) {
      try {
        const looksMultiline = /\n/.test(finalDescription) || (finalDescription || "").length > 180;
        const rewriteStartedAt = Date.now();
        const rewriteTimeoutMs = clampTimeoutMs(
          Math.min(OPENAI_TIMEOUT_MS, remainingBudgetMs(startedAt, totalBudgetMs, 1_500)),
          OPENAI_TIMEOUT_MS,
        );
        if (rewriteTimeoutMs >= 3_000) {
          const refined = await llmRewriteSmartDescription(
            raw,
            finalTitle,
            finalVenue ||
              pickVenueLabelForSentence(addressWithVenue, finalDescription, raw) ||
              finalAddress ||
              locationForNarrative,
            null,
            looksMultiline ? (finalTitle ? `${finalTitle}.` : "") : finalDescription,
            rewriteTimeoutMs,
          );
          const cleaned = (refined || "").replace(/\s+/g, " ").trim();
          if (cleaned && cleaned.length >= 20 && cleaned.length <= 200) {
            finalDescription = cleaned;
          }
        }
        stage.rewriteMs += Date.now() - rewriteStartedAt;
      } catch {}
    }

    const rawHasYearDigits = /\b(19|20)\d{2}\b/.test(raw);
    let containsExplicitYear = rawHasYearDigits;
    if (ocrSource === "openai") {
      if (typeof llmImage?.yearVisible === "boolean") containsExplicitYear = Boolean(llmImage.yearVisible);
      else containsExplicitYear = rawHasYearDigits;
    }
    if (!containsExplicitYear && finalStart instanceof Date) {
      const now = new Date();
      const oldStart = finalStart;
      const adjustedStart = resolveInferredInviteDatetime(now, oldStart);
      const yearDelta = adjustedStart.getFullYear() - oldStart.getFullYear();
      if (yearDelta !== 0 || adjustedStart.getTime() !== oldStart.getTime()) {
        const duration = finalEnd instanceof Date ? finalEnd.getTime() - oldStart.getTime() : null;
        finalStart = adjustedStart;
        if (duration !== null && duration > 0) {
          finalEnd = new Date(adjustedStart.getTime() + duration);
        } else if (finalEnd instanceof Date) {
          const endAdjusted = new Date(finalEnd);
          endAdjusted.setFullYear(endAdjusted.getFullYear() + yearDelta);
          finalEnd = endAdjusted;
        }
      }
    }

    if (finalEnd instanceof Date && finalStart instanceof Date) {
      const durationMs = finalEnd.getTime() - finalStart.getTime();
      const rangeProbe = `${raw}\n${finalDescription || ""}`;
      const dashRangeRe =
        /\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?\s*[-\u2013\u2014]\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?/i;
      const fromToRangeRe =
        /\bfrom\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?\s+(?:to|until|through|till|til)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?/i;
      const toWordRangeRe =
        /\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)\s+to\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?/i;
      const hasExplicitRange =
        dashRangeRe.test(rangeProbe) ||
        fromToRangeRe.test(rangeProbe) ||
        toWordRangeRe.test(rangeProbe);
      const hasRangeVerb = /(?:\buntil\b|\btill?\b|\bthrough\b)/i.test(rangeProbe);
      const hasMultipleIsoTimes = (rangeProbe.match(/T\d{1,2}:\d{2}/g) || []).length >= 2;
      const timeTokenSet = new Set<string>();
      for (const token of rangeProbe.match(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)\b/gi) || []) {
        timeTokenSet.add(token.toLowerCase().replace(/\s+/g, "").replace(/\./g, ""));
      }
      for (const token of rangeProbe.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) || []) {
        timeTokenSet.add(token.trim());
      }
      const spelledMatches =
        rangeProbe.match(/\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*o['\u2019]?clock\b/gi) ||
        [];
      const totalTimeMentions = timeTokenSet.size + spelledMatches.length;
      const looksLikeSingleTime =
        !hasExplicitRange &&
        !hasRangeVerb &&
        !hasMultipleIsoTimes &&
        totalTimeMentions <= 1;
      if (durationMs <= 0) finalEnd = null;
      else if (!llmReturnedEndString && looksLikeSingleTime) finalEnd = null;
    }

    if (typeof finalDescription === "string" && finalDescription.trim()) {
      if (!descriptionWasGeneratedAsBirthday && !isWedding && !keepTitleInDescription) {
        finalDescription = stripJoinUsLanguage(finalDescription.trim());
      }
    }

    if (!keepTitleInDescription && finalTitle && finalDescription) {
      const titleLower = finalTitle.toLowerCase().trim();
      const descLower = finalDescription.toLowerCase();
      if (descLower.startsWith(titleLower)) {
        finalDescription = finalDescription.substring(titleLower.length).trim();
        finalDescription = finalDescription.replace(/^[\s\n.,;:!?-]+/, "").trim();
      } else if (descLower.includes(titleLower)) {
        const titleRegex = new RegExp(finalTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        finalDescription = finalDescription
          .replace(titleRegex, "")
          .replace(/\s{2,}/g, " ")
          .replace(/^[\s\n.,;:!?-]+/, "")
          .replace(/[\s\n.,;:!?-]+$/, "")
          .trim();
      }
      try {
        const titleRegex = new RegExp(finalTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        finalDescription = finalDescription.replace(titleRegex, "").trim();
      } catch {}
    }
    if (finalDescription) {
      finalDescription = finalDescription.replace(/^([a-z])/, (match) => match.toUpperCase());
    }

    const description = finalDescription || "";
    let goodToKnowFinal: string | null =
      ocrSource === "openai" &&
      typeof llmImage?.goodToKnow === "string" &&
      llmImage.goodToKnow.trim()
        ? llmImage.goodToKnow.trim()
        : null;
    if (!goodToKnowFinal) {
      goodToKnowFinal =
        extractGuestReminderFromFlyerText(raw) ||
        extractGuestReminderFromFlyerText(description) ||
        null;
    }
    const extractedRsvp = extractRsvpDetails(raw, finalDescription);
    if (!deferredRsvp) {
      deferredRsvp = extractedRsvp.contact || extractRsvpCompact(raw, finalDescription);
    }
    if (!deferredRsvpUrl) {
      deferredRsvpUrl = extractedRsvp.url;
    }
    if (!deferredRsvpDeadline) {
      deferredRsvpDeadline = extractedRsvp.deadline;
    }
    const fieldsGuess = {
      title: finalTitle,
      start: toLocalNoZ(finalStart),
      end: toLocalNoZ(finalEnd),
      location: finalAddress,
      venue: finalVenue || null,
      description,
      timezone: "",
      rsvp: deferredRsvp || null,
      rsvpUrl: deferredRsvpUrl || null,
      rsvpDeadline: deferredRsvpDeadline || null,
      goodToKnow: goodToKnowFinal,
    };

    const tz = fieldsGuess.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const practiceSchedule = createEmptyPracticeSchedule(tz);
    const schedule = {
      detected: false,
      homeTeam: null as string | null,
      season: null as string | null,
      games: [] as any[],
    };
    let events: any[] = [];

    const dayMentions =
      raw.match(/\b(mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(rs(day)?)?|fri(day)?|sat(urday)?|sun(day)?)\b/gi) ||
      [];
    const hasTimeRange = /\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}/.test(raw) || /\b\d{1,2}:\d{2}\b/.test(raw);
    const hasPracticeKeyword = /(practice|training|schedule|team)/i.test(raw);
    const looksLikePracticeSchedule = hasPracticeKeyword && hasTimeRange && dayMentions.length >= 4;

    if (looksLikePracticeSchedule) {
      let practiceTz = tz;
      let practiceTitle: string | null = null;
      let practiceTimeframe: string | null = null;
      let practiceGroups: any[] = [];

      if (allowDeepScheduleExtraction) {
        try {
          const scheduleStartedAt = Date.now();
          const scheduleTimeoutMs = clampTimeoutMs(
            Math.min(OPENAI_TIMEOUT_MS, remainingBudgetMs(startedAt, totalBudgetMs, 2_000)),
            OPENAI_TIMEOUT_MS,
          );
          const llmPractice =
            scheduleTimeoutMs >= 3_000
              ? await llmExtractPracticeScheduleFromImage(ocrBuffer, visionMime, tz, scheduleTimeoutMs)
              : null;
          if (llmPractice?.groups?.length) {
            const locationHint = llmPractice.timezoneHint || finalAddress || fieldsGuess.location || "";
            practiceTz = inferTimezoneFromAddress(locationHint || "") || tz;
            for (const group of llmPractice.groups) {
              const groupName = String(group?.name || "Practice Group").trim() || "Practice Group";
              const groupNote = (group?.note && String(group.note).trim()) || null;
              const sessions = Array.isArray(group?.sessions) ? group.sessions : [];
              const normalizedSessions: any[] = [];
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
                  endParsed.minute,
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
                const descParts = [llmPractice.title?.trim() || null, llmPractice.timeframe?.trim() || null, groupNote, note]
                  .filter((value): value is string => Boolean((value || "").trim()))
                  .map((value) => value.trim());
                groupEvents.push({
                  title: `${groupName} Practice`,
                  start: occurrence.start,
                  end: occurrence.end,
                  allDay: false,
                  timezone: practiceTz,
                  location: "",
                  description: Array.from(new Set(descParts)).join("\n"),
                  recurrence: `RRULE:FREQ=WEEKLY;BYDAY=${dayInfo.code}`,
                  reminders: [{ minutes: 1440 }],
                  category: "Sport Events",
                });
              }
              if (normalizedSessions.length) {
                practiceGroups.push({
                  name: groupName,
                  note: groupNote,
                  sessions: normalizedSessions,
                  events: groupEvents,
                });
              }
            }
            practiceTitle = llmPractice.title || null;
            practiceTimeframe = llmPractice.timeframe || null;
          }
          stage.scheduleMs += Date.now() - scheduleStartedAt;
        } catch {}
      }

      const heuristic = parsePracticeScheduleHeuristics(lines, practiceTz);
      if (heuristic?.groups?.length) {
        const seen = new Set(practiceGroups.map((group) => String(group?.name || "").trim().toLowerCase()));
        for (const group of heuristic.groups) {
          const key = String(group?.name || "").trim().toLowerCase();
          if (!key || seen.has(key)) continue;
          practiceGroups.push(group);
          seen.add(key);
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

      if (practiceSchedule.detected && practiceSchedule.groups.length < 7) {
        try {
          const groupNameRe = /(\b[A-Z][A-Za-z]+\s+Group\b|\bLevel\s*\d+\b)/i;
          const normalized = lines.map((line) => line.trim()).filter(Boolean);
          const order: string[] = [];
          for (const token of normalized) {
            if (isDayToken(token)) {
              const code = DAY_NAME_TO_INDEX[normalizeDayToken(token)]?.code;
              if (code && order[order.length - 1] !== code) order.push(code);
            } else if (order.length) {
              break;
            }
          }
          if (order.length >= 3) {
            const seen = new Set(
              practiceSchedule.groups.map((group) => String(group?.name || "").trim().toLowerCase()),
            );
            for (let i = 0; i < normalized.length; i++) {
              const line = normalized[i];
              if (!groupNameRe.test(line)) continue;
              const name = (line.match(groupNameRe)![0] || line).trim();
              if (seen.has(name.toLowerCase())) continue;
              const values: string[] = [];
              let j = i + 1;
              while (j < normalized.length && values.length < order.length) {
                const candidate = normalized[j];
                if (!candidate) {
                  j++;
                  continue;
                }
                if (isDayToken(candidate)) {
                  j++;
                  continue;
                }
                if (groupNameRe.test(candidate)) break;
                values.push(candidate);
                j++;
              }
              const sessions: any[] = [];
              const groupEvents: any[] = [];
              for (let k = 0; k < Math.min(values.length, order.length); k++) {
                const parsedRange = parsePracticeTimeRange(values[k]);
                if (!parsedRange) continue;
                const dayInfo = DAY_NAME_TO_INDEX[normalizeDayToken(order[k])] || {
                  index: k,
                  code: order[k],
                };
                const occurrence = buildNextOccurrence(
                  practiceTz,
                  dayInfo.index,
                  parsedRange.startHour,
                  parsedRange.startMinute,
                  parsedRange.endHour,
                  parsedRange.endMinute,
                );
                const pad = (n: number) => String(n).padStart(2, "0");
                sessions.push({
                  day: dayInfo.code,
                  display: `${dayInfo.code} ${pad(parsedRange.startHour)}:${pad(parsedRange.startMinute)}-${pad(parsedRange.endHour)}:${pad(parsedRange.endMinute)}`,
                  hasPractice: true,
                  start: occurrence.start,
                  end: occurrence.end,
                  startTime: `${pad(parsedRange.startHour)}:${pad(parsedRange.startMinute)}`,
                  endTime: `${pad(parsedRange.endHour)}:${pad(parsedRange.endMinute)}`,
                  note: parsedRange.note,
                });
                groupEvents.push({
                  title: `${name} Practice`,
                  start: occurrence.start,
                  end: occurrence.end,
                  allDay: false,
                  timezone: practiceTz,
                  location: "",
                  description: [practiceTitle, practiceTimeframe, parsedRange.note].filter(Boolean).join("\n"),
                  recurrence: `RRULE:FREQ=WEEKLY;BYDAY=${dayInfo.code}`,
                  reminders: [{ minutes: 1440 }],
                  category: "Sport Events",
                });
              }
              practiceSchedule.groups.push({ name, note: null, sessions, events: groupEvents });
              seen.add(name.toLowerCase());
            }
          }
        } catch {}
      }
    }

    if (hasGymnasticsScheduleText(raw) && (gymOnly || forceLLM)) {
      const scheduleStartedAt = Date.now();
      const scheduleTimeoutMs = clampTimeoutMs(
        Math.min(OPENAI_TIMEOUT_MS, remainingBudgetMs(startedAt, totalBudgetMs, 1_500)),
        OPENAI_TIMEOUT_MS,
      );
      const llmSchedule =
        scheduleTimeoutMs >= 3_000
          ? await extractGymnasticsScheduleWithLlm({
              ocrBuffer,
              visionMime,
              timezone: tz,
              timeoutMs: scheduleTimeoutMs,
            })
          : null;
      stage.scheduleMs += Date.now() - scheduleStartedAt;
      if (llmSchedule?.events?.length) {
        schedule.detected = true;
        schedule.homeTeam = llmSchedule.homeTeam || schedule.homeTeam;
        schedule.season = llmSchedule.season || schedule.season;
        const homeAddress = llmSchedule.homeAddress || "";
        events = llmSchedule.events.map((rawEvent) => {
          const event = { ...rawEvent } as any;
          const titleText = String(event.title || "");
          const isAway = /\bat\b/i.test(titleText) && !/\bvs\.?\b/i.test(titleText);
          if (!event.location && !isAway && homeAddress) {
            event.location = homeAddress;
          }
          return { ...event, category: "Sport Events" };
        });
      }
    } else if (hasGymnasticsScheduleText(raw)) {
      const heuristic = extractGymnasticsScheduleHeuristics({
        raw,
        lines,
        timezone: tz,
        finalAddress: finalAddress || fieldsGuess.location || "",
      });
      schedule.detected = heuristic.schedule.detected;
      schedule.homeTeam = heuristic.schedule.homeTeam;
      schedule.season = heuristic.schedule.season;
      schedule.games = heuristic.schedule.games;
      events = heuristic.events;
    }

    if (practiceSchedule.detected) {
      fieldsGuess.location = "";
      fieldsGuess.start = null;
      fieldsGuess.end = null;
      const schedLabel = [practiceSchedule.title, practiceSchedule.timeframe]
        .filter((value) => (value || "").trim())
        .join(" — ");
      if (schedLabel) fieldsGuess.description = schedLabel;
    }

    let category: string | null = detectCategory(raw);
    if (practiceSchedule.detected) category = "Sport Events";

    const birthdayTemplateHint = normalizeBirthdayTemplateHint({
      category,
      rawText: raw,
      title: finalTitle,
      birthdayAudience: llmImage?.birthdayAudience,
      birthdaySignals: llmImage?.birthdaySignals,
      birthdayName: llmImage?.birthdayName,
      birthdayAge: llmImage?.birthdayAge,
    });
    const ocrSkin =
      isOcrInviteCategory(category)
        ? await inferOcrSkinSelection({
            category,
            imageBytes: colorBuffer,
            mimeType: colorMime,
            ocrText: raw,
            fieldsGuess: {
              title: fieldsGuess.title,
              location: fieldsGuess.location,
              description: fieldsGuess.description,
            },
            birthdayHint:
              category === "Birthdays"
                ? {
                    audience: birthdayTemplateHint.audience,
                    honoreeName: birthdayTemplateHint.honoreeName,
                    age: birthdayTemplateHint.age,
                    themeId: birthdayTemplateHint.themeId,
                  }
                : null,
          })
        : null;

    void (async () => {
      try {
        const session = await getServerSession(authOptions);
        const email = session?.user?.email as string | undefined;
        if (!email) return;
        try {
          await incrementUserScanCounters({ email, category });
        } catch {}
      } catch {}
    })();

    const ocrTiming = {
      totalMs: Date.now() - startedAt,
      preprocessMs: stage.preprocessMs,
      primaryOcrMs: stage.primaryOcrMs,
      fallbackOcrMs: stage.fallbackOcrMs,
      rewriteMs: stage.rewriteMs,
      scheduleMs: stage.scheduleMs,
      fastMode,
      enableRewrites,
      turboMode,
      model: ocrModel,
      ocrSource,
    };
    log(">>> OCR timing (ms)", ocrTiming);

    const responseBody: any = {
      intakeId: null,
      ocrText: raw,
      fieldsGuess,
      practiceSchedule,
      schedule,
      events,
      category,
      birthdayTemplateHint,
      ocrSkin,
      ocrSource,
    };
    if (includeTimings) {
      responseBody.timing = ocrTiming;
    }

    return corsJson(request, responseBody, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return corsJson(request, { error: "OCR route failed", detail: message }, { status: 500 });
  }
}
