import {
  SignupForm,
  SignupFormSection,
  SignupFormSlot,
  SignupFormSettings,
  SignupQuestion,
  SignupResponse,
  SignupResponseStatus,
  SignupFormHeader,
  SignupSafetyFlags,
} from "@/types/signup";

export const SIGNUP_FORM_VERSION = 1;

const ID_PREFIX = "sg";

export const DEFAULT_SIGNUP_SETTINGS: SignupFormSettings = {
  allowMultipleSlotsPerPerson: false,
  maxSlotsPerPerson: null,
  maxGuestsPerSignup: 1,
  waitlistEnabled: true,
  lockWhenFull: true,
  collectPhone: true,
  collectEmail: true,
  showRemainingSpots: true,
  autoRemindersHoursBefore: [24, 2],
  hideParticipantNames: false,
  signupOpensAt: null,
  signupClosesAt: null,
};

export const generateSignupId = (): string =>
  `${ID_PREFIX}-${Math.random().toString(36).slice(2, 10)}`;

export const createSignupSlot = (
  overrides: Partial<SignupFormSlot> = {}
): SignupFormSlot => ({
  id: generateSignupId(),
  label: overrides.label ?? "",
  capacity:
    typeof overrides.capacity === "number"
      ? overrides.capacity
      : overrides.capacity === null
      ? null
      : null,
  startTime: overrides.startTime ?? null,
  endTime: overrides.endTime ?? null,
  notes: overrides.notes ?? null,
});

export const createSignupSection = (
  overrides: Partial<SignupFormSection> = {}
): SignupFormSection => ({
  id: generateSignupId(),
  title: overrides.title ?? "",
  description: overrides.description ?? null,
  slots:
    overrides.slots && overrides.slots.length > 0
      ? overrides.slots
      : [createSignupSlot()],
});

export const createDefaultSignupForm = (): SignupForm => ({
  version: SIGNUP_FORM_VERSION,
  enabled: true,
  title: "",
  description: null,
  venue: null,
  location: null,
  room: null,
  parkingInfo: null,
  arrivalInstructions: null,
  dropoffNotes: null,
  start: (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    // Store date only by default; time remains blank until chosen
    return `${yyyy}-${mm}-${dd}`;
  })(),
  end: null,
  setupTime: null,
  earliestDropoff: null,
  arrivalWindow: null,
  timezone: null,
  allDay: null,
  gradeOrAge: null,
  audience: [],
  themeCategory: null,
  themeImage: null,
  colorStory: null,
  headerTemplate: null,
  vibeDirection: null,
  safetyNotes: null,
  requirements: null,
  safetyFlags: {
    allergens: false,
    outdoor: false,
    equipment: false,
    travel: false,
    permission: false,
    sensitiveInfo: false,
    photoConsent: false,
    emergencyContact: false,
  },
  header: {
    backgroundColor: "#F5F5F4",
    backgroundImage: null,
    groupName: "",
    creatorName: "",
  },
  sections: [
    createSignupSection({
      title: "",
      description: null,
      slots: [
        createSignupSlot({
          label: "",
          capacity: null,
        }),
        createSignupSlot({
          label: "",
          capacity: null,
        }),
      ],
    }),
  ],
  questions: [],
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
  const mapped: Array<SignupQuestion | null> = questions.map((q) => {
    const prompt = (q.prompt || "").trim();
    if (!prompt) return null;
    const normalized: SignupQuestion = {
      id: q.id || generateSignupId(),
      prompt,
    };
    if (typeof q.required !== "undefined") {
      normalized.required = Boolean(q.required);
    }
    if (typeof q.multiline !== "undefined") {
      normalized.multiline = Boolean(q.multiline);
    }
    return normalized;
  });
  return mapped.filter((q): q is SignupQuestion => Boolean(q));
};

const sanitizeSections = (sections: SignupFormSection[]): SignupFormSection[] => {
  return sections
    .map((section) => {
      const title = (section.title || "").trim();
      const normalizedTitle = title || "Sign-up section";
      const normalizedDescription: string | null = section.description
        ? section.description.trim() || null
        : null;
      const slots: SignupFormSlot[] = (section.slots || [])
        .map((slot) => {
          const label = (slot.label || "").trim();
          if (!label) return null;
          const built: SignupFormSlot = {
            id: slot.id || generateSignupId(),
            label,
            capacity: sanitizeCapacity(slot.capacity),
            startTime: slot.startTime?.trim() ? slot.startTime.trim() : null,
            endTime: slot.endTime?.trim() ? slot.endTime.trim() : null,
            notes: slot.notes?.trim() ? slot.notes.trim() : null,
          };
          return built;
        })
        .filter((slot): slot is SignupFormSlot => Boolean(slot));
      if (!slots.length) return null;
      const builtSection: SignupFormSection = {
        id: section.id || generateSignupId(),
        title: normalizedTitle,
        description: normalizedDescription,
        slots,
      };
      return builtSection;
    })
    .filter((section): section is SignupFormSection => Boolean(section));
};

