import type {
  EventAction,
  EventPageBlueprint,
  EventPageMode,
  EventSection,
  EventTheme,
} from "../schemas/eventBlueprint.schema";
import { findEventPageBlueprintPreset } from "./blueprintPresets";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanString(value: unknown, fallback = "", maxLength = 240): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function firstText(data: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = cleanString(data[key], "", 300);
    if (value && !value.startsWith("data:")) return value;
  }
  return fallback;
}

function normalizeUrl(value: unknown): string | null {
  const text = cleanString(value, "", 600);
  if (!text || text.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(text) || text.startsWith("/") || text.startsWith("#")) return text;
  return null;
}

function inferMode(data: Record<string, unknown>): EventPageMode {
  const haystack = [
    data.category,
    data.eventType,
    data.type,
    data.title,
    data.headlineTitle,
    data.description,
  ]
    .map((value) => cleanString(value).toLowerCase())
    .join(" ");
  if (/gymnastics|meet|session|warmup|warm-up/.test(haystack)) return "gymnastics_meet";
  if (/wedding|ceremony|reception|hotel block/.test(haystack)) return "wedding_weekend";
  if (/shower|registry|gift/.test(haystack)) return "shower_or_registry_event";
  if (/football|soccer|basketball|team|practice|game/.test(haystack)) return "sports_team_event";
  if (/school|class|teacher|student|program/.test(haystack)) return "school_or_class_event";
  if (/open house|workshop|business|customer/.test(haystack)) return "business_or_open_house";
  const schedule = Array.isArray(data.schedule) || Array.isArray(data.scheduleItems);
  return schedule ? "schedule_heavy_event" : "simple_social_event";
}

function inferTheme(mode: EventPageMode): EventTheme {
  const preset = findEventPageBlueprintPreset(mode);
  if (preset) return preset.theme;
  if (mode === "wedding_weekend" || mode === "formal_event") {
    return {
      mood: "elegant_romantic",
      formality: "formal",
      visualDensity: "medium",
      palette: "soft_blush_ink",
      typography: "editorial",
      heroStyle: "editorial",
      sectionRhythm: "spacious",
      backgroundTreatment: "soft_gradient",
      colors: {
        primary: "#6B4E71",
        secondary: "#D6A6A6",
        background: "#FBF6F4",
        surface: "#FFFFFF",
        text: "#2B2430",
        mutedText: "#6D6372",
      },
    };
  }
  if (mode === "gymnastics_meet" || mode === "sports_team_event") {
    return {
      mood: "sporty_premium",
      formality: "semi_formal",
      visualDensity: "high",
      palette: "violet_sky_rose",
      typography: "clean",
      heroStyle: "dashboard",
      sectionRhythm: "compact",
      backgroundTreatment: "soft_gradient",
      colors: {
        primary: "#4B42D6",
        secondary: "#F1A9C8",
        background: "#F5F7FF",
        surface: "#FFFFFF",
        text: "#171A2A",
        mutedText: "#596075",
      },
    };
  }
  if (mode === "business_or_open_house") {
    return {
      mood: "polished_practical",
      formality: "semi_formal",
      visualDensity: "medium",
      palette: "evergreen_slate",
      typography: "clean",
      heroStyle: "centered",
      sectionRhythm: "balanced",
      backgroundTreatment: "solid",
      colors: {
        primary: "#176B5D",
        secondary: "#C5A56A",
        background: "#F4F8F6",
        surface: "#FFFFFF",
        text: "#172321",
        mutedText: "#5F6B67",
      },
    };
  }
  return {
    mood: "warm_event_hub",
    formality: "semi_formal",
    visualDensity: "medium",
    palette: "envitefy_warm",
    typography: "rounded",
    heroStyle: "dashboard",
    sectionRhythm: "balanced",
    backgroundTreatment: "soft_gradient",
    colors: {
      primary: "#5B4DCC",
      secondary: "#F3B3C8",
      background: "#F8F6FF",
      surface: "#FFFFFF",
      text: "#1F2233",
      mutedText: "#606579",
    },
  };
}

