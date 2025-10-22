import {
  SignupForm,
  SignupFormSection,
  SignupFormSlot,
  SignupFormSettings,
  SignupQuestion,
  SignupResponse,
  SignupResponseSlot,
  SignupResponseStatus,
} from "@/types/signup";

export const SIGNUP_FORM_VERSION = 1;

const ID_PREFIX = "sg";

export const DEFAULT_SIGNUP_SETTINGS: SignupFormSettings = {
  allowMultipleSlotsPerPerson: false,
  maxGuestsPerSignup: 1,
  waitlistEnabled: true,
  lockWhenFull: true,
  collectPhone: true,
  collectEmail: true,
  showRemainingSpots: true,
  autoRemindersHoursBefore: [24, 2],
};

export const generateSignupId = (): string =>
  `${ID_PREFIX}-${Math.random().toString(36).slice(2, 10)}`;

export const createSignupSlot = (
  overrides: Partial<SignupFormSlot> = {}
): SignupFormSlot => ({
  id: generateSignupId(),
  label: overrides.label ?? "Volunteer spot",
  capacity:
    typeof overrides.capacity === "number"
      ? overrides.capacity
      : overrides.capacity === null
      ? null
      : 1,
  startTime: overrides.startTime ?? null,
  endTime: overrides.endTime ?? null,
  notes: overrides.notes ?? null,
});

export const createSignupSection = (
  overrides: Partial<SignupFormSection> = {}
): SignupFormSection => ({
  id: generateSignupId(),
  title: overrides.title ?? "Sign-up section",
  description: overrides.description ?? null,
  slots:
    overrides.slots && overrides.slots.length > 0
      ? overrides.slots
      : [createSignupSlot()],
});

export const createDefaultSignupForm = (): SignupForm => ({
  version: SIGNUP_FORM_VERSION,
  enabled: true,
  title: "Smart sign-up sheet",
  description:
    "Let guests claim roles, time slots, or supplies. We’ll send automatic reminders and manage waitlists for you.",
  sections: [
    createSignupSection({
      title: "Arrival shifts",
      description: "Claim a slot to help with setup or check-in.",
      slots: [
        createSignupSlot({
          label: "Setup crew · arrives 1 hour early",
          capacity: 4,
        }),
        createSignupSlot({
          label: "Check-in table · welcome guests",
          capacity: 2,
        }),
      ],
    }),
  ],
  questions: [
    {
      id: generateSignupId(),
      prompt: "Anything we should know? (allergies, special requests)",
      multiline: true,
      required: false,
    },
  ],
  settings: { ...DEFAULT_SIGNUP_SETTINGS },
  responses: [],
});

const sanitizeCapacity = (value: unknown): number | null => {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded <= 0) return null;
  if (rounded > 999) return 999;
  return rounded;
};

const sanitizeReminders = (input: unknown): number[] => {
  if (!Array.isArray(input)) return [...DEFAULT_SIGNUP_SETTINGS.autoRemindersHoursBefore];
  const cleaned = input
    .map((n) => {
      const num = typeof n === "string" ? Number.parseInt(n, 10) : n;
      if (typeof num !== "number" || !Number.isFinite(num)) return null;
      const rounded = Math.max(1, Math.min(24 * 14, Math.round(num)));
      return rounded;
    })
    .filter((n): n is number => typeof n === "number");
  const unique = Array.from(new Set(cleaned));
  unique.sort((a, b) => a - b);
  return unique.length ? unique : [...DEFAULT_SIGNUP_SETTINGS.autoRemindersHoursBefore];
};

const sanitizeQuestions = (questions: SignupQuestion[]): SignupQuestion[] => {
  return questions
    .map((q) => {
      const prompt = (q.prompt || "").trim();
      if (!prompt) return null;
      return {
        id: q.id || generateSignupId(),
        prompt,
        required: Boolean(q.required),
        multiline: Boolean(q.multiline),
      };
    })
    .filter((q): q is SignupQuestion => Boolean(q));
};

