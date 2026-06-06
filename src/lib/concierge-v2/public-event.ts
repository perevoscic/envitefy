export type ConciergeV2ScheduleItem = {
  id?: string;
  title: string;
  type?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string | null;
  locationText?: string | null;
  status?: string | null;
  notes?: string | null;
};

export type ConciergeV2ChecklistItem = {
  id?: string;
  title: string;
  category?: string | null;
  status?: string | null;
};

export type ConciergeV2FormSummary = {
  id?: string;
  title: string;
  description?: string | null;
  fields?: Array<{ key?: string; label: string; type?: string; required?: boolean }>;
};

export type ConciergeV2VolunteerSlot = {
  id?: string;
  title: string;
  group?: string | null;
  quantityNeeded?: number | null;
  claimedQuantity?: number | null;
  description?: string | null;
};

export type ConciergeV2PaymentItem = {
  id?: string;
  title: string;
  description?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  dueAt?: string | null;
  status?: string | null;
};

export type ConciergeV2ReminderItem = {
  id?: string;
  title: string;
  reminderType?: string | null;
  channel?: string | null;
  scheduledFor?: string | null;
  status?: string | null;
};

export type ConciergeV2PublicSections = {
  scheduleItems: ConciergeV2ScheduleItem[];
  checklistItems: ConciergeV2ChecklistItem[];
  forms: ConciergeV2FormSummary[];
  volunteerSlots: ConciergeV2VolunteerSlot[];
  paymentItems: ConciergeV2PaymentItem[];
  reminders: ConciergeV2ReminderItem[];
};

function isRecord(value: any): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanString(value: any, maxLength = 240): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function cleanNumber(value: any): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanIso(value: any): string | null {
  const text = cleanString(value, 80);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
}

function formatScheduleLabel(value: unknown, timezone?: string | null) {
  const text = cleanString(value, 100);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const tz = cleanString(timezone, 80);
  try {
    return new Intl.DateTimeFormat("en-US", tz ? { ...options, timeZone: tz } : options).format(
      parsed,
    );
  } catch {
    return new Intl.DateTimeFormat("en-US", options).format(parsed);
  }
}

