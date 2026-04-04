import { llmExtractGymnasticsScheduleFromImage } from "./openai";

const MONTH_MAP: Record<string, number> = {
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

export function hasGymnasticsScheduleText(raw: string): boolean {
  return /gymnastics/i.test(raw) && /schedule/i.test(raw);
}

export async function extractGymnasticsScheduleWithLlm(params: {
  ocrBuffer: Buffer;
  visionMime: string;
  timezone: string;
  timeoutMs: number;
}) {
  return llmExtractGymnasticsScheduleFromImage(
    params.ocrBuffer,
    params.visionMime,
    params.timezone,
    params.timeoutMs,
  );
}

export function extractGymnasticsScheduleHeuristics(params: {
  raw: string;
  lines: string[];
  timezone: string;
  finalAddress: string;
}) {
  const schedule = {
    detected: true as boolean,
    homeTeam: null as string | null,
    season: null as string | null,
    games: [] as any[],
  };
  const events: any[] = [];
  const yearMatch =
    params.raw.match(/\b(20\d{2})\b.*?gymnastics.*?schedule/i) ||
    params.raw.match(/gymnastics.*?schedule.*?\b(20\d{2})\b/i);
  const season = yearMatch ? yearMatch[1] : null;
  schedule.season = season;

  const acr = params.lines.find((line) => /^[A-Z]{2,6}$/.test(line.trim())) || null;
  schedule.homeTeam = acr;

  const monthRe =
    /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i;
  const dateStartRe = new RegExp(`^\\s*${monthRe.source}\\s*\\b(\\d{1,2})\\b`, "i");
  type Block = { month: string; day: number; text: string };
  const blocks: Block[] = [];
  for (let i = 0; i < params.lines.length; i++) {
    const line = params.lines[i];
    const match = line.match(dateStartRe);
    if (!match) continue;
    const month = (match[1] || match[0]).toLowerCase();
    const day = Number(match[2] || match[1]);
    let text = line;
    let j = i + 1;
    while (j < params.lines.length && !dateStartRe.test(params.lines[j])) {
      const next = params.lines[j];
      if (/home\b|away\b|mac\s*meets?/i.test(next) || /^\s*$/.test(next)) break;
      text += `\n${next}`;
      j++;
    }
    i = j - 1;
    blocks.push({ month, day, text });
  }

  const normalizeOpponents = (
    value: string,
  ): { homeAway: "home" | "away"; opponents: string[]; label: string } | null => {
    const text = value.replace(/\s+/g, " ").trim();
    let homeAway: "home" | "away" | null = null;
    let label = text;
    if (/\bvs\b|\bvs\.\b/i.test(text)) {
      homeAway = "home";
      label = text.replace(/.*?\bvs\.?\s*/i, "");
    } else if (/\bat\b/i.test(text)) {
      homeAway = "away";
      label = text.replace(/.*?\bat\s*/i, "");
    }
    if (!homeAway) return null;
    const cleaned = label.replace(/\*(?:\s|$)/g, " ").replace(/\s{2,}/g, " ").trim();
    const opponents = cleaned
      .split(/[\n|•·]/)
      .join(" ")
      .split(/\s{2,}|\s{1}(?=[A-Z]{2,}(?:\s|$))/)
      .join(" ")
      .split(/\s{2,}/)
      .filter(Boolean);
    const dedup = Array.from(
      new Set(
        cleaned
          .split(/[,/]|\s{2,}|\s{1}\u00B7\s{1}/)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
    const finalOpponents = opponents.length >= 1 ? [cleaned] : dedup;
    return {
      homeAway,
      opponents: finalOpponents.length ? finalOpponents : [cleaned],
      label: cleaned,
    };
  };

  for (const block of blocks) {
    const linesIn = block.text
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    const main = linesIn.find((value) => /\b(vs\.?|at)\b/i.test(value)) || linesIn[0];
    const opponent = normalizeOpponents(main || "");
    if (!opponent) continue;

    const monthIndex = MONTH_MAP[(block.month || "").toLowerCase()];
    if (typeof monthIndex !== "number") continue;
    const nowYear = new Date().getFullYear();
    const seasonYear = season ? Number(season) : nowYear;
    const year = seasonYear;
    const dateLocal = new Date(Date.UTC(year, monthIndex, block.day, 0, 0, 0));
    const startISO = new Date(dateLocal).toISOString().slice(0, 10);
    const endISO = new Date(Date.UTC(year, monthIndex, block.day + 1, 0, 0, 0))
      .toISOString()
      .slice(0, 10);

    let location = "";
    let locationNote = "";
    if (opponent.homeAway === "home") {
      location = params.finalAddress || "";
      if (!location) locationNote = "Home meet — address missing";
    } else {
      locationNote = `Away meet at ${opponent.opponents[0]}`;
    }

    const prettyOpp = opponent.label.replace(/\s{2,}/g, " ");
    const eventTitle =
      `${schedule.homeTeam ? `${schedule.homeTeam} ` : ""}Gymnastics: ${opponent.homeAway === "home" ? "vs" : "at"} ${prettyOpp}`.trim();

    schedule.games.push({
      date: { month: monthIndex + 1, day: block.day, year },
      opponent: prettyOpp,
      home: opponent.homeAway === "home",
    });

    events.push({
      title: eventTitle,
      start: `${startISO}T00:00:00.000Z`,
      end: `${endISO}T00:00:00.000Z`,
      allDay: true,
      timezone: params.timezone,
      location,
      description: [eventTitle, locationNote].filter(Boolean).join("\n"),
      category: "Sport Events",
    });
  }

  return { schedule, events };
}