function normalizeSchedule(data: Record<string, unknown>) {
  const publicEvent = isRecord(data.publicEvent) ? data.publicEvent : {};
  const raw = Array.isArray(data.schedule)
    ? data.schedule
    : Array.isArray(data.scheduleItems)
      ? data.scheduleItems
      : Array.isArray(publicEvent.scheduleItems)
        ? publicEvent.scheduleItems
        : [];
  return raw
    .filter(isRecord)
    .map((item, index) => ({
      id: cleanString(item.id, `schedule-${index}`, 80),
      title: firstText(item, ["title", "name", "label"], `Schedule item ${index + 1}`),
      startAt: firstText(item, ["startAt", "startISO", "start"], "") || null,
      endAt: firstText(item, ["endAt", "endISO", "end"], "") || null,
      timezone: firstText(item, ["timezone", "tz"], "") || firstText(data, ["timezone", "tz"], "") || null,
      locationText: firstText(item, ["locationText", "location", "venue"], "") || null,
      notes: firstText(item, ["notes", "description"], "") || null,
      group: firstText(item, ["group", "team", "level"], "") || null,
    }))
    .slice(0, 30);
}

function registryItems(data: Record<string, unknown>) {
  const raw = Array.isArray(data.registryLinks)
    ? data.registryLinks
    : Array.isArray(data.registries)
      ? data.registries
      : [];
  return raw
    .filter(isRecord)
    .map((item, index) => ({
      label: firstText(item, ["label", "name", "host"], `Registry ${index + 1}`),
      value: firstText(item, ["helperText", "description"], "") || normalizeUrl(item.url) || "",
      href: normalizeUrl(item.url),
    }))
    .filter((item) => item.label || item.href)
    .slice(0, 8);
}

function checklistItems(data: Record<string, unknown>) {
  const publicEvent = isRecord(data.publicEvent) ? data.publicEvent : {};
  const raw = Array.isArray(data.checklistItems)
    ? data.checklistItems
    : Array.isArray(publicEvent.checklistItems)
      ? publicEvent.checklistItems
      : [];
  return raw
    .filter(isRecord)
    .map((item, index) => ({
      label: firstText(item, ["category", "group"], "Task"),
      value: firstText(item, ["title", "label", "name"], `Checklist item ${index + 1}`),
      status: firstText(item, ["status"], "open"),
    }))
    .filter((item) => item.value)
    .slice(0, 12);
}

function formItems(data: Record<string, unknown>) {
  const publicEvent = isRecord(data.publicEvent) ? data.publicEvent : {};
  const smartForms = isRecord(data.smartForms) ? data.smartForms : {};
  const raw = Array.isArray(data.forms)
    ? data.forms
    : Array.isArray(publicEvent.forms)
      ? publicEvent.forms
      : Array.isArray(smartForms.forms)
        ? smartForms.forms
        : [];
  return raw
    .filter(isRecord)
    .map((item, index) => ({
      label: firstText(item, ["title", "name"], `Form ${index + 1}`),
      value: firstText(item, ["description", "body"], "Collect guest responses."),
      href: normalizeUrl(item.url || item.href),
    }))
    .filter((item) => item.label)
    .slice(0, 8);
}

function volunteerItems(data: Record<string, unknown>) {
  const publicEvent = isRecord(data.publicEvent) ? data.publicEvent : {};
  const volunteerSignup = isRecord(data.volunteerSignup) ? data.volunteerSignup : {};
  const raw = Array.isArray(data.volunteerSlots)
    ? data.volunteerSlots
    : Array.isArray(publicEvent.volunteerSlots)
      ? publicEvent.volunteerSlots
      : Array.isArray(volunteerSignup.slots)
        ? volunteerSignup.slots
        : [];
  return raw
    .filter(isRecord)
    .map((item, index) => ({
      label: firstText(item, ["group", "category"], "Volunteer"),
      value: firstText(item, ["title", "name", "label"], `Volunteer role ${index + 1}`),
      quantity: Number(item.quantityNeeded || item.quantity || 1) || 1,
    }))
    .filter((item) => item.value)
    .slice(0, 12);
}