const sanitizeSettings = (settings: SignupFormSettings): SignupFormSettings => {
  const merged = { ...DEFAULT_SIGNUP_SETTINGS, ...settings };
  const maxGuests = Math.max(1, Math.min(20, Math.round(merged.maxGuestsPerSignup || 1)));
  return {
    allowMultipleSlotsPerPerson: Boolean(merged.allowMultipleSlotsPerPerson),
    maxSlotsPerPerson:
      typeof merged.maxSlotsPerPerson === "number" && Number.isFinite(merged.maxSlotsPerPerson)
        ? Math.max(1, Math.min(50, Math.round(merged.maxSlotsPerPerson)))
        : null,
    maxGuestsPerSignup: maxGuests,
    waitlistEnabled: Boolean(merged.waitlistEnabled),
    lockWhenFull: Boolean(merged.lockWhenFull),
    collectPhone: Boolean(merged.collectPhone),
    collectEmail: Boolean(merged.collectEmail),
    showRemainingSpots: Boolean(merged.showRemainingSpots),
    autoRemindersHoursBefore: sanitizeReminders(merged.autoRemindersHoursBefore),
    hideParticipantNames: Boolean(merged.hideParticipantNames),
    signupOpensAt: merged.signupOpensAt || null,
    signupClosesAt: merged.signupClosesAt || null,
  };
};

const sanitizeSafetyFlags = (raw: unknown): SignupSafetyFlags | null => {
  if (!raw || typeof raw !== "object") return null;
  const merged: SignupSafetyFlags = {
    allergens: Boolean((raw as any).allergens),
    outdoor: Boolean((raw as any).outdoor),
    equipment: Boolean((raw as any).equipment),
    travel: Boolean((raw as any).travel),
    permission: Boolean((raw as any).permission),
    sensitiveInfo: Boolean((raw as any).sensitiveInfo),
    photoConsent: Boolean((raw as any).photoConsent),
    emergencyContact: Boolean((raw as any).emergencyContact),
  };
  const anyTrue = Object.values(merged).some(Boolean);
  return anyTrue ? merged : null;
};

