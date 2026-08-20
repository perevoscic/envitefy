import {
  getSportActivityProfile,
  normalizeSportEventArchetype,
  SPORT_ACTIVITY_PROFILES,
} from "./profiles";
import type {
  SportActivityProfile,
  SportDetectionCandidate,
  SportDetectionResult,
  SportEventArchetype,
} from "./types";

const ARCHETYPE_SIGNALS: Array<{
  archetype: SportEventArchetype;
  patterns: RegExp[];
}> = [
  {
    archetype: "tournament",
    patterns: [/\btournament\b/i, /\bbracket\b/i, /\bpool play\b/i, /\bsemifinals?\b/i],
  },
  {
    archetype: "season_schedule",
    patterns: [/\bseason\b/i, /\bschedule\b/i, /\bhome\s+and\s+away\b/i, /\bregular season\b/i],
  },
  {
    archetype: "showcase_clinic",
    patterns: [/\bshowcase\b/i, /\brecital\b/i, /\bclinic\b/i, /\bcamp\b/i, /\btryouts?\b/i],
  },
  {
    archetype: "meet_competition",
    patterns: [/\bmeet\b/i, /\bcompetition\b/i, /\bheat sheets?\b/i, /\bperformance order\b/i],
  },
  {
    archetype: "game_match",
    patterns: [/\bvs\.?\b/i, /\bgame\b/i, /\bmatch\b/i, /\bkickoff\b/i, /\btip-?off\b/i],
  },
];

function keywordPattern(keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`, "i");
}

function scoreProfile(text: string, item: SportActivityProfile): SportDetectionCandidate {
  const reasons: string[] = [];
  let score = 0;
  for (const alias of item.aliases) {
    if (!keywordPattern(alias).test(text)) continue;
    score += 5;
    reasons.push(`Matched “${alias}”`);
  }
  for (const keyword of item.keywords) {
    if (!keywordPattern(keyword).test(text)) continue;
    score += 2;
    reasons.push(`Found ${keyword}`);
  }
  return {
    profile: item.key,
    label: item.label,
    score,
    reasons: reasons.slice(0, 5),
  };
}

function detectArchetype(text: string, profile: SportActivityProfile): SportEventArchetype {
  const ranked = ARCHETYPE_SIGNALS.map((item) => ({
    archetype: item.archetype,
    score: item.patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0),
  }))
    .filter((item) => profile.supportedArchetypes.includes(item.archetype))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].archetype : profile.defaultArchetype;
}

export function detectSportActivity(params: {
  text?: string | null;
  activityHint?: string | null;
  archetypeHint?: string | null;
}): SportDetectionResult {
  const text = String(params.text || "")
    .replace(/\s+/g, " ")
    .trim();
  const hintedProfile = getSportActivityProfile(params.activityHint);
  const hintedArchetype = normalizeSportEventArchetype(params.archetypeHint);
  if (hintedProfile) {
    const archetype =
      hintedArchetype && hintedProfile.supportedArchetypes.includes(hintedArchetype)
        ? hintedArchetype
        : detectArchetype(text, hintedProfile);
    return {
      profile: hintedProfile.key,
      label: hintedProfile.label,
      archetype,
      parserFamily: hintedProfile.parserFamily,
      confidence: 1,
      source: "user",
      reasons: ["Sport selected by the user"],
      alternatives: [],
      needsConfirmation: false,
    };
  }

  const ranked = SPORT_ACTIVITY_PROFILES.map((item) => scoreProfile(text, item)).sort(
    (a, b) => b.score - a.score,
  );
  const top = ranked[0];
  const selected = getSportActivityProfile(top?.profile) || getSportActivityProfile("football")!;
  const secondScore = ranked[1]?.score || 0;
  const confidence = top?.score
    ? Math.max(0.35, Math.min(0.98, top.score / Math.max(8, top.score + secondScore)))
    : 0.2;
  return {
    profile: selected.key,
    label: selected.label,
    archetype: hintedArchetype || detectArchetype(text, selected),
    parserFamily: selected.parserFamily,
    confidence,
    source: top?.score ? "detected" : "fallback",
    reasons: top?.reasons || ["No reliable sport signal was found"],
    alternatives: ranked.filter((item) => item.score > 0).slice(1, 4),
    needsConfirmation: confidence < 0.62,
  };
}
