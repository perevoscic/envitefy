const SUPPORTED_MODES = [
  "social",
  "family",
  "school",
  "sports",
  "gymnastics",
  "team",
  "class",
  "community",
  "business",
  "planner",
];

const WEEKDAY_CODES = {
  sunday: "SU",
  sun: "SU",
  monday: "MO",
  mon: "MO",
  tuesday: "TU",
  tue: "TU",
  tues: "TU",
  wednesday: "WE",
  wed: "WE",
  thursday: "TH",
  thu: "TH",
  thur: "TH",
  thurs: "TH",
  friday: "FR",
  fri: "FR",
  saturday: "SA",
  sat: "SA",
};

const WEEKDAY_INDEX = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function cleanString(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function titleCase(value) {
  return cleanString(value)
    .split(" ")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : ""))
    .join(" ");
}

function uniqueStrings(values) {
  return Array.from(
    new Set(
      values
        .map((value) => cleanString(value))
        .filter(Boolean),
    ),
  );
}

function toDateOnly(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
}

function timeParts(value) {
  const raw = cleanString(value).toLowerCase();
  const match = raw.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || "0");
  const meridian = match[3] || "";
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) return null;
  if (/p/.test(meridian) && hour < 12) hour += 12;
  if (/a/.test(meridian) && hour === 12) hour = 0;
  if (!meridian && hour >= 1 && hour <= 7) hour += 12;
  return {
    hour,
    minute,
    local: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    inferredMeridian: !meridian,
  };
}

function extractTimeAfterAt(text) {
  const match = cleanString(text).match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)/i);
  return match ? timeParts(match[1]) : null;
}

function offsetDate(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isoAtLocalDate(date, timeLocal = "09:00") {
  const [hourText, minuteText] = timeLocal.split(":");
  const result = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    Number(hourText || 0),
    Number(minuteText || 0),
    0,
  ));
  return result.toISOString();
}

function parseMonthDay(text, referenceDate) {
  const cleaned = cleanString(text);
  const match = cleaned.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*[-–]\s*\d{1,2}(?:st|nd|rd|th)?)?(?:,?\s+(\d{4}))?\b/i,
  );
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase().replace(/\.$/, "")];
  const day = Number(match[2]);
  if (!Number.isInteger(month) || !Number.isInteger(day) || day < 1 || day > 31) return null;
  let year = match[3] ? Number(match[3]) : referenceDate.getUTCFullYear();
  let date = new Date(Date.UTC(year, month, day, 9, 0, 0));
  const inferredYear = !match[3];
  if (inferredYear && date.getTime() + 86400000 < referenceDate.getTime()) {
    year += 1;
    date = new Date(Date.UTC(year, month, day, 9, 0, 0));
  }
  return { date, inferredYear, sourceText: match[0] };
}

function nextWeekdayDate(referenceDate, weekdayCode, weekOffset = 0) {
  const target = WEEKDAY_INDEX[weekdayCode];
  if (!Number.isInteger(target)) return null;
  const start = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
    9,
    0,
    0,
  ));
  const current = start.getUTCDay();
  let delta = (target - current + 7) % 7;
  if (weekOffset > 0) {
    delta += 7 * weekOffset;
  } else if (delta === 0) {
    delta = 7;
  }
  return offsetDate(start, delta);
}

function weekdayCodesFromText(text) {
  const lower = cleanString(text).toLowerCase();
  const codes = [];
  for (const [word, code] of Object.entries(WEEKDAY_CODES)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(lower) && !codes.includes(code)) {
      codes.push(code);
    }
  }
  return codes.sort((a, b) => WEEKDAY_INDEX[a] - WEEKDAY_INDEX[b]);
}

