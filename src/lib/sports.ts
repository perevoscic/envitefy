import * as chrono from "chrono-node";

export type ParsedGame = {
  opponent: string | null;
  homeAway: "home" | "away" | "neutral" | null;
  startISO: string | null;
  endISO: string | null;
  stadium: string | null;
  city: string | null;
  state: string | null;
  sourceLines: string[];
};

export type ParsedSchedule = {
  detected: boolean;
  homeTeam: string | null;
  season: string | null;
  games: ParsedGame[];
};

function isFuture(date: Date): boolean {
  const now = new Date();
  return date.getTime() >= now.getTime() - 5 * 60 * 1000;
}

export function parseFootballSchedule(raw: string, tz: string): ParsedSchedule {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  const headerRe = /^([A-Za-z][A-Za-z .,'\-&]{2,60})\s*(?:\b(20\d{2})\b)?\s*(?:football|soccer|fc|schedule|fixtures|games?)\b/i;
  let homeTeam: string | null = null;
  let season: string | null = null;
  for (const l of lines.slice(0, 8)) {
    const m = l.match(headerRe);
    if (m) {
      homeTeam = (m[1] || "").trim();
      season = (m[2] || null) as string | null;
      break;
    }
  }

  const games: ParsedGame[] = [];
  const venueToken = /(stadium|field|arena|dome|centre|center|complex|park)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const opponentHome = l.match(/\b(?:vs\.?|v\.?)\s+([A-Za-z][A-Za-z0-9 .,'\-&]{2,})/i);
    const opponentAway = l.match(/@\s*([A-Za-z][A-Za-z0-9 .,'\-&]{2,})/i);
    if (!opponentHome && !opponentAway) continue;

    const parsed = chrono.parse(l, new Date(), { forwardDate: true });
    const parsedAugment = parsed.length
      ? parsed
      : chrono.parse(`${l} ${lines[i + 1] || ""}`, new Date(), { forwardDate: true });
    if (!parsedAugment.length) continue;

    const c = parsedAugment[0];
    const start = c.start?.date?.() as Date | undefined;
    if (!start || !isFuture(start)) continue;
    const endCandidate = c.end?.date?.() as Date | undefined;
    const end = endCandidate || new Date(start.getTime() + 3 * 60 * 60 * 1000);

    const around = [lines[i - 1] || "", l, lines[i + 1] || ""].join(" • ");
    let venue: string | null = null;
    const vMatch = around.match(new RegExp(`([A-Za-z0-9 .,'\\-&]{3,}\\s+(?:${venueToken.source}))`, "i"));
    if (vMatch) venue = vMatch[1].replace(/\s{2,}/g, " ").trim();

    const opponent = (opponentHome?.[1] || opponentAway?.[1] || "").replace(/\s{2,}/g, " ").trim();
    const homeAway: "home" | "away" = opponentAway ? "away" : "home";

    games.push({
      opponent: opponent || null,
      homeAway,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      stadium: venue,
      city: null,
      state: null,
      sourceLines: [l, lines[i + 1] || ""].filter(Boolean),
    });
  }

  const detected = games.length >= 2;
  return { detected, homeTeam, season, games };
}

export function scheduleToEvents(s: ParsedSchedule, tz: string) {
  const home = s.homeTeam || "Home";
  return s.games.map((g) => {
    const title = g.homeAway === "away"
      ? `Away: ${home} @ ${g.opponent || "Opponent"}`
      : `Home: ${home} vs ${g.opponent || "Opponent"}`;
    const location = g.stadium || "";
    const description = [title, ...g.sourceLines].join("\n");
    return {
      title,
      start: g.startISO,
      end: g.endISO,
      allDay: false,
      timezone: tz,
      location,
      description,
      recurrence: null as any,
      reminders: [{ minutes: 30 }],
    };
  });
}


