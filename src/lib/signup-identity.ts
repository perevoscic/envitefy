import type { SignupForm, SignupResponse } from "@/types/signup";

export type SignupIdentity = {
  userId?: string | null;
  guestId?: string | null;
  /** Set only after verifying a signed management link against the stored response. */
  managedResponseId?: string | null;
};

export function ownsSignupResponse(response: SignupResponse, identity: SignupIdentity): boolean {
  return Boolean(
    (identity.userId && response.userId === identity.userId) ||
      (identity.guestId && response.guestId === identity.guestId) ||
      (identity.managedResponseId && response.id === identity.managedResponseId),
  );
}

export function ownSignupResponseId(form: SignupForm, identity: SignupIdentity): string | null {
  if (
    identity.managedResponseId &&
    form.responses.some(
      (response) => response.id === identity.managedResponseId && response.status !== "cancelled",
    )
  )
    return identity.managedResponseId;
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