export const sanitizeSignupForm = (form: SignupForm): SignupForm => {
  const sections = sanitizeSections(form.sections || []);
  const settings = sanitizeSettings(form.settings || DEFAULT_SIGNUP_SETTINGS);
  const responses: SignupResponse[] = Array.isArray(form.responses)
    ? form.responses
    : [];
  const questions = sanitizeQuestions(form.questions || []);
  const header: SignupFormHeader | null = (() => {
    const raw = form.header || null;
    if (!raw || typeof raw !== "object") return null;
    const backgroundColor = typeof (raw as any).backgroundColor === "string" && (raw as any).backgroundColor.trim()
      ? (raw as any).backgroundColor.trim()
      : null;
    const backgroundCss = typeof (raw as any).backgroundCss === "string" && (raw as any).backgroundCss.trim()
      ? (raw as any).backgroundCss.trim()
      : null;
    const imageCandidate = (raw as any).backgroundImage;
    const backgroundImage = imageCandidate && typeof imageCandidate === "object" && typeof imageCandidate.dataUrl === "string"
      ? {
          name: String(imageCandidate.name || "image"),
          type: String(imageCandidate.type || "image/*"),
          dataUrl: imageCandidate.dataUrl as string,
        }
      : null;
    const groupName = (raw as any).groupName?.trim() || null;
    const creatorName = (raw as any).creatorName?.trim() || null;
    const designTheme = (() => {
      const dt = (raw as any).designTheme;
      return typeof dt === "string" && dt.trim() ? dt.trim() : null;
    })();
    const templateId = typeof (raw as any).templateId === "string" ? ((raw as any).templateId as string) : null;
    const themeId = typeof (raw as any).themeId === "string" ? ((raw as any).themeId as string) : null;
    const textColor1 = typeof (raw as any).textColor1 === "string" ? ((raw as any).textColor1 as string) : null;
    const textColor2 = typeof (raw as any).textColor2 === "string" ? ((raw as any).textColor2 as string) : null;
    const buttonColor = typeof (raw as any).buttonColor === "string" ? ((raw as any).buttonColor as string) : null;
    const buttonTextColor = typeof (raw as any).buttonTextColor === "string" ? ((raw as any).buttonTextColor as string) : null;
    const images = Array.isArray((raw as any).images)
      ? ((raw as any).images as Array<any>)
          .map((img) =>
            img && typeof img === "object" && typeof img.dataUrl === "string"
              ? {
                  id: String(img.id || generateSignupId()),
                  name: String(img.name || "image"),
                  type: String(img.type || "image/*"),
                  dataUrl: img.dataUrl as string,
                }
              : null
          )
          .filter((v): v is { id: string; name: string; type: string; dataUrl: string } => Boolean(v))
      : null;
    if (!backgroundColor && !backgroundCss && !backgroundImage && !groupName && !creatorName && !designTheme && !templateId && !images)
      return null;
    return {
      backgroundColor,
      backgroundCss,
      backgroundImage,
      groupName,
      creatorName,
      designTheme,
      templateId,
      themeId,
      textColor1,
      textColor2,
      buttonColor,
      buttonTextColor,
      images,
    } as SignupFormHeader;
  })();

  if (!sections.length) {
    return {
      version: SIGNUP_FORM_VERSION,
      enabled: false,
      title: (form.title || "").trim() || "Sign-up sheet",
      description: form.description?.trim() ? form.description.trim() : null,
      venue: (form as any).venue?.trim ? ((form as any).venue as string).trim() || null : (form as any).venue ?? null,
      location: (form as any).location?.trim ? ((form as any).location as string).trim() || null : (form as any).location ?? null,
      room: (form as any).room?.trim ? ((form as any).room as string).trim() || null : (form as any).room ?? null,
      parkingInfo: (form as any).parkingInfo?.trim ? ((form as any).parkingInfo as string).trim() || null : (form as any).parkingInfo ?? null,
      arrivalInstructions: (form as any).arrivalInstructions?.trim
        ? ((form as any).arrivalInstructions as string).trim() || null
        : (form as any).arrivalInstructions ?? null,
      dropoffNotes: (form as any).dropoffNotes?.trim
        ? ((form as any).dropoffNotes as string).trim() || null
        : (form as any).dropoffNotes ?? null,
      start: (form as any).start?.trim ? ((form as any).start as string).trim() || null : (form as any).start ?? null,
      end: (form as any).end?.trim ? ((form as any).end as string).trim() || null : (form as any).end ?? null,
      setupTime: (form as any).setupTime?.trim ? ((form as any).setupTime as string).trim() || null : (form as any).setupTime ?? null,
      earliestDropoff:
        (form as any).earliestDropoff?.trim && typeof (form as any).earliestDropoff === "string"
          ? ((form as any).earliestDropoff as string).trim() || null
          : (form as any).earliestDropoff ?? null,
      arrivalWindow:
        (form as any).arrivalWindow?.trim && typeof (form as any).arrivalWindow === "string"
          ? ((form as any).arrivalWindow as string).trim() || null
          : (form as any).arrivalWindow ?? null,
      timezone: (form as any).timezone?.trim ? ((form as any).timezone as string).trim() || null : (form as any).timezone ?? null,
      allDay: typeof (form as any).allDay === "boolean" ? Boolean((form as any).allDay) : null,
      gradeOrAge: (form as any).gradeOrAge?.trim ? ((form as any).gradeOrAge as string).trim() || null : (form as any).gradeOrAge ?? null,
      audience: Array.isArray((form as any).audience)
        ? ((form as any).audience as any[]).filter((a) => typeof a === "string" && a.trim()).map((a) => a.trim())
        : null,
      themeCategory: (form as any).themeCategory?.trim
        ? ((form as any).themeCategory as string).trim() || null
        : (form as any).themeCategory ?? null,
      themeImage: (form as any).themeImage?.trim ? ((form as any).themeImage as string).trim() || null : (form as any).themeImage ?? null,
      colorStory: (form as any).colorStory?.trim ? ((form as any).colorStory as string).trim() || null : (form as any).colorStory ?? null,
      headerTemplate: (form as any).headerTemplate?.trim
        ? ((form as any).headerTemplate as string).trim() || null
        : (form as any).headerTemplate ?? null,
      vibeDirection: (form as any).vibeDirection?.trim
        ? ((form as any).vibeDirection as string).trim() || null
        : (form as any).vibeDirection ?? null,
      safetyNotes: (form as any).safetyNotes?.trim ? ((form as any).safetyNotes as string).trim() || null : (form as any).safetyNotes ?? null,
      requirements: (form as any).requirements?.trim ? ((form as any).requirements as string).trim() || null : (form as any).requirements ?? null,
      safetyFlags: sanitizeSafetyFlags((form as any).safetyFlags),
      header: header || null,
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
    venue: (form as any).venue?.trim ? ((form as any).venue as string).trim() || null : (form as any).venue ?? null,
    location: (form as any).location?.trim ? ((form as any).location as string).trim() || null : (form as any).location ?? null,
    room: (form as any).room?.trim ? ((form as any).room as string).trim() || null : (form as any).room ?? null,
    parkingInfo: (form as any).parkingInfo?.trim ? ((form as any).parkingInfo as string).trim() || null : (form as any).parkingInfo ?? null,
    arrivalInstructions: (form as any).arrivalInstructions?.trim
      ? ((form as any).arrivalInstructions as string).trim() || null
      : (form as any).arrivalInstructions ?? null,
    dropoffNotes: (form as any).dropoffNotes?.trim
      ? ((form as any).dropoffNotes as string).trim() || null
      : (form as any).dropoffNotes ?? null,
    start: (form as any).start?.trim ? ((form as any).start as string).trim() || null : (form as any).start ?? null,
    end: (form as any).end?.trim ? ((form as any).end as string).trim() || null : (form as any).end ?? null,
    setupTime: (form as any).setupTime?.trim ? ((form as any).setupTime as string).trim() || null : (form as any).setupTime ?? null,
    earliestDropoff:
      (form as any).earliestDropoff?.trim && typeof (form as any).earliestDropoff === "string"
        ? ((form as any).earliestDropoff as string).trim() || null
        : (form as any).earliestDropoff ?? null,
    arrivalWindow:
      (form as any).arrivalWindow?.trim && typeof (form as any).arrivalWindow === "string"
        ? ((form as any).arrivalWindow as string).trim() || null
        : (form as any).arrivalWindow ?? null,
    timezone: (form as any).timezone?.trim ? ((form as any).timezone as string).trim() || null : (form as any).timezone ?? null,
    allDay: typeof (form as any).allDay === "boolean" ? Boolean((form as any).allDay) : null,
    gradeOrAge: (form as any).gradeOrAge?.trim ? ((form as any).gradeOrAge as string).trim() || null : (form as any).gradeOrAge ?? null,
    audience: Array.isArray((form as any).audience)
      ? ((form as any).audience as any[]).filter((a) => typeof a === "string" && a.trim()).map((a) => a.trim())
      : null,
    themeCategory: (form as any).themeCategory?.trim ? ((form as any).themeCategory as string).trim() || null : (form as any).themeCategory ?? null,
    themeImage: (form as any).themeImage?.trim ? ((form as any).themeImage as string).trim() || null : (form as any).themeImage ?? null,
    colorStory: (form as any).colorStory?.trim ? ((form as any).colorStory as string).trim() || null : (form as any).colorStory ?? null,
    headerTemplate: (form as any).headerTemplate?.trim
      ? ((form as any).headerTemplate as string).trim() || null
      : (form as any).headerTemplate ?? null,
    vibeDirection: (form as any).vibeDirection?.trim ? ((form as any).vibeDirection as string).trim() || null : (form as any).vibeDirection ?? null,
    safetyNotes: (form as any).safetyNotes?.trim ? ((form as any).safetyNotes as string).trim() || null : (form as any).safetyNotes ?? null,
    requirements: (form as any).requirements?.trim ? ((form as any).requirements as string).trim() || null : (form as any).requirements ?? null,
    safetyFlags: sanitizeSafetyFlags((form as any).safetyFlags),
    header: header || null,
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
  email?: string | null,
  phone?: string | null
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
  if (phone) {
    const normalizedPhone = phone.trim().replace(/\D/g, ""); // Normalize phone: remove non-digits
    if (normalizedPhone) {
      const byPhone =
        form.responses.find(
          (response) =>
            response.status !== "cancelled" &&
            typeof response.phone === "string" &&
            response.phone.trim().replace(/\D/g, "") === normalizedPhone
        ) ?? null;
      if (byPhone) return byPhone;
    }
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
