import type { SignupForm, SignupResponse, SignupResponseSlot } from "@/types/signup";
import {
  countConfirmedForSlot,
  findSignupSlot,
  generateSignupId,
  rebalanceSignupWaitlist,
  remainingCapacityForSlot,
  sanitizeSignupForm,
} from "@/utils/signup";
import { signupWindowMessage, validateSignupPublish } from "./signup-validation";

export class SignupMutationError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value: unknown, length = 1000): string =>
  typeof value === "string" ? value.trim().slice(0, length) : "";

/** Read the same definition as the public page; derived counts never enter storage. */
export function readStoredSignup(value: unknown): SignupForm {
  if (!record(value) || !Array.isArray(value.sections))
    throw new SignupMutationError("This event has no signup form.", 404);
  const form = sanitizeSignupForm({ ...value, enabled: value.enabled !== false } as SignupForm);
  delete form.availability;
  return form;
}

export function updateSignupDefinition(
  currentValue: unknown,
  incomingValue: unknown,
  draft = false,
): SignupForm {
  const current = currentValue ? readStoredSignup(currentValue) : null;
  const incoming = readStoredSignup(incomingValue);
  if (current && (incoming.revision || 0) !== (current.revision || 0)) {
    throw new SignupMutationError(
      "This signup changed in another window. Reload the latest version before saving your edits.",
      409,
    );
  }
  const next = {
    ...incoming,
    responses: current?.responses || [],
    revision: (current?.revision || 0) + 1,
  };
  if (!draft) {
    const issues = validateSignupPublish(next);
    if (issues.length) throw new SignupMutationError(issues[0].message);
  }
  for (const response of next.responses.filter((entry) => entry.status !== "cancelled")) {
    for (const selection of response.slots) {
      const slot = findSignupSlot(next, selection.sectionId, selection.slotId);
      if (!slot)
        throw new SignupMutationError(
          "A slot already has signups. Keep it, or cancel its signups before removing it.",
          409,
        );
      if (
        slot.capacity !== null &&
        current &&
        slot.capacity < countConfirmedForSlot(current, selection.sectionId, selection.slotId)
      ) {
        throw new SignupMutationError(
          `The capacity for ${slot.label} cannot be lower than its confirmed signups.`,
          409,
        );
      }
    }
  }
  return next;
}