function valuesFrom(...values: any[]): any[] {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function present<T>(value: T | null | undefined): value is T {
  return value != null;
}

function normalizeScheduleItem(item: any, index: number): ConciergeV2ScheduleItem | null {
  if (!isRecord(item)) return null;
  const title = cleanString(item.title || item.name || item.label, 180);
  if (!title) return null;
  return {
    id: cleanString(item.id, 120) || `schedule-${index}`,
    title,
    type: cleanString(item.type || item.occurrenceType, 80) || null,
    startAt: cleanIso(item.startAt || item.start || item.startISO),
    endAt: cleanIso(item.endAt || item.end || item.endISO),
    timezone: cleanString(item.timezone || item.tz, 80) || null,
    locationText: cleanString(item.locationText || item.location || item.venue, 180) || null,
    status: cleanString(item.status, 60) || "scheduled",
    notes: cleanString(item.notes || item.description, 280) || null,
  };
}

function normalizeChecklistItem(item: any): ConciergeV2ChecklistItem | null {
  if (!isRecord(item)) return null;
  const title = cleanString(item.title || item.label, 180);
  if (!title) return null;
  return {
    id: cleanString(item.id, 120) || undefined,
    title,
    category: cleanString(item.category, 80) || null,
    status: cleanString(item.status, 60) || "open",
  };
}

function normalizeForm(item: any): ConciergeV2FormSummary | null {
  if (!isRecord(item)) return null;
  const title = cleanString(item.title || item.name, 180);
  if (!title) return null;
  const fields = valuesFrom(item.fields).map((field) => ({
    key: cleanString(field?.key, 80) || undefined,
    label: cleanString(field?.label || field?.title, 160) || "Question",
    type: cleanString(field?.type || field?.fieldType, 60) || "text",
    required: Boolean(field?.required),
  }));
  return {
    id: cleanString(item.id, 120) || undefined,
    title,
    description: cleanString(item.description, 260) || null,
    fields,
  };
}

function normalizeVolunteerSlot(item: any): ConciergeV2VolunteerSlot | null {
  if (!isRecord(item)) return null;
  const title = cleanString(item.title || item.label, 180);
  if (!title) return null;
  return {
    id: cleanString(item.id, 120) || undefined,
    title,
    group: cleanString(item.group || item.category, 100) || null,
    quantityNeeded: cleanNumber(item.quantityNeeded || item.quantity_needed),
    claimedQuantity: cleanNumber(item.claimedQuantity || item.claimed_quantity),
    description: cleanString(item.description, 240) || null,
  };
}

function normalizePaymentItem(item: any): ConciergeV2PaymentItem | null {
  if (!isRecord(item)) return null;
  const title = cleanString(item.title || item.label, 180);
  if (!title) return null;
  return {
    id: cleanString(item.id, 120) || undefined,
    title,
    description: cleanString(item.description, 240) || null,
    amountCents: cleanNumber(item.amountCents || item.amount_cents),
    currency: cleanString(item.currency, 12) || "USD",
    dueAt: cleanIso(item.dueAt || item.due_at),
    status: cleanString(item.status, 60) || "unpaid",
  };
}

function normalizeReminder(item: any): ConciergeV2ReminderItem | null {
  if (!isRecord(item)) return null;
  const title = cleanString(item.title || item.label, 180);
  if (!title) return null;
  return {
    id: cleanString(item.id, 120) || undefined,
    title,
    reminderType: cleanString(item.reminderType || item.reminder_type, 80) || null,
    channel: cleanString(item.channel, 40) || "email",
    scheduledFor: cleanIso(item.scheduledFor || item.scheduled_for),
    status: cleanString(item.status, 60) || "draft",
  };
}

export function extractConciergeV2PublicSections(data: Record<string, any>): ConciergeV2PublicSections {
  const publicEvent = isRecord(data?.publicEvent) ? data.publicEvent : {};
  const scheduleHub = isRecord(data?.scheduleHub) ? data.scheduleHub : {};
  const smartForms = isRecord(data?.smartForms) ? data.smartForms : {};
  const volunteerSignup = isRecord(data?.volunteerSignup) ? data.volunteerSignup : {};
  const paymentTracker = isRecord(data?.paymentTracker) ? data.paymentTracker : {};
  const reminderTimeline = isRecord(data?.reminderTimeline) ? data.reminderTimeline : {};

  return {
    scheduleItems: valuesFrom(
      publicEvent.scheduleItems,
      scheduleHub.items,
      scheduleHub.occurrences,
      data.scheduleItems,
    )
      .map(normalizeScheduleItem)
      .filter(present)
      .slice(0, 30),
    checklistItems: valuesFrom(publicEvent.checklistItems, data.checklistItems)
      .map(normalizeChecklistItem)
      .filter(present)
      .slice(0, 20),
    forms: valuesFrom(publicEvent.forms, smartForms.forms, data.forms)
      .map(normalizeForm)
      .filter(present)
      .slice(0, 10),
    volunteerSlots: valuesFrom(publicEvent.volunteerSlots, volunteerSignup.slots, data.volunteerSlots)
      .map(normalizeVolunteerSlot)
      .filter(present)
      .slice(0, 20),
    paymentItems: valuesFrom(publicEvent.paymentItems, paymentTracker.items, data.paymentItems)
      .map(normalizePaymentItem)
      .filter(present)
      .slice(0, 20),
    reminders: valuesFrom(publicEvent.reminders, reminderTimeline.items, data.reminders)
      .map(normalizeReminder)
      .filter(present)
      .slice(0, 20),
  };
}

export function buildConciergeV2EventHistoryPayload(params: {
  draft: Record<string, any>;
  programId?: string | null;
  occurrenceRows?: ConciergeV2ScheduleItem[];
}) {
  const draft = params.draft || {};
  const title = cleanString(draft.title, 220) || "Envitefy Event Plan";
  const mode = cleanString(draft.mode, 80) || "social";
  const eventType = cleanString(draft.eventType, 100) || "general_event";
  const sourceOccurrences: any[] = params.occurrenceRows?.length
    ? params.occurrenceRows
    : valuesFrom(draft.occurrences);
  const occurrences: ConciergeV2ScheduleItem[] = sourceOccurrences
    .map(normalizeScheduleItem)
    .filter(present);
  const firstOccurrence = occurrences.find((item) => item.startAt) || null;
  const forms = valuesFrom(draft.forms).map(normalizeForm).filter(present);
  const volunteerSlots = valuesFrom(draft.volunteerSlots).map(normalizeVolunteerSlot).filter(present);
  const paymentItems = valuesFrom(draft.paymentItems).map(normalizePaymentItem).filter(present);
  const reminders = valuesFrom(draft.reminders).map(normalizeReminder).filter(present);
  const checklistItems = valuesFrom(draft.checklistItems).map(normalizeChecklistItem).filter(present);
  const locationText =
    firstOccurrence?.locationText ||
    cleanString(draft.locationText || draft.location || draft.venue, 180) ||
    "";
  const firstScheduleLabel = formatScheduleLabel(
    firstOccurrence?.startAt,
    firstOccurrence?.timezone || draft.timezone,
  );
  const description =
    cleanString(draft.summary, 420) ||
    "Envitefy Concierge built this event page, schedule, RSVP board, reminders, and planning checklist.";

  return {
    title,
    data: {
      title,
      headlineTitle: title,
      description,
      category: mode === "gymnastics" ? "Gymnastics" : mode === "school" ? "School Event" : "Event",
      eventType,
      mode,
      status: "published",
      ownership: "owned",
      createdVia: "concierge",
      conciergeVersion: "v2",
      primaryOutput: "event_page",
      productType: "event_page",
      publicRenderer: "event_page",
      ownerDefaultSurface: "event",
      startAt: firstOccurrence?.startAt || null,
      startISO: firstOccurrence?.startAt || null,
      start: firstOccurrence?.startAt || null,
      endAt: firstOccurrence?.endAt || null,
      endISO: firstOccurrence?.endAt || null,
      end: firstOccurrence?.endAt || null,
      timezone: cleanString(draft.timezone, 80) || firstOccurrence?.timezone || "America/Chicago",
      tz: cleanString(draft.timezone, 80) || firstOccurrence?.timezone || "America/Chicago",
      location: locationText,
      locationText,
      locationLabel: locationText,
      scheduleLine: firstScheduleLabel,
      whenLabel: firstScheduleLabel,
      rsvpEnabled: true,
      rsvpMode: "envitefy",
      rsvp: {
        isEnabled: true,
        enabled: true,
        mode: "envitefy",
        direct: true,
        cta: "RSVP",
      },
      requestedOutputs: ["event_page"],
      outputs: ["event_page"],
      conciergeV2: {
        programId: params.programId || null,
        draft,
      },
      scheduleHub: {
        enabled: true,
        mode,
        eventType,
        items: occurrences,
      },
      smartForms: {
        enabled: forms.length > 0,
        forms,
      },
      volunteerSignup: {
        enabled: volunteerSlots.length > 0,
        slots: volunteerSlots,
      },
      paymentTracker: {
        enabled: paymentItems.length > 0,
        manualOnly: true,
        disclaimer: "Payments are tracked manually by the organizer.",
        items: paymentItems,
      },
      reminderTimeline: {
        enabled: reminders.length > 0,
        providerStatus: "stub",
        items: reminders,
      },
      checklistItems,
      publicEvent: {
        renderer: "event_page",
        primaryOutput: "event_page",
        ownerDefaultSurface: "event",
        headline: title,
        subheadline: cleanString(draft.program?.title, 180) || "Built with Envitefy Concierge",
        body: description,
        scheduleLine: firstScheduleLabel,
        locationLine: locationText || null,
        scheduleItems: occurrences,
        checklistItems,
        forms,
        volunteerSlots,
        paymentItems,
        reminders,
        rsvpEnabled: true,
        navigation: [
          { label: "Details", target: "#details" },
          { label: "Schedule", target: "#schedule" },
          { label: "RSVP", target: "#event-rsvp" },
          ...(forms.length ? [{ label: "Forms", target: "#forms" }] : []),
          ...(volunteerSlots.length ? [{ label: "Signup", target: "#volunteer-signup" }] : []),
        ],
      },
      liveCard: {
        headline: title,
        subheadline: cleanString(draft.program?.title, 180) || "Envitefy Concierge",
        body: description,
        scheduleLine: firstScheduleLabel,
        locationLine: locationText || null,
        cta: "RSVP",
      },
    },
  };
}