function inferPersonName(text) {
  const cleaned = cleanString(text);
  const possessive = cleaned.match(/\b([A-Z][a-zA-Z'-]{1,30})(?:'s|’s)\b/);
  if (possessive?.[1] && !/^(?:men|women|boys|girls)$/i.test(possessive[1])) return possessive[1];
  const leading = cleaned.match(/^\s*([A-Z][a-zA-Z'-]{1,30})\s+(?:has|needs|is|turns|turning)\b/);
  if (leading?.[1]) return leading[1];
  const forName = cleaned.match(/\bfor\s+([A-Z][a-zA-Z'-]{1,30})\b/);
  return forName?.[1] || "";
}

function locationFromText(text) {
  const cleaned = cleanString(text);
  const meetSite = cleaned.match(
    /\bMEET SITE:\s+(.+?)(?=\s+MEET DIRECTOR:|\s+MEET CONTACT:|\s+EQUIPMENT:|\s+LEVELS:|$)/i,
  );
  if (meetSite?.[1]) return cleanString(meetSite[1]);
  const exact = cleaned.match(/\b(?:at|in)\s+([A-Z][a-zA-Z0-9' .-]{1,70}(?:,\s*[A-Z]{2})?)(?=\s+(?:with|and|plus|on|at|for|from|team|invite|need)\b|[.;]|$)/);
  return cleanString(exact?.[1]);
}

function titleFromGymnasticsPacket(text) {
  const compact = cleanString(text);
  const inline = compact.match(
    /\b((?:\d+\s*(?:st|nd|rd|th)\s+)?(?:annual\s+)?[A-Z0-9'’ -]{3,80}?\b(?:classic|invitational|championships?|state|regional|national))\b/i,
  );
  if (inline?.[1]) {
    return titleCase(inline[1].replace(/\b(\d+)\s+(st|nd|rd|th)\b/gi, "$1$2"));
  }
  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => cleanString(line))
    .filter(Boolean);
  const candidate =
    lines.find((line) => /\b(?:classic|invitational|championships?|state|regional|national)\b/i.test(line)) ||
    "";
  if (!candidate) return "";
  return titleCase(candidate.replace(/\b(\d+)\s+(st|nd|rd|th)\b/gi, "$1$2"));
}

function detectEventType(text) {
  const lower = cleanString(text).toLowerCase();
  if (/\bgymnastics?\b|\bgym\s+meet\b|\bmeet\b.*\bgym/.test(lower)) return "gymnastics_meet";
  if (/\bpractice\b/.test(lower) && /\bgym|team|sport|soccer|football|basketball/.test(lower)) {
    return lower.includes("gym") ? "gymnastics_practice" : "team_practice";
  }
  if (/\bspirit\s+week\b/.test(lower)) return "spirit_week";
  if (/\bfield\s+trip\b/.test(lower)) return "field_trip";
  if (/\bclass\s+party\b|\bvalentine/.test(lower)) return "class_party";
  if (/\bfundraiser\b/.test(lower)) return "fundraiser";
  if (/\bbirthday|pool\s+party|turning|turns\b/.test(lower)) return "birthday_party";
  if (/\bbaby\s+shower\b/.test(lower)) return "baby_shower";
  if (/\bgraduation\b/.test(lower)) return "graduation_party";
  if (/\bteam\s+dinner\b/.test(lower)) return "team_dinner";
  if (/\buniform\s+pickup\b/.test(lower)) return "uniform_pickup";
  if (/\bfee\s+deadline|payment\s+deadline\b/.test(lower)) return "fee_deadline";
  if (/\bworkshop|open\s+house|networking\b/.test(lower)) return "workshop_open_house";
  return "general_event";
}

export function detectEventMode(input) {
  const text = cleanString(typeof input === "string" ? input : input?.text).toLowerCase();
  if (!text) return { mode: "social", confidence: 0.35, signals: [] };
  const scores = Object.fromEntries(SUPPORTED_MODES.map((mode) => [mode, 0]));
  const signals = [];
  const add = (mode, points, label) => {
    scores[mode] += points;
    signals.push({ mode, label });
  };

  if (/\bgymnastics?\b|\bgym\s+meet\b|\bwarm[-\s]?up\b|\bmeet\b/.test(text)) add("gymnastics", 5, "gymnastics or meet language");
  if (/\bpractice\b|\btournament\b|\bgame\b|\bteam\s+dinner\b|\buniform\b/.test(text)) add("team", 3, "team schedule language");
  if (/\bsoccer|football|basketball|baseball|volleyball|sports?\b/.test(text)) add("sports", 3, "sports language");
  if (/\bschool|teacher|class\s+party|field\s+trip|spirit\s+week|early\s+dismissal|canned\s+food\b/.test(text)) add("school", 5, "school workflow language");
  if (/\bclass|program|registration|roster|waitlist\b/.test(text)) add("class", 3, "class or program language");
  if (/\bbirthday|baby\s+shower|graduation|pool\s+party|wedding|gender\s+reveal|reunion\b/.test(text)) add("social", 4, "social event language");
  if (/\bfamily|parents?|grandparents?|kid|kids|guardian\b/.test(text)) add("family", 2, "family coordination language");
  if (/\bfundraiser|church|community|club|volunteer\b/.test(text)) add("community", 3, "community planning language");
  if (/\bworkshop|open\s+house|networking|professional|client\b/.test(text)) add("business", 4, "business event language");
  if (/\bplanner|vendor|timeline|run\s+of\s+show\b/.test(text)) add("planner", 3, "planner workflow language");

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [mode, score] = entries[0];
  return {
    mode: score > 0 ? mode : "social",
    confidence: Math.min(0.95, Math.max(0.45, 0.45 + score / 10)),
    signals: signals.filter((signal) => signal.mode === mode).map((signal) => signal.label),
  };
}

function buildBaseDraft(text, context) {
  const modeResult = detectEventMode(text);
  const eventType = detectEventType(text);
  const name = inferPersonName(text);
  const titleSeed =
    eventType === "birthday_party" && name
      ? `${name}'s Birthday Party`
      : eventType === "gymnastics_meet" && name
        ? `${name} Gymnastics Schedule`
        : eventType === "spirit_week" && name
          ? `${name} Spirit Week`
          : eventType === "class_party"
            ? "Class Party Signup"
            : eventType === "workshop_open_house"
              ? "Workshop or Open House"
              : "Event Plan";
  const title = titleCase(
    cleanString(context?.title) ||
      (eventType === "gymnastics_meet" ? titleFromGymnasticsPacket(text) : "") ||
      titleSeed,
  );
  const timezone = cleanString(context?.timezone) || "America/Chicago";
  return {
    mode: modeResult.mode,
    eventType,
    confidence: modeResult.confidence,
    title,
    summary: buildSummary(modeResult.mode, eventType, text),
    timezone,
    originalText: text,
    program: {
      title: buildProgramTitle({ name, mode: modeResult.mode, eventType, title }),
      mode: modeResult.mode,
    },
    series: [],
    occurrences: [],
    forms: [],
    rsvpQuestions: [],
    volunteerSlots: [],
    paymentItems: [],
    reminders: [],
    checklistItems: [],
    missingFields: [],
    followupQuestion: null,
    inferredFields: [],
    source: {
      kind: context?.sourceKind || "text",
      originalText: text,
    },
  };
}

function buildSummary(mode, eventType, text) {
  if (mode === "gymnastics") {
    return "Gymnastics schedule with practices, meet details, reminders, and packing tasks.";
  }
  if (eventType === "spirit_week") return "School spirit week schedule with daily reminders.";
  if (eventType === "class_party") return "Class party plan with signup slots and parent responses.";
  if (eventType === "birthday_party") return "Birthday event page with RSVP and planning checklist.";
  const cleaned = cleanString(text);
  return cleaned ? cleaned.slice(0, 220) : "Event plan created by Envitefy Concierge.";
}

function buildProgramTitle({ name, mode, eventType, title }) {
  if (mode === "gymnastics" && name) return `${name} Gymnastics Season`;
  if (mode === "school" && eventType === "spirit_week" && name) return `${name} School Week`;
  if (mode === "school") return "School Events";
  if (mode === "team" && name) return `${name} Team Schedule`;
  if (mode === "class") return "Class Program";
  return title;
}

function applyRecurringSeries(draft, text) {
  const recurrence = text.match(/\bevery\s+(.{3,80}?)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)/i);
  if (!recurrence) return;
  const dayCodes = weekdayCodesFromText(recurrence[1]);
  const time = timeParts(recurrence[2]);
  if (!dayCodes.length || !time) return;
  const seriesTitle = draft.mode === "gymnastics" ? "Gymnastics Practice" : "Recurring Schedule";
  draft.series.push({
    title: seriesTitle,
    type: draft.mode === "gymnastics" ? "practice" : "recurring",
    recurrenceRule: `FREQ=WEEKLY;BYDAY=${dayCodes.join(",")}`,
    startTimeLocal: time.local,
    durationMinutes: draft.mode === "gymnastics" ? 90 : 60,
    timezone: draft.timezone,
  });
  if (time.inferredMeridian) draft.inferredFields.push("practice time period");
  if (!/\buntil|through|ends?\b/i.test(text)) draft.missingFields.push("season end date");
}

function applyDatedOccurrences(draft, text, referenceDate) {
  const date = parseMonthDay(text, referenceDate);
  if (!date) return;
  const time = extractTimeAfterAt(text);
  const location = locationFromText(text);
  const eventType = detectEventType(text);
  const occurrenceTitle =
    eventType === "gymnastics_meet"
      ? "Gymnastics Meet"
      : eventType === "birthday_party"
        ? draft.title
        : eventType === "field_trip"
          ? "Field Trip"
          : eventType === "team_dinner"
            ? "Team Dinner"
            : titleCase(eventType.replace(/_/g, " "));
  const startAt = time ? isoAtLocalDate(date.date, time.local) : null;
  const endAt = time
    ? isoAtLocalDate(
        date.date,
        addMinutesToLocalTime(time.local, eventType === "gymnastics_meet" ? 180 : 120),
      )
    : null;
  draft.occurrences.push({
    title: occurrenceTitle,
    type: eventType === "gymnastics_meet" ? "meet" : "event",
    date: toDateOnly(date.date),
    dateText: date.sourceText,
    startAt,
    endAt,
    timezone: draft.timezone,
    locationText: location || "",
    status: "scheduled",
  });
  if (date.inferredYear) draft.inferredFields.push("date year");
  if (!time) draft.missingFields.push(`${occurrenceTitle.toLowerCase()} time`);
  if (!location) draft.missingFields.push(`${occurrenceTitle.toLowerCase()} location`);

  if (/\bteam\s+dinner\b/i.test(text)) {
    const dinnerDate = offsetDate(date.date, -1);
    draft.occurrences.push({
      title: "Team Dinner",
      type: "team_dinner",
      startAt: isoAtLocalDate(dinnerDate, "18:00"),
      endAt: isoAtLocalDate(dinnerDate, "19:30"),
      timezone: draft.timezone,
      locationText: "",
      status: "scheduled",
    });
    draft.missingFields.push("team dinner location");
  }
}

function addMinutesToLocalTime(timeLocal, minutes) {
  const [hourText, minuteText] = timeLocal.split(":");
  const total = Number(hourText || 0) * 60 + Number(minuteText || 0) + minutes;
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function applySpiritWeek(draft, text, referenceDate) {
  if (!/\bspirit\s+week\b/i.test(text)) return;
  const dayPattern =
    /\b(monday|tuesday|wednesday|thursday|friday)\s*(?:-|:)?\s+([^,.;]+?)(?=\s*,?\s*(?:monday|tuesday|wednesday|thursday|friday)\b|[,.;]|$)/gi;
  const weekOffset = /\bnext\s+week\b/i.test(text) ? 1 : 0;
  for (let match = dayPattern.exec(text); match; match = dayPattern.exec(text)) {
    const code = WEEKDAY_CODES[match[1].toLowerCase()];
    const date = nextWeekdayDate(referenceDate, code, weekOffset);
    if (!date) continue;
    const theme = cleanString(match[2]).replace(/^is\s+/i, "");
    draft.occurrences.push({
      title: titleCase(theme),
      type: /dismissal/i.test(theme) ? "deadline" : "school_day",
      startAt: isoAtLocalDate(date, /dismissal/i.test(theme) ? "12:00" : "08:00"),
      endAt: isoAtLocalDate(date, /dismissal/i.test(theme) ? "12:30" : "15:00"),
      timezone: draft.timezone,
      locationText: "",
      status: "scheduled",
      notes: `${titleCase(match[1])}: ${theme}`,
    });
  }
  if (!draft.occurrences.length) draft.missingFields.push("spirit week daily themes");
}

function applyClassPartyDefaults(draft, text) {
  if (draft.eventType !== "class_party") return;
  const count = text.match(/\b(\d{1,3})\s+(?:kids|students|children)\b/i);
  draft.rsvpQuestions.push(
    { key: "student_name", label: "Student name", type: "text", required: true },
    { key: "adult_attending", label: "Will an adult attend?", type: "yes_no", required: false },
  );
  draft.volunteerSlots.push(
    { title: "Snacks", quantityNeeded: 4, group: "Food" },
    { title: "Drinks", quantityNeeded: 3, group: "Food" },
    { title: "Setup help", quantityNeeded: 2, group: "Setup" },
    { title: "Cleanup help", quantityNeeded: 2, group: "Cleanup" },
  );
  draft.forms.push({
    title: "Parent Response Form",
    description: count?.[1] ? `Collect responses for ${count[1]} kids.` : "Collect parent responses.",
    fields: [
      { key: "parent_name", label: "Parent name", type: "text", required: true },
      { key: "student_name", label: "Student name", type: "text", required: true },
      { key: "allergies", label: "Food allergies or notes", type: "textarea", required: false },
    ],
  });
}

function applyBirthdayDefaults(draft, text) {
  if (draft.eventType !== "birthday_party") return;
  const theme = text.match(/\b([a-zA-Z' -]{2,24})\s+theme\b/i);
  const location = locationFromText(text);
  if (theme?.[1]) draft.theme = titleCase(theme[1]);
  if (/pool\s+party/i.test(text) && !draft.title.toLowerCase().includes("pool")) {
    draft.title = draft.title.replace(/\s+Party$/i, " Pool Party");
  }
  if (!draft.occurrences.length) {
    draft.missingFields.push("event date", "event time");
    if (!location) draft.missingFields.push("event location");
  }
  draft.rsvpQuestions.push(
    { key: "guest_count", label: "How many guests?", type: "number", required: false },
    { key: "food_notes", label: "Food allergies or notes", type: "textarea", required: false },
  );
}

function applyFoundationDefaults(draft) {
  draft.forms = draft.forms.length ? draft.forms : generateDefaultForms(draft.mode, draft.eventType);
  draft.reminders = generateDefaultReminders(draft.mode, draft.eventType, draft.occurrences);
  draft.checklistItems = generateDefaultChecklist(draft.mode, draft.eventType);
  draft.missingFields = uniqueStrings(draft.missingFields);
  draft.inferredFields = uniqueStrings(draft.inferredFields);
  draft.followupQuestion = buildFollowupQuestion(draft.missingFields);
}

function buildFollowupQuestion(missingFields) {
  const missing = uniqueStrings(missingFields);
  if (!missing.length) return null;
  if (missing.length === 1) return `What is the ${missing[0]}?`;
  return `What are the ${missing.slice(0, 2).join(" and ")}?`;
}

export function parseConciergeInput(input, context = {}) {
  const text = cleanString(typeof input === "string" ? input : input?.text || input?.message);
  const referenceDate = context.referenceDate ? new Date(context.referenceDate) : new Date();
  const draft = buildBaseDraft(text, context);
  applyRecurringSeries(draft, text);
  applySpiritWeek(draft, text, referenceDate);
  applyDatedOccurrences(draft, text, referenceDate);
  applyClassPartyDefaults(draft, text);
  applyBirthdayDefaults(draft, text);
  applyFoundationDefaults(draft);
  return draft;
}

function recurrenceByDay(rule) {
  const match = cleanString(rule).match(/BYDAY=([^;]+)/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code in WEEKDAY_INDEX);
}

function occurrenceKey(date, seriesId = "") {
  return `${seriesId}:${toDateOnly(date)}`;
}

export function generateOccurrences(series, range = {}, exceptions = []) {
  const byDays = recurrenceByDay(series?.recurrenceRule);
  if (!byDays.length) return [];
  const start = new Date(range.start || new Date().toISOString());
  const end = new Date(range.end || offsetDate(start, 60).toISOString());
  const exceptionByDate = new Map(
    (Array.isArray(exceptions) ? exceptions : []).map((item) => [
      cleanString(item?.date || (item?.originalStartAt || "").slice(0, 10)),
      item,
    ]),
  );
  const out = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  while (cursor <= end) {
    const code = Object.entries(WEEKDAY_INDEX).find(([, index]) => index === cursor.getUTCDay())?.[0];
    if (code && byDays.includes(code)) {
      const dateKey = toDateOnly(cursor);
      const exception = exceptionByDate.get(dateKey);
      if (exception?.action !== "cancel") {
        const startAt = exception?.startAt || isoAtLocalDate(cursor, series.startTimeLocal || "09:00");
        const endAt =
          exception?.endAt ||
          isoAtLocalDate(
            cursor,
            addMinutesToLocalTime(series.startTimeLocal || "09:00", series.durationMinutes || 60),
          );
        out.push({
          id: occurrenceKey(cursor, series.id || series.title || "series"),
          seriesId: series.id || null,
          title: exception?.title || series.title || "Scheduled event",
          type: series.type || "recurring",
          startAt,
          endAt,
          timezone: series.timezone || "America/Chicago",
          status: exception?.status || "scheduled",
          exception,
        });
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function applyOccurrenceException(occurrence, exception) {
  const action = cleanString(exception?.action || exception?.type).toLowerCase();
  if (action === "cancel") {
    return { ...occurrence, status: "canceled", exception: { ...exception, action: "cancel" } };
  }
  if (action === "move") {
    return {
      ...occurrence,
      startAt: exception.startAt || occurrence.startAt,
      endAt: exception.endAt || occurrence.endAt,
      status: "scheduled",
      exception: { ...exception, action: "move" },
    };
  }
  if (action === "modify") {
    return { ...occurrence, ...exception.patch, exception: { ...exception, action: "modify" } };
  }
  return occurrence;
}

function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  const a0 = new Date(aStart).getTime();
  const a1 = new Date(aEnd || aStart).getTime();
  const b0 = new Date(bStart).getTime();
  const b1 = new Date(bEnd || bStart).getTime();
  if ([a0, a1, b0, b1].some((value) => Number.isNaN(value))) return false;
  return a0 < b1 && b0 < a1;
}

function shared(valuesA, valuesB) {
  const a = Array.isArray(valuesA) ? valuesA.map(String) : [];
  const b = new Set(Array.isArray(valuesB) ? valuesB.map(String) : []);
  return a.filter((value) => b.has(value));
}

export function detectScheduleConflicts(occurrences) {
  const items = Array.isArray(occurrences) ? occurrences : [];
  const conflicts = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (!intervalsOverlap(a.startAt, a.endAt, b.startAt, b.endAt)) continue;
      const participantIds = shared(a.participantIds, b.participantIds);
      const resourceIds = shared(a.resourceIds, b.resourceIds);
      const sameVenue =
        cleanString(a.venueId || a.locationText) &&
        cleanString(a.venueId || a.locationText).toLowerCase() ===
          cleanString(b.venueId || b.locationText).toLowerCase();
      if (!participantIds.length && !resourceIds.length && !sameVenue) continue;
      conflicts.push({
        occurrenceIds: [a.id || a.title, b.id || b.title],
        reason: participantIds.length
          ? "participant_overlap"
          : resourceIds.length
            ? "resource_overlap"
            : "venue_overlap",
        participantIds,
        resourceIds,
      });
    }
  }
  return conflicts;
}

export function generateDefaultForms(mode, eventType) {
  if (eventType === "class_party" || mode === "school") {
    return [
      {
        title: "Parent Response Form",
        description: "Collect parent details, student name, and food notes.",
        fields: [
          { key: "parent_name", label: "Parent name", type: "text", required: true },
          { key: "student_name", label: "Student name", type: "text", required: true },
          { key: "allergies", label: "Allergies or notes", type: "textarea", required: false },
        ],
      },
    ];
  }
  if (mode === "gymnastics" || mode === "team") {
    return [
      {
        title: "Team RSVP",
        description: "Track athlete attendance and family notes.",
        fields: [
          { key: "athlete_name", label: "Athlete name", type: "text", required: true },
          { key: "family_attending", label: "Family attending?", type: "yes_no", required: false },
          { key: "travel_notes", label: "Travel notes", type: "textarea", required: false },
        ],
      },
    ];
  }
  return [
    {
      title: "Guest RSVP",
      description: "Collect guest names and helpful notes.",
      fields: [
        { key: "guest_name", label: "Guest name", type: "text", required: true },
        { key: "guest_count", label: "Guest count", type: "number", required: false },
        { key: "notes", label: "Notes for the host", type: "textarea", required: false },
      ],
    },
  ];
}

export function validateFormSchema(form) {
  if (!form || typeof form !== "object") return { ok: false, errors: ["Form is required."] };
  const fields = Array.isArray(form.fields) ? form.fields : [];
  const errors = [];
  const seen = new Set();
  if (!cleanString(form.title)) errors.push("Form title is required.");
  for (const field of fields) {
    const key = cleanString(field?.key);
    if (!key) errors.push("Each field needs a key.");
    if (seen.has(key)) errors.push(`Duplicate field key: ${key}.`);
    seen.add(key);
    if (!cleanString(field?.label)) errors.push(`Field ${key || "without a key"} needs a label.`);
  }
  return { ok: errors.length === 0, errors };
}

export function generateDefaultReminders(mode, eventType, occurrences = []) {
  const firstStart = occurrences.find((item) => item?.startAt)?.startAt || null;
  const reminders = [];
  if (firstStart) {
    reminders.push({
      title: "One week reminder",
      reminderType: "deadline",
      channel: "email",
      scheduledFor: offsetIso(firstStart, -7),
      status: "draft",
    });
    reminders.push({
      title: mode === "gymnastics" ? "Packing reminder" : "Day-of reminder",
      reminderType: mode === "gymnastics" ? "packing" : "custom",
      channel: "email",
      scheduledFor: offsetIso(firstStart, -1),
      status: "draft",
    });
  }
  if (eventType === "class_party") {
    reminders.push({
      title: "Volunteer signup reminder",
      reminderType: "bring_item",
      channel: "email",
      scheduledFor: firstStart ? offsetIso(firstStart, -3) : null,
      status: "draft",
    });
  }
  return reminders;
}

function offsetIso(value, days) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function generateDefaultChecklist(mode, eventType) {
  if (mode === "gymnastics") {
    return [
      { title: "Competition leo or uniform", category: "Packing", status: "open" },
      { title: "Grips, tape, and water bottle", category: "Packing", status: "open" },
      { title: "Confirm arrival time", category: "Logistics", status: "open" },
      { title: "Share schedule with grandparents", category: "Family", status: "open" },
    ];
  }
  if (eventType === "class_party") {
    return [
      { title: "Confirm allergy notes", category: "Safety", status: "open" },
      { title: "Assign snack and drink slots", category: "Signup", status: "open" },
      { title: "Send parent reminder", category: "Reminders", status: "open" },
    ];
  }
  if (eventType === "birthday_party") {
    return [
      { title: "Confirm guest list", category: "Planning", status: "open" },
      { title: "Add RSVP deadline", category: "RSVP", status: "open" },
      { title: "Share event page", category: "Publish", status: "open" },
    ];
  }
  return [{ title: "Review details before publishing", category: "Planning", status: "open" }];
}

export function claimVolunteerSlotState(slot, existingClaims, nextClaim) {
  const claims = Array.isArray(existingClaims) ? existingClaims : [];
  const quantity = Math.max(1, Number(nextClaim?.quantity || 1));
  const claimed = claims
    .filter((claim) => claim.status !== "canceled")
    .reduce((sum, claim) => sum + Math.max(1, Number(claim.quantity || 1)), 0);
  const capacity = Math.max(1, Number(slot?.quantityNeeded || slot?.quantity_needed || 1));
  if (claimed + quantity > capacity) {
    return { ok: false, error: "This signup slot is already full.", claims };
  }
  return {
    ok: true,
    claims: [
      ...claims,
      {
        ...nextClaim,
        quantity,
        status: "claimed",
        claimedAt: new Date().toISOString(),
      },
    ],
  };
}

export function markPaymentStatus(paymentRequest, status, metadata = {}) {
  const normalized = cleanString(status).toLowerCase();
  const allowed = new Set(["unpaid", "pending", "paid", "waived", "refunded", "canceled"]);
  if (!allowed.has(normalized)) {
    return { ok: false, error: "Unsupported payment status.", paymentRequest };
  }
  return {
    ok: true,
    paymentRequest: {
      ...paymentRequest,
      status: normalized,
      paidAt: normalized === "paid" ? metadata.paidAt || new Date().toISOString() : paymentRequest?.paidAt || null,
      updatedAt: new Date().toISOString(),
    },
  };
}

function escapeIcs(value) {
  return cleanString(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildIcsFeed(scope) {
  const events = Array.isArray(scope?.occurrences) ? scope.occurrences : [];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Envitefy//Concierge V2//EN",
    `X-WR-CALNAME:${escapeIcs(scope?.name || "Envitefy Schedule")}`,
  ];
  for (const event of events) {
    const start = icsDate(event.startAt);
    if (!start) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcs(event.id || `${event.title}-${start}`)}@envitefy`,
      `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${start}`,
    );
    const end = icsDate(event.endAt);
    if (end) lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${escapeIcs(event.title || "Envitefy event")}`);
    if (event.locationText) lines.push(`LOCATION:${escapeIcs(event.locationText)}`);
    if (event.notes) lines.push(`DESCRIPTION:${escapeIcs(event.notes)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
