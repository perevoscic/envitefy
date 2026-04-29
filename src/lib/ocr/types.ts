import type { OcrFact } from "@/lib/ocr/facts";
import type { ThumbnailFocus } from "@/lib/thumbnail-focus";

export type EventOcrLlmResult = {
  title?: string;
  start?: string | null;
  end?: string | null;
  address?: string;
  venueName?: string | null;
  description?: string;
  category?: string;
  rsvp?: string | null;
  rsvpUrl?: string | null;
  rsvpDeadline?: string | null;
  hostName?: string | null;
  activities?: string[] | null;
  attire?: string | null;
  registryUrl?: string | null;
  ocrFacts?: OcrFact[] | null;
  facts?: OcrFact[] | null;
  yearVisible?: boolean | null;
  birthdayAudience?: "girl" | "boy" | "neutral" | null;
  birthdaySignals?: string[] | null;
  birthdayName?: string | null;
  birthdayAge?: number | string | null;
  /** Short guest reminder from flyer footer (e.g. "Don't forget a towel and sunscreen!"). */
  goodToKnow?: string | null;
  /** Dashboard thumbnail crop focus. Coordinates are normalized 0..1 in the upright image. */
  thumbnailFocus?: ThumbnailFocus | null;
  openHouse?: OpenHouseOcrPayload | null;
};

export type OpenHouseVisualAssetRole =
  | "property-exterior"
  | "property-interior"
  | "property-pool"
  | "property-kitchen"
  | "property-bedroom"
  | "property-bathroom"
  | "property-other"
  | "realtor-headshot";

export type OpenHouseVisualAsset = {
  role?: OpenHouseVisualAssetRole | string | null;
  label?: string | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  confidence?: number | null;
};

export type OpenHouseExtractedField = {
  key?: string | null;
  label?: string | null;
  value?: string | null;
  confidence?: number | null;
};

export type OpenHouseOcrPayload = {
  listingType?: "sale" | "rent" | "lease" | "unknown" | string | null;
  propertyType?: string | null;
  price?: string | null;
  mlsNumber?: string | null;
  bedrooms?: string | null;
  bathrooms?: string | null;
  sqft?: string | null;
  lotSize?: string | null;
  yearBuilt?: string | null;
  parking?: string | null;
  hoa?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  agencyName?: string | null;
  brokerageName?: string | null;
  realtorName?: string | null;
  realtorTitle?: string | null;
  realtorLicense?: string | null;
  realtorPhone?: string | null;
  realtorEmail?: string | null;
  websiteUrl?: string | null;
  listingUrl?: string | null;
  features?: string[] | null;
  extractedFields?: OpenHouseExtractedField[] | null;
  visualAssets?: OpenHouseVisualAsset[] | null;
};

export type GymnasticsScheduleEvent = {
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  timezone?: string;
  location?: string | null;
  description?: string | null;
};

export type GymnasticsScheduleLlmResult = {
  season?: string | null;
  homeTeam?: string | null;
  homeAddress?: string | null;
  events?: GymnasticsScheduleEvent[];
};

export type PracticeScheduleLLMGroup = {
  name?: string;
  note?: string | null;
  sessions?: Array<{
    day?: string;
    startTime?: string;
    endTime?: string;
    note?: string | null;
  }>;
};

export type PracticeScheduleLLMResponse = {
  title?: string | null;
  timeframe?: string | null;
  timezoneHint?: string | null;
  groups?: PracticeScheduleLLMGroup[];
};

export type PracticeSessionOutput = {
  day: string;
  display: string;
  hasPractice: boolean;
  start?: string;
  end?: string;
  startTime?: string;
  endTime?: string;
  note: string | null;
};

export type PracticeGroupOutput = {
  name: string;
  note: string | null;
  sessions: PracticeSessionOutput[];
  events: any[];
};

export type PracticeScheduleOutput = {
  detected: boolean;
  title: string | null;
  timeframe: string | null;
  timezone: string;
  groups: PracticeGroupOutput[];
};

export type OcrStageTimings = {
  preprocessMs: number;
  primaryOcrMs: number;
  fallbackOcrMs: number;
  rewriteMs: number;
  scheduleMs: number;
};
