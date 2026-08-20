export type SportEventArchetype =
  | "meet_competition"
  | "game_match"
  | "season_schedule"
  | "tournament"
  | "showcase_clinic";

export type SportParserFamily = "meet" | "game";

export type SportActivityProfile = {
  key: string;
  label: string;
  aliases: string[];
  keywords: string[];
  parserFamily: SportParserFamily;
  defaultArchetype: SportEventArchetype;
  supportedArchetypes: SportEventArchetype[];
  requiredFields: string[];
  optionalSections: string[];
};

export type SportDetectionCandidate = {
  profile: string;
  label: string;
  score: number;
  reasons: string[];
};

export type SportDetectionResult = {
  profile: string;
  label: string;
  archetype: SportEventArchetype;
  parserFamily: SportParserFamily;
  confidence: number;
  source: "user" | "detected" | "fallback";
  reasons: string[];
  alternatives: SportDetectionCandidate[];
  needsConfirmation: boolean;
};

export type SportDiscoveryParseOutput = {
  parseResult: Record<string, any>;
  evidence?: Record<string, any> | null;
  rawModelOutput?: string | null;
  modelUsed?: string | null;
  detection: SportDetectionResult;
  adapterId: string;
};

export type SportDiscoveryAdapter = {
  id: string;
  parse(params: {
    extractedText: string;
    extractionMeta: Record<string, any>;
    eventId: string;
    activityHint?: string | null;
    archetypeHint?: string | null;
  }): Promise<SportDiscoveryParseOutput>;
  map(params: {
    parseResult: Record<string, any>;
    currentData: Record<string, any>;
    extractionMeta?: Record<string, any> | null;
    activityProfile?: string | null;
    eventArchetype?: string | null;
    detectionConfidence?: number | null;
  }): Promise<Record<string, any>>;
};
