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
  query?: string;
  city?: string;
  placeId?: string;
  sourceUrl?: string;
  timezoneSourceUrl?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  resolution?: "unresolved" | "verified" | "manual" | "online";
};
export type LiveCardForm = {
  format: "live_card" | "digital_flyer";
  brief: string;
  sourceEvidence: Array<{ field: string; quote: string }>;
  title: string;
  headlineIntro: string;
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
  return { id, label: "", venue: "", address: "", time: "", note: "", resolution: "unresolved" };
}

export function createLiveCardForm(timezone = "UTC"): LiveCardForm {
  return {
    format: "live_card",
    brief: "",
    sourceEvidence: [],
    title: "",
    headlineIntro: "You're invited",
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

export function sharedCardDesignKey(form: LiveCardForm): string {
  return JSON.stringify(["shared-v2", form.design.trim(), form.referenceUrl]);
}

export function isSharedCardDesignCurrent(form: LiveCardForm, key: string): boolean {
  if (key === sharedCardDesignKey(form)) return true;
  // Previously saved backgrounds included event type in their key. Only the
  // visual direction and reference determine whether that artwork needs updating.
  try {
    const saved: unknown = JSON.parse(key);
    return (
      Array.isArray(saved) &&
      saved.length === 4 &&
      saved[0] === "shared-v1" &&
      typeof saved[1] === "string" &&
      saved[2] === form.design.trim() &&
      saved[3] === form.referenceUrl
    );
  } catch {
    return false;
  }
}

export function liveCardDesignKey(form: LiveCardForm): string {
  const base = [form.title.trim(), form.eventType, form.design.trim(), form.referenceUrl];
  // Keep the original key for existing Live Cards; their artwork stays current on reopen.
  return form.format === "live_card"
    ? JSON.stringify(base)
    : JSON.stringify([
        ...base,
        form.format,
        form.overview,
        form.instructions,
        form.date,
        form.startTime,
        form.endDate,
        form.endTime,
        form.timezone,
        form.locations,
        form.rsvpEnabled,
        ...(form.rsvpEnabled
          ? [form.hostName, form.hostEmail, form.hostPhone, form.rsvpDeadline]
          : []),
        form.registryEnabled,
        ...(form.registryEnabled ? [form.registryUrl, form.giftNote] : []),
      ]);
}

/** Apply a reviewed AI proposal only where the host has not edited since the request. */
export function mergeLiveCardProposal(
  current: LiveCardForm,
  before: LiveCardForm,
  proposed: LiveCardForm,
): LiveCardForm {
  const next = { ...current };
  for (const key of Object.keys(before) as Array<keyof LiveCardForm>) {
    if (key === "format" || key === "referenceUrl" || key === "brief") continue;
    if (JSON.stringify(current[key]) === JSON.stringify(before[key]))
      Object.assign(next, { [key]: proposed[key] });
  }
  // A location edit made during assistance also owns its time zone.
  if (JSON.stringify(current.locations) !== JSON.stringify(before.locations))
    next.timezone = current.timezone;
  return next;
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
export function validateLiveCard(
  form: LiveCardForm,
  phase: "design" | "prepare" | "publish",
): LiveCardErrors {
  const errors: LiveCardErrors = {};
  if (phase === "design") {
    if (!form.eventType) errors.eventType = "Choose an event type.";
    if (!form.design.trim()) errors.design = "Describe how you would like the card to look.";
    return errors;
  }
  if (!form.title.trim()) errors.title = "Add the title or name you want on the card.";
  if (!form.eventType) errors.eventType = "Choose an event type.";
  if (!form.design.trim()) errors.design = "Describe how you would like the card to look.";
  if (!form.date) errors.date = "Choose your event date.";
  if (!form.startTime) errors.startTime = "Add a start time.";
  const validationZone = phase === "prepare" ? "UTC" : form.timezone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: validationZone }).format();
  } catch {
    errors.timezone = "Choose a valid timezone.";
  }
  const start = liveCardDateTime(form.date, form.startTime, validationZone);
  if (form.date && form.startTime && !start && !errors.timezone)
    errors.startTime =
      "Check this date and time. It may fall during a daylight-saving clock change.";
  if (form.endDate && !form.endTime) errors.endTime = "Add an end time, or clear the end date.";
  if (form.endTime) {
    const end = liveCardDateTime(form.endDate || form.date, form.endTime, validationZone);
    if (!end || (start && end <= start))
      errors.endTime =
        "The end must be after the start. For an overnight event, choose the next date.";
  }
  if (phase === "prepare") {
    if (
      !form.locations.length ||
      form.locations.some(
        (location) => !(location.query || location.venue || location.address).trim(),
      )
    )
      errors.locations = "Add a venue name for each location, or remove the unused location.";
  } else {
    if (!form.locations[0]?.address.trim())
      errors.locations = "Add an address or online meeting link for your event.";
    if (form.locations.slice(1).some((location) => !location.address.trim()))
      errors.locations = "Add an address for each location, or remove the unused location.";
    if (form.locations.some((location) => location.resolution === "unresolved"))
      errors.locations = "Confirm each venue or enter its address before publishing.";
    if (form.locations[0]?.resolution && !form.locations[0]?.timezone)
      errors.timezone = "Confirm the local time zone for your event location.";
  }
  if (form.rsvpEnabled) {
    if (!form.hostName.trim()) errors.hostName = "Add the host name guests should see.";
    if (form.hostEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.hostEmail))
      errors.hostEmail = "Enter a valid email address.";
    if (form.rsvpDeadline && form.date && form.rsvpDeadline > form.date)
      errors.rsvpDeadline = "The RSVP deadline must be on or before the event date.";
    if (form.format === "digital_flyer" && !form.hostEmail.trim() && !form.hostPhone.trim())
      errors.hostEmail = "Add an email or phone number to print for replies.";
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
    if (key === "locations" || key === "eventType" || key === "format" || key === "sourceEvidence")
      continue;
    if (key === "rsvpEnabled" || key === "registryEnabled") form[key] = source[key] === true;
    else if (typeof source[key] === "string")
      form[key] = source[key].slice(0, key === "referenceUrl" ? 4096 : 12000);
  }
  form.eventType = LIVE_CARD_EVENT_TYPES.find((type) => type === source.eventType) || "";
  form.format = source.format === "digital_flyer" ? "digital_flyer" : "live_card";
  if (Array.isArray(source.sourceEvidence))
    form.sourceEvidence = source.sourceEvidence.slice(0, 60).flatMap((item) => {
      const evidence = record(item);
      return evidence && typeof evidence.field === "string" && typeof evidence.quote === "string"
        ? [{ field: evidence.field.slice(0, 80), quote: evidence.quote.slice(0, 1000) }]
        : [];
    });
  if (Array.isArray(source.locations)) {
    form.locations = source.locations.slice(0, 10).flatMap((value, index) => {
      const location = record(value);
      if (!location) return [];
      const result = emptyLiveCardLocation(`location-${index}`);
      for (const key of [
        "id",
        "label",
        "venue",
        "address",
        "time",
        "note",
        "query",
        "city",
        "placeId",
        "sourceUrl",
        "timezoneSourceUrl",
        "timezone",
      ] as const) {
        if (typeof location[key] === "string") result[key] = location[key].slice(0, 2000);
      }
      for (const key of ["latitude", "longitude"] as const) {
        if (typeof location[key] === "number" && Number.isFinite(location[key]))
          result[key] = location[key];
      }
      result.resolution =
        location.resolution === "verified" ||
        location.resolution === "manual" ||
        location.resolution === "online"
          ? location.resolution
          : location.resolution === "unresolved"
            ? "unresolved"
            : result.address
              ? "manual"
              : "unresolved";
      if (location.resolution === undefined && result.address) result.timezone ||= form.timezone;
      return [result];
    });
  }
  if (!form.locations.length) form.locations = [emptyLiveCardLocation()];
  return form;
}
