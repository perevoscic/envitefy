import type { SignupForm, SignupResponse } from "@/types/signup";

export type SignupIdentity = { userId?: string | null; guestId?: string | null };

export function ownsSignupResponse(response: SignupResponse, identity: SignupIdentity): boolean {
  return Boolean(
    (identity.userId && response.userId === identity.userId) ||
      (identity.guestId && response.guestId === identity.guestId),
  );
}

export function ownSignupResponseId(form: SignupForm, identity: SignupIdentity): string | null {
  return (
    form.responses.find(
      (response) => response.status !== "cancelled" && ownsSignupResponse(response, identity),
    )?.id || null
  );
}

/** Browser identity hashes are server-only, including in organizer responses. */
export function withoutSignupGuestId(response: SignupResponse): SignupResponse {
  const { guestId: _guestId, ...visible } = response;
  return visible;
}
