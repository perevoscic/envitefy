export const AUTH_TRANSITION_EVENT = "envitefy:auth-transition";
export const AUTH_TRANSITION_CLEAR_EVENT = "envitefy:auth-transition-clear";

export function showAuthTransition(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(AUTH_TRANSITION_EVENT, {
      detail: { message },
    }),
  );
}

export function hideAuthTransition() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_TRANSITION_CLEAR_EVENT));
}