type Actor = { userId: string; email: string; name?: string | null; isOwner: boolean };
export function mutateSignupReservation(
  form: SignupForm,
  payload: unknown,
  actor: Actor,
  now = new Date(),
): { form: SignupForm; response?: SignupResponse } {
  if (!record(payload)) throw new SignupMutationError("Invalid signup request.");
  const action = payload.action;
  if (action === "set-open") {
    if (!actor.isOwner)
      throw new SignupMutationError("Only the organizer can open or close signups.", 403);
    if (typeof payload.enabled !== "boolean")
      throw new SignupMutationError("Choose whether signups are open.");
    return { form: { ...form, enabled: payload.enabled, revision: (form.revision || 0) + 1 } };
  }
  const signupId = text(payload.signupId, 120);
  const existing = signupId ? form.responses.find((entry) => entry.id === signupId) : undefined;
  if (signupId && !existing)
    throw new SignupMutationError(
      "That signup no longer exists. Refresh the page and try again.",
      404,
    );
  if (existing && !actor.isOwner && existing.userId !== actor.userId)
    throw new SignupMutationError("You can only update your own signup.", 403);
  const nowIso = now.toISOString();
  if (action === "cancel") {
    if (!existing) throw new SignupMutationError("Choose a signup to cancel.");
    return {
      form: rebalanceSignupWaitlist({
        ...form,
        responses: form.responses.map((entry) =>
          entry.id === existing.id ? { ...entry, status: "cancelled", updatedAt: nowIso } : entry,
        ),
      }),
    };
  }
  if (action !== "reserve") throw new SignupMutationError("Unsupported signup action.");
  const windowMessage = signupWindowMessage(form, now);
  if (windowMessage) throw new SignupMutationError(windowMessage, 409);
  if (
    !signupId &&
    form.responses.some((entry) => entry.userId === actor.userId && entry.status !== "cancelled")
  )
    throw new SignupMutationError("You already have a signup. Use Edit signup to change it.", 409);
  if (!Array.isArray(payload.slots) || !payload.slots.length || payload.slots.length > 200)
    throw new SignupMutationError("Pick at least one slot.");
  const slots: SignupResponseSlot[] = [];
  const seen = new Set<string>();
  for (const entry of payload.slots) {
    if (!record(entry)) throw new SignupMutationError("Invalid slot selection.");
    const sectionId = text(entry.sectionId, 120),
      slotId = text(entry.slotId, 120);
    if (!findSignupSlot(form, sectionId, slotId))
      throw new SignupMutationError(
        "A selected slot no longer exists. Refresh the page and choose again.",
        409,
      );
    const key = `${sectionId}::${slotId}`;
    if (seen.has(key)) throw new SignupMutationError("Select each slot only once.");
    seen.add(key);
    const quantity = entry.quantity ?? 1;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 50
    )
      throw new SignupMutationError("Use a quantity from 1 to 50.");
    slots.push({ sectionId, slotId, quantity });
  }
  const maxSlots = form.settings.allowMultipleSlotsPerPerson ? form.settings.maxSlotsPerPerson : 1;
  if (maxSlots && slots.length > maxSlots)
    throw new SignupMutationError(
      `Choose no more than ${maxSlots} ${maxSlots === 1 ? "slot" : "slots"} per person.`,
    );
  const name = text(payload.name, 180) || text(actor.name, 180);
  if (!name) throw new SignupMutationError("Tell us who is signing up.");
  const email = form.settings.collectEmail
    ? text(payload.email, 254) || (existing ? existing.email : actor.email) || ""
    : null;
  if (email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new SignupMutationError("Enter a valid email address.");
  const phone = form.settings.collectPhone ? text(payload.phone, 60) : null;
  if (form.settings.collectPhone && !phone) throw new SignupMutationError("Enter a phone number.");
  const guests = payload.guests ?? 0;
  if (
    typeof guests !== "number" ||
    !Number.isInteger(guests) ||
    guests < 0 ||
    guests > form.settings.maxGuestsPerSignup
  )
    throw new SignupMutationError(
      `Choose from 0 to ${form.settings.maxGuestsPerSignup} additional guests.`,
    );
  const rawAnswers = Array.isArray(payload.answers) ? payload.answers : [];
  const answers = form.questions.flatMap((question) => {
    const raw = rawAnswers.find(
      (entry) => record(entry) && (entry.questionId === question.id || entry.id === question.id),
    );
    const value = record(raw) ? text(raw.value, 4000) : "";
    if (question.required && !value)
      throw new SignupMutationError(`Answer “${question.prompt}” before submitting.`);
    return value ? [{ questionId: question.id, value }] : [];
  });
  const withoutExisting = {
    ...form,
    availability: undefined,
    responses: form.responses.filter((entry) => entry.id !== existing?.id),
  };
  const full = slots.some((slot) => {
    const remaining = remainingCapacityForSlot(withoutExisting, slot.sectionId, slot.slotId);
    return remaining !== null && slot.quantity > remaining;
  });
  if (full && !form.settings.waitlistEnabled)
    throw new SignupMutationError(
      "A selected slot is full. Refresh availability and choose another slot.",
      409,
    );
  const response: SignupResponse = {
    id: existing?.id || generateSignupId(),
    userId: existing ? existing.userId : actor.userId,
    name,
    email,
    phone,
    guests,
    note: text(payload.note, 4000) || null,
    slots,
    answers,
    status: full ? "waitlisted" : "confirmed",
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
  };
  const next = rebalanceSignupWaitlist({
    ...withoutExisting,
    responses: [...withoutExisting.responses, response],
  });
  return { form: next, response: next.responses.find((entry) => entry.id === response.id) };
}
