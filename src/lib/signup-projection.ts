import type { SignupForm } from "@/types/signup";
import { countConfirmedForSlot, countWaitlistedForSlot } from "@/utils/signup";

/** Contacts and answers are never part of the public board payload. */
export function projectSignupForm(
  form: SignupForm,
  viewer: { isOwner?: boolean; userId?: string | null } = {},
): SignupForm {
  if (viewer.isOwner) return form;
  const availability = form.sections.flatMap((section) =>
    section.slots.map((slot) => ({
      sectionId: section.id,
      slotId: slot.id,
      confirmed: countConfirmedForSlot(form, section.id, slot.id),
      waitlisted: countWaitlistedForSlot(form, section.id, slot.id),
    })),
  );
  return {
    ...form,
    availability,
    responses: viewer.userId
      ? form.responses.filter((response) => response.userId === viewer.userId)
      : [],
  };
}
