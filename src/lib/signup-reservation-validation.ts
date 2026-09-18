import type { SignupForm, SignupFormSection, SignupResponseSlot } from "@/types/signup";
import { remainingCapacityForSlot } from "@/utils/signup";
import { signupWindowMessage } from "./signup-validation";

export type SignupReservationInput = {
  slots: SignupResponseSlot[];
  name: string;
  email?: string | null;
  phone?: string | null;
  guests?: number;
  answers?: { questionId: string; value: string }[];
  signupId?: string;
  acceptWaitlist?: boolean;
};
export type ReservationIssue = { field: string; message: string; status?: 409 };
export const signupQuantityLimit = (form: SignupForm, section?: SignupFormSection) =>
  section?.maxQuantityPerSlot ??
  form.settings.maxQuantityPerSlot ??
  form.settings.maxGuestsPerSignup ??
  1;

/** Shared by the preview, participant editor and server. Never mutates or reserves anything. */
export function validateSignupReservation(
  form: SignupForm,
  input: SignupReservationInput,
  now = new Date(),
) {
  const issues: ReservationIssue[] = [];
  const add = (field: string, message: string, status?: 409) =>
    issues.push({ field, message, ...(status ? { status } : {}) });
  const window = signupWindowMessage(form, now);
  if (window) add("slots", window);
  if (!input.slots.length) add("slots", "Choose at least one slot.");
  const maxSlots = form.settings.allowMultipleSlotsPerPerson ? form.settings.maxSlotsPerPerson : 1;
  if (maxSlots && input.slots.length > maxSlots)
    add(
      "slots",
      `Choose no more than ${maxSlots} ${maxSlots === 1 ? "slot" : "slots"} across this form.`,
    );
  const waitlisted: string[] = [];
  const seen = new Set<string>();
  for (const selection of input.slots) {
    const field = `slot-${selection.sectionId}-${selection.slotId}`;
    const section = form.sections.find((s) => s.id === selection.sectionId);
    const slot = section?.slots.find((s) => s.id === selection.slotId);
    if (!section || !slot) {
      add("slots", "A selected slot no longer exists. Refresh and choose again.");
      continue;
    }
    if (seen.has(field)) add(field, "Choose each slot only once.");
    seen.add(field);
    const max = signupQuantityLimit(form, section);
    if (!Number.isInteger(selection.quantity) || selection.quantity < 1 || selection.quantity > max)
      add(field, `Choose a quantity from 1 to ${max} for ${slot.label}.`);
    if (slot.capacity !== null && selection.quantity > slot.capacity) {
      add(
        field,
        `${slot.label} has a total capacity of ${slot.capacity}. Reduce the quantity before continuing.`,
      );
      continue;
    }
    const remaining = remainingCapacityForSlot(form, section.id, slot.id, input.signupId);
    if (remaining !== null && selection.quantity > remaining) {
      waitlisted.push(slot.label);
      if (!form.settings.waitlistEnabled)
        add(
          field,
          `${slot.label} has ${remaining} available. Choose a smaller quantity or another slot.`,
          409,
        );
    }
  }
  for (const section of form.sections) {
    if (
      section.maxSelectionsPerPerson &&
      input.slots.filter((s) => s.sectionId === section.id).length > section.maxSelectionsPerPerson
    )
      add("slots", `Choose no more than ${section.maxSelectionsPerPerson} in ${section.title}.`);
  }
  if (!input.name.trim()) add("name", "Enter your name.");
  if (form.settings.collectEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email?.trim() || ""))
    add("email", "Enter a valid email address.");
  if (form.settings.collectPhone && !input.phone?.trim()) add("phone", "Enter a phone number.");
  const guests = input.guests ?? 0;
  if (!Number.isInteger(guests) || guests < 0 || guests > form.settings.maxGuestsPerSignup)
    add("guests", `Choose from 0 to ${form.settings.maxGuestsPerSignup} extra guests.`);
  for (const question of form.questions)
    if (
      question.required &&
      !input.answers?.some((a) => a.questionId === question.id && a.value.trim())
    )
      add(`question-${question.id}`, `Answer “${question.prompt}”.`);
  if (waitlisted.length && form.settings.waitlistEnabled && !input.acceptWaitlist)
    add(
      "waitlist",
      "Confirm that you want all your selections placed on the waitlist, or change the unavailable selections.",
    );
  return {
    issues,
    waitlisted,
    status: waitlisted.length ? ("waitlisted" as const) : ("confirmed" as const),
  };
}
