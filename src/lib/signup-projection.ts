import type { SignupForm } from "@/types/signup";
import { countConfirmedForSlot, countWaitlistedForSlot } from "@/utils/signup";
import { ownsSignupResponse, type SignupIdentity, withoutSignupGuestId } from "./signup-identity";

/** Contacts and answers are never part of the public board payload. */
export function projectSignupForm(
  form: SignupForm,
  viewer: SignupIdentity & { isOwner?: boolean } = {},
): SignupForm {
  if (viewer.isOwner) return { ...form, responses: form.responses.map(withoutSignupGuestId) };
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
    responses: form.responses
      .filter((response) => ownsSignupResponse(response, viewer))
      .map(withoutSignupGuestId),
  };
}
