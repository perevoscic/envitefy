import type { ConciergeEventDraft, ConciergeEventType } from "./types";

const CATEGORY_LABEL_BY_EVENT_TYPE: Partial<Record<ConciergeEventType, string>> = {
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby Shower",
  gender_reveal: "Baby Shower",
  bridal_shower: "Bridal Shower",
  gym_meet: "Game Day",
  game_day: "Game Day",
  football: "Game Day",
  sport_event: "Game Day",
  field_trip: "Field Trip/Day",
  open_house: "Open House",
  housewarming: "Housewarming",
  graduation: "Custom Invite",
  appointment: "Custom Invite",
  workshop: "Custom Invite",
  special_event: "Custom Invite",
  smart_signup: "Custom Invite",
  general: "Custom Invite",
};

function cleanSkinString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function categoryLabelForEventType(eventType?: ConciergeEventType | null) {
  if (!eventType || eventType === "unknown" || eventType === "general") return null;
  return CATEGORY_LABEL_BY_EVENT_TYPE[eventType] || null;
}

export function skinLabelForCategoryName(value?: string | null) {
  const cleaned = cleanSkinString(value);
  if (!cleaned) return null;
  const normalized = cleaned.toLowerCase().replace(/[_-]+/g, " ");
  if (/\bbirthday\b/.test(normalized)) return "Birthday skin";
  if (/\bwedding\b/.test(normalized)) return "Wedding skin";
  if (/\bbaby\s+shower\b|\bgender\s+reveal\b/.test(normalized)) return "Baby Shower skin";
  if (/\bbridal\s+shower\b/.test(normalized)) return "Bridal Shower skin";
  if (/\bgame\s+day\b|\bfootball\b|\bsport\b/.test(normalized)) return "Game Day skin";
  if (/\bopen\s+house\b/.test(normalized)) return "Open House skin";
  if (/\bfield\s+trip\b/.test(normalized)) return "Field Trip skin";
  if (/\bcustom\b|\bother\b|\bnone\b/.test(normalized)) return "Custom event skin";
  return `${cleaned} skin`;
}

export function skinLabelForConciergeDraft(draft: ConciergeEventDraft | null) {
  return skinLabelForCategoryName(categoryLabelForEventType(draft?.eventType)) || "Custom event skin";
}
