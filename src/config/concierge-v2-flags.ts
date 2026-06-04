export type ConciergeV2FlagName =
  | "ENABLE_CONCIERGE_V2"
  | "ENABLE_SCHEDULE_HUB"
  | "ENABLE_SMART_FORMS"
  | "ENABLE_VOLUNTEER_SIGNUPS"
  | "ENABLE_MANUAL_PAYMENTS"
  | "ENABLE_OCR_IMPORTS"
  | "ENABLE_TEAM_CLASS_HUB"
  | "ENABLE_RESOURCE_PLANNING"
  | "ENABLE_REMINDER_ENGINE";

export type ConciergeV2Flags = Record<ConciergeV2FlagName, boolean>;

const FLAG_NAMES: ConciergeV2FlagName[] = [
  "ENABLE_CONCIERGE_V2",
  "ENABLE_SCHEDULE_HUB",
  "ENABLE_SMART_FORMS",
  "ENABLE_VOLUNTEER_SIGNUPS",
  "ENABLE_MANUAL_PAYMENTS",
  "ENABLE_OCR_IMPORTS",
  "ENABLE_TEAM_CLASS_HUB",
  "ENABLE_RESOURCE_PLANNING",
  "ENABLE_REMINDER_ENGINE",
];

function envFlagValue(value: string | undefined): boolean | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (/^(1|true|yes|y|on|enabled)$/.test(normalized)) return true;
  if (/^(0|false|no|n|off|disabled)$/.test(normalized)) return false;
  return null;
}

function defaultFlagValue(name: ConciergeV2FlagName): boolean {
  if (process.env.NODE_ENV !== "production") {
    return name !== "ENABLE_OCR_IMPORTS" && name !== "ENABLE_RESOURCE_PLANNING";
  }
  return false;
}

export function getConciergeV2Flags(): ConciergeV2Flags {
  return FLAG_NAMES.reduce((flags, name) => {
    flags[name] = envFlagValue(process.env[name]) ?? defaultFlagValue(name);
    return flags;
  }, {} as ConciergeV2Flags);
}

export function isConciergeV2FlagEnabled(name: ConciergeV2FlagName): boolean {
  return getConciergeV2Flags()[name];
}

export function assertConciergeV2Enabled(): void {
  if (!isConciergeV2FlagEnabled("ENABLE_CONCIERGE_V2")) {
    throw new Error("Concierge V2 is disabled.");
  }
}