const sanitizeSections = (sections: SignupFormSection[]): SignupFormSection[] => {
  return sections
    .map((section) => {
      const title = (section.title || "").trim();
      const normalizedTitle = title || "Sign-up section";
      const normalizedDescription = section.description
        ? section.description.trim() || null
        : null;
      const slots = (section.slots || [])
        .map((slot) => {
          const label = (slot.label || "").trim();
          if (!label) return null;
          return {
            id: slot.id || generateSignupId(),
            label,
            capacity: sanitizeCapacity(slot.capacity),
            startTime: slot.startTime?.trim()
              ? slot.startTime.trim()
              : null,
            endTime: slot.endTime?.trim() ? slot.endTime.trim() : null,
            notes: slot.notes?.trim() ? slot.notes.trim() : null,
          };
        })
        .filter((slot): slot is SignupFormSlot => Boolean(slot));
      if (!slots.length) return null;
      return {
        id: section.id || generateSignupId(),
        title: normalizedTitle,
        description: normalizedDescription,
        slots,
      };
    })
    .filter((section): section is SignupFormSection => Boolean(section));
};

const sanitizeSettings = (settings: SignupFormSettings): SignupFormSettings => {
  const merged = { ...DEFAULT_SIGNUP_SETTINGS, ...settings };
  const maxGuests = Math.max(1, Math.min(20, Math.round(merged.maxGuestsPerSignup || 1)));
  return {
    allowMultipleSlotsPerPerson: Boolean(merged.allowMultipleSlotsPerPerson),
    maxGuestsPerSignup: maxGuests,
    waitlistEnabled: Boolean(merged.waitlistEnabled),
    lockWhenFull: Boolean(merged.lockWhenFull),
    collectPhone: Boolean(merged.collectPhone),
    collectEmail: Boolean(merged.collectEmail),
    showRemainingSpots: Boolean(merged.showRemainingSpots),
    autoRemindersHoursBefore: sanitizeReminders(merged.autoRemindersHoursBefore),
  };
};

export const sanitizeSignupForm = (form: SignupForm): SignupForm => {
  const sections = sanitizeSections(form.sections || []);
  const settings = sanitizeSettings(form.settings || DEFAULT_SIGNUP_SETTINGS);
  const responses: SignupResponse[] = Array.isArray(form.responses)
    ? form.responses
    : [];
  const questions = sanitizeQuestions(form.questions || []);

  if (!sections.length) {
    return {
      version: SIGNUP_FORM_VERSION,
      enabled: false,
      title: (form.title || "").trim() || "Sign-up sheet",
      description: form.description?.trim() ? form.description.trim() : null,
      sections: [],
      questions: [],
      settings,
      responses,
    };
  }

  return {
    version: SIGNUP_FORM_VERSION,
    enabled: Boolean(form.enabled),
    title: (form.title || "").trim() || "Sign-up sheet",
    description: form.description?.trim() ? form.description.trim() : null,
    sections,
    questions,
    settings,
    responses,
  };
};

const SLOT_KEY_SEPARATOR = "::";

const makeSlotKey = (sectionId: string, slotId: string): string =>
  `${sectionId}${SLOT_KEY_SEPARATOR}${slotId}`;

export const normalizeSignupQuantity = (raw: unknown): number => {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const rounded = Math.round(raw);
    if (rounded <= 0) return 1;
    if (rounded > 50) return 50;
    return rounded;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return 1;
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    if (parsed > 50) return 50;
    return parsed;
  }
  return 1;
};

export const findSignupSection = (
  form: SignupForm,
  sectionId: string
): SignupFormSection | null => {
  return form.sections.find((section) => section.id === sectionId) ?? null;
};

export const findSignupSlot = (
  form: SignupForm,
  sectionId: string,
  slotId: string
): SignupFormSlot | null => {
  const section = findSignupSection(form, sectionId);
  if (!section) return null;
  return section.slots.find((slot) => slot.id === slotId) ?? null;
};

export const getSlotCapacity = (slot: SignupFormSlot): number | null => {
  const value = typeof slot.capacity === "number" ? slot.capacity : null;
  if (value === null) return null;
  if (!Number.isFinite(value)) return null;
  const normalized = Math.round(value);
  if (normalized <= 0) return null;
  return Math.min(999, normalized);
};

