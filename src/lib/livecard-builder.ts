import { localClockToIso } from "./creation/calendar-validation.ts";

export const LIVE_CARD_BUILDER_PATH = "/livacards-invites";
export const LIVE_CARD_BUILDER_SOURCE = "livecard-builder";
export const LIVE_CARD_EVENT_TYPES = [
  "Birthday",
  "Wedding",
  "Anniversary",
  "Baby shower",
  "Gender reveal",
  "Bridal shower",
  "Graduation",
  "Housewarming",
  "Game day",
  "Open house",
  "General event",
] as const;
export type LiveCardEventType = (typeof LIVE_CARD_EVENT_TYPES)[number];

export type LiveCardLocation = {
  id: string;
  label: string;
  venue: string;
  address: string;
  time: string;
  note: string;
};
export type LiveCardForm = {
  title: string;
  eventType: LiveCardEventType | "";
  design: string;
  referenceUrl: string;
  overview: string;
  date: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  locations: LiveCardLocation[];
  rsvpEnabled: boolean;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  rsvpDeadline: string;
  registryEnabled: boolean;
  registryUrl: string;
  giftNote: string;
  instructions: string;
};

export function emptyLiveCardLocation(id = "primary"): LiveCardLocation {
  return { id, label: "", venue: "", address: "", time: "", note: "" };
}

export function createLiveCardForm(timezone = "UTC"): LiveCardForm {
  return {
    title: "",
    eventType: "",
    design: "",
    referenceUrl: "",
    overview: "",
    date: "",
    startTime: "",
    endDate: "",
    endTime: "",
    timezone,
    locations: [emptyLiveCardLocation()],
    rsvpEnabled: false,
    hostName: "",
    hostEmail: "",
    hostPhone: "",
    rsvpDeadline: "",
    registryEnabled: false,
    registryUrl: "",
    giftNote: "",
    instructions: "",
  };
}

export function liveCardDesignKey(form: LiveCardForm): string {
  return JSON.stringify([form.title.trim(), form.eventType, form.design.trim(), form.referenceUrl]);
}

export function liveCardDateTime(date: string, time: string, timezone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return localClockToIso({ year, month, day, hour, minute }, timezone);
}

export function liveCardRegistryUrl(value: string): string | null {
  const text = value.trim();
  if (!text || (/^[a-z][a-z\d+.-]*:/i.test(text) && !/^https?:\/\//i.test(text))) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return /^https?:$/.test(url.protocol) &&
      url.hostname.includes(".") &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export type LiveCardErrors = Partial<Record<keyof LiveCardForm, string>>;
export function validateLiveCard(form: LiveCardForm, phase: "design" | "publish"): LiveCardErrors {
  const errors: LiveCardErrors = {};
  if (!form.title.trim()) errors.title = "Add the title or name you want on the card.";
  if (!form.eventType) errors.eventType = "Choose an event type.";
  if (!form.design.trim()) errors.design = "Describe how you would like the card to look.";
  if (phase === "design") return errors;
  if (!form.date) errors.date = "Choose your event date.";
  if (!form.startTime) errors.startTime = "Add a start time.";
  try {
    new Intl.DateTimeFormat("en", { timeZone: form.timezone }).format();
  } catch {
    errors.timezone = "Choose a valid timezone.";
  }
  const start = liveCardDateTime(form.date, form.startTime, form.timezone);
  if (form.date && form.startTime && !start && !errors.timezone)
    errors.startTime =
      "Check this date and time. It may fall during a daylight-saving clock change.";
  if (form.endDate && !form.endTime) errors.endTime = "Add an end time, or clear the end date.";
  if (form.endTime) {
    const end = liveCardDateTime(form.endDate || form.date, form.endTime, form.timezone);
    if (!end || (start && end <= start))
      errors.endTime =
        "The end must be after the start. For an overnight event, choose the next date.";
  }
  if (!form.locations[0]?.address.trim())
    errors.locations = "Add an address or online meeting link for your event.";
  if (form.locations.slice(1).some((location) => !location.address.trim()))
    errors.locations = "Add an address for each location, or remove the unused location.";
  if (form.rsvpEnabled) {
    if (!form.hostName.trim()) errors.hostName = "Add the host name guests should see.";
    if (form.hostEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.hostEmail))
      errors.hostEmail = "Enter a valid email address.";
    if (form.rsvpDeadline && form.date && form.rsvpDeadline > form.date)
      errors.rsvpDeadline = "The RSVP deadline must be on or before the event date.";
  }
  if (form.registryEnabled && !liveCardRegistryUrl(form.registryUrl))
    errors.registryUrl = "Add a valid registry or gift-list website link.";
  return errors;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Narrow saved JSON before it enters the editable form. Missing facts stay blank. */
export function readLiveCardForm(value: unknown): LiveCardForm | null {
  const source = record(value);
  if (!source) return null;
  const form = createLiveCardForm();
  for (const key of Object.keys(form) as Array<keyof LiveCardForm>) {
    if (key === "locations" || key === "eventType") continue;
    if (key === "rsvpEnabled" || key === "registryEnabled") form[key] = source[key] === true;
    else if (typeof source[key] === "string")
      form[key] = source[key].slice(0, key === "referenceUrl" ? 4096 : 12000);
  }
  form.eventType = LIVE_CARD_EVENT_TYPES.find((type) => type === source.eventType) || "";
  if (Array.isArray(source.locations)) {
    form.locations = source.locations.slice(0, 10).flatMap((value, index) => {
      const location = record(value);
      if (!location) return [];
      const result = emptyLiveCardLocation(`location-${index}`);
      for (const key of Object.keys(result) as Array<keyof LiveCardLocation>) {
        if (typeof location[key] === "string") result[key] = location[key].slice(0, 2000);
      }
      return [result];
    });
  }
  if (!form.locations.length) form.locations = [emptyLiveCardLocation()];
  return form;
}
