export type MobileAuditPersona =
  | "anonymous"
  | "creator"
  | "gymnastics-coach"
  | "multi-sport-creator"
  | "administrator";

export type MobileAuditInteraction = {
  name: string;
  role?: "button" | "link" | "textbox" | "tab";
  accessibleName?: string;
  selector?: string;
  expectedSelector?: string;
};

export type MobileAuditCase = {
  id: string;
  path: string;
  persona: MobileAuditPersona;
  critical?: boolean;
  fixtureEnvironmentVariable?: string;
  readySelector?: string;
  allowedHorizontalRegions?: string[];
  interactions?: MobileAuditInteraction[];
  visualMaskSelectors?: string[];
};