const countForSlotByStatus = (
  form: SignupForm,
  sectionId: string,
  slotId: string,
  status: SignupResponseStatus,
  excludeResponseId?: string | null
): number => {
  const key = makeSlotKey(sectionId, slotId);
  return form.responses.reduce((total, response) => {
    if (excludeResponseId && response.id === excludeResponseId) return total;
    if (response.status !== status) return total;
    const slotSelection = (response.slots || []).find(
      (slot) => makeSlotKey(slot.sectionId, slot.slotId) === key
    );
    if (!slotSelection) return total;
    return total + normalizeSignupQuantity(slotSelection.quantity ?? 1);
  }, 0);
};

export const countConfirmedForSlot = (
  form: SignupForm,
  sectionId: string,
  slotId: string,
  excludeResponseId?: string | null
): number =>
  countForSlotByStatus(form, sectionId, slotId, "confirmed", excludeResponseId);

export const countWaitlistedForSlot = (
  form: SignupForm,
  sectionId: string,
  slotId: string
): number => countForSlotByStatus(form, sectionId, slotId, "waitlisted");

export const remainingCapacityForSlot = (
  form: SignupForm,
  sectionId: string,
  slotId: string,
  excludeResponseId?: string | null
): number | null => {
  const slot = findSignupSlot(form, sectionId, slotId);
  if (!slot) return null;
  const capacity = getSlotCapacity(slot);
  if (capacity === null) return null;
  const confirmed = countConfirmedForSlot(
    form,
    sectionId,
    slotId,
    excludeResponseId
  );
  return Math.max(0, capacity - confirmed);
};

export const findSignupResponseForUser = (
  form: SignupForm,
  userId?: string | null,
  email?: string | null
): SignupResponse | null => {
  if (userId) {
    const byUserId =
      form.responses.find(
        (response) =>
          response.userId === userId && response.status !== "cancelled"
      ) ?? null;
    if (byUserId) return byUserId;
  }
  if (email) {
    const lower = email.toLowerCase();
    const byEmail =
      form.responses.find(
        (response) =>
          response.status !== "cancelled" &&
          typeof response.email === "string" &&
          response.email.toLowerCase() === lower
      ) ?? null;
    if (byEmail) return byEmail;
  }
  return null;
};

export const rebalanceSignupWaitlist = (form: SignupForm): SignupForm => {
  const slotUsage = new Map<string, number>();
  const nowIso = new Date().toISOString();
  const overrides = new Map<string, { status: SignupResponseStatus; updatedAt: string }>();

  const active = form.responses
    .filter((response) => response.status !== "cancelled")
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return ta - tb;
    });

  for (const response of active) {
    const selections = Array.isArray(response.slots) ? response.slots : [];
    const canConfirm = selections.every((slot) => {
      const slotMeta = findSignupSlot(form, slot.sectionId, slot.slotId);
      if (!slotMeta) return false;
      const capacity = getSlotCapacity(slotMeta);
      if (capacity === null) return true;
      const key = makeSlotKey(slot.sectionId, slot.slotId);
      const used = slotUsage.get(key) ?? 0;
      const quantity = normalizeSignupQuantity(slot.quantity ?? 1);
      return used + quantity <= capacity;
    });
    if (canConfirm) {
      overrides.set(response.id, {
        status: "confirmed",
        updatedAt:
          response.status === "confirmed" ? response.updatedAt : nowIso,
      });
      for (const slot of selections) {
        const key = makeSlotKey(slot.sectionId, slot.slotId);
        const next = (slotUsage.get(key) ?? 0) + normalizeSignupQuantity(slot.quantity ?? 1);
        slotUsage.set(key, next);
      }
    } else {
      overrides.set(response.id, {
        status: "waitlisted",
        updatedAt:
          response.status === "waitlisted" ? response.updatedAt : nowIso,
      });
    }
  }

  const nextResponses = form.responses.map((response) => {
    if (response.status === "cancelled") return response;
    const override = overrides.get(response.id);
    if (!override || override.status === response.status) return response;
    return {
      ...response,
      status: override.status,
      updatedAt: override.updatedAt,
    };
  });

  return { ...form, responses: nextResponses };
};