function travelItems(data: Record<string, unknown>) {
  const notes = firstText(data, ["travelNotes", "hotelBlock", "hotelBlockNotes", "lodgingNotes"], "");
  const hotelUrl = normalizeUrl(data.hotelBlockUrl || data.hotelUrl || data.travelUrl);
  const items: Array<Record<string, string | boolean | number | null>> = [];
  if (notes) items.push({ label: "Travel", value: notes, href: hotelUrl });
  if (!notes && hotelUrl) items.push({ label: "Hotel block", value: "Hotel block details", href: hotelUrl });
  return items;
}

function action(id: string, type: EventAction["type"], label: string, href: string | null, priority: EventAction["priority"]): EventAction {
  return { id, type, label, href, priority, target: href && /^https?:\/\//i.test(href) ? "_blank" : "_self" };
}

export function buildFallbackEventPageBlueprint(params: {
  eventId: string;
  title: string;
  data: Record<string, unknown>;
  shareUrl?: string | null;
}): EventPageBlueprint {
  const { data } = params;
  const mode = inferMode(data);
  const title = firstText(data, ["headlineTitle", "title", "eventName"], params.title || "Event");
  const date = firstText(data, ["dateText", "date", "startAt", "startISO", "start"], "Date coming soon");
  const time = firstText(data, ["timeText", "time"], "");
  const location = firstText(data, ["venue", "location", "address"], "Location coming soon");
  const description = firstText(
    data,
    ["description", "subheadline", "details", "goodToKnow"],
    "The host has shared the key details and next steps for this event.",
  );
  const schedule = normalizeSchedule(data);
  const rsvpUrl = normalizeUrl(data.rsvpUrl);
  const registry = registryItems(data);
  const travel = travelItems(data);
  const checklist = checklistItems(data);
  const forms = formItems(data);
  const volunteers = volunteerItems(data);
  const directionsHref = location && location !== "Location coming soon"
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    : null;
  const actions = [
    action("rsvp", "rsvp", "RSVP", rsvpUrl || "#rsvp", "primary"),
    action("directions", "get_directions", "Directions", directionsHref, "secondary"),
    action("share", "share_page", "Share", params.shareUrl || null, "secondary"),
  ].filter((item) => item.href);

  const sections: EventSection[] = [
    {
      id: "hero",
      type: "hero",
      eyebrow: cleanString(data.category, mode.replace(/_/g, " "), 80),
      title,
      body: description,
      items: [
        { label: "When", value: [date, time].filter(Boolean).join(" ") },
        { label: "Where", value: location },
      ],
      actions,
      schedule: [],
      media: normalizeUrl(data.coverImageUrl || data.heroImage || data.thumbnail)
        ? [{ id: "hero-image", url: String(normalizeUrl(data.coverImageUrl || data.heroImage || data.thumbnail)), alt: title }]
        : [],
      metadata: {},
    },
    {
      id: "quick-details",
      type: "quick_details",
      title: "Quick Details",
      body: "The essentials guests should see first.",
      items: [
        { label: "Date", value: date },
        { label: "Time", value: time || "Time coming soon" },
        { label: "Location", value: location },
        { label: "Audience", value: mode === "gymnastics_meet" ? "Parents, athletes, and coaches" : "Guests" },
      ],
      actions: [],
      schedule: [],
      media: [],
      metadata: {},
    },
  ];

  if (schedule.length) {
    sections.push({
      id: "schedule",
      type: "schedule_timeline",
      title: mode === "gymnastics_meet" ? "Meet Schedule" : "Schedule",
      body: "Times and notes are organized so visitors can scan the day quickly.",
      schedule,
      items: [],
      actions: [],
      media: [],
      metadata: {},
    });
  }

  if (travel.length) {
    sections.push({
      id: "travel",
      type: "travel",
      title: "Travel",
      body: "Travel and lodging notes from the host.",
      items: travel,
      actions: travel
        .filter((item) => typeof item.href === "string" && item.href)
        .map((item, index) =>
          action(`travel-${index}`, "open_registry", String(item.label || "Open travel link"), String(item.href), "secondary"),
        ),
      schedule: [],
      media: [],
      metadata: {},
    });
  }

  sections.push({
    id: "location",
    type: "location",
    title: "Location",
    body: location,
    items: [{ label: "Address", value: location }],
    actions: directionsHref ? [action("directions", "get_directions", "Open directions", directionsHref, "secondary")] : [],
    schedule: [],
    media: [],
    metadata: {},
  });

  if (registry.length) {
    sections.push({
      id: "registry",
      type: "registry",
      title: "Registry",
      body: "Gift and registry details from the host.",
      items: registry,
      actions: registry
        .filter((item) => typeof item.href === "string" && item.href)
        .map((item, index) => action(`registry-${index}`, "open_registry", item.label, String(item.href), "secondary")),
      schedule: [],
      media: [],
      metadata: {},
    });
  }

  if (volunteers.length) {
    sections.push({
      id: "team-notes",
      type: "team_notes",
      title: mode === "sports_team_event" ? "Volunteer Coverage" : "Team Notes",
      body: "Roles and coordination notes for families and helpers.",
      items: volunteers,
      actions: [],
      schedule: [],
      media: [],
      metadata: {},
    });
  }

  if (checklist.length) {
    sections.push({
      id: "checklist",
      type: "checklist",
      title: "Checklist",
      body: "Planning items the host is tracking before the event.",
      items: checklist,
      actions: [],
      schedule: [],
      media: [],
      metadata: {},
    });
  }

  if (forms.length) {
    sections.push({
      id: "forms",
      type: "forms",
      title: "Forms",
      body: "Response forms connected to this event.",
      items: forms,
      actions: forms
        .filter((item) => typeof item.href === "string" && item.href)
        .map((item, index) =>
          action(`form-${index}`, "open_form", String(item.label || "Open form"), String(item.href), "secondary"),
        ),
      schedule: [],
      media: [],
      metadata: {},
    });
  }

  sections.push({
    id: "rsvp",
    type: "rsvp",
    title: "RSVP",
    body: "Let the host know whether you can make it.",
    items: [],
    actions: [action("rsvp", "rsvp", "Respond", rsvpUrl || "#rsvp", "primary")],
    schedule: [],
    media: [],
    metadata: {
      directRsvpEnabled: Boolean(data.directRsvpEnabled || data.rsvpEnabled),
      rsvpName: cleanString(data.rsvpName, "", 120) || null,
      rsvpPhone: cleanString(data.rsvpPhone, "", 80) || null,
      rsvpEmail: cleanString(data.rsvpEmail, "", 120) || null,
      rsvpUrl,
    },
  });

  return {
    schemaVersion: "event_page_blueprint_v1",
    eventType: cleanString(data.eventType || data.category, mode, 100),
    eventTone: mode === "gymnastics_meet" ? "organized_parent_friendly" : "polished_guest_friendly",
    audience: mode === "gymnastics_meet" ? ["parents", "athletes", "coaches"] : ["guests"],
    pageGoal:
      mode === "gymnastics_meet"
        ? "Help families understand timing, location, arrival expectations, and RSVP."
        : "Help visitors understand event details and take the next action.",
    mode,
    layoutStyle: schedule.length ? "schedule_hub" : "event_hub",
    scheduleComplexity: schedule.length > 3 ? "schedule_heavy" : schedule.length ? "simple" : "none",
    theme: inferTheme(mode),
    sections,
    actions,
    generatedCopy: {},
  };
}
