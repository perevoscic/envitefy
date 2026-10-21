import { mobileReturnPath } from "./mobile-auth-contract";
import type { SignupIntent } from "./signup-intent";

type NativeSignIn = {
  returnTo: string;
  mode: "login" | "signup";
  intent?: SignupIntent;
  calendar?: "google" | "outlook";
};
type NativeSignInMessage = NativeSignIn & { action: "request-authenticate" | "authenticate" };
type NativeMessage = NativeSignInMessage | { action: "appearance"; scheme: "system" | "light" | "dark" };
type NativeWindow = Window & {
  webkit?: { messageHandlers?: { envitefy?: { postMessage(message: NativeMessage): void } } };
};

/** Returns false in an ordinary browser; the existing website flow stays intact. */
export function startNativeIOSSignIn(input: NativeSignIn): boolean {
  return postNativeSignIn("request-authenticate", input);
}

/** The system browser opens only after editors finish Save / Discard / Keep editing. */
export function guardNativeIOSSignIn(
  input: NativeSignIn,
  requestLeave: (proceed: () => void) => void,
): void {
  requestLeave(() => {
    postNativeSignIn("authenticate", input);
  });
}

export function postNativeIOSAppearance(scheme: "system" | "light" | "dark"): void {
  if (typeof window === "undefined" || !/EnvitefyIOS\//.test(navigator.userAgent)) return;
  (window as NativeWindow).webkit?.messageHandlers?.envitefy?.postMessage({ action: "appearance", scheme });
}

function postNativeSignIn(action: NativeSignInMessage["action"], input: NativeSignIn): boolean {
  if (typeof window === "undefined") return false;
  const handler = (window as NativeWindow).webkit?.messageHandlers?.envitefy;
  if (!handler || !/EnvitefyIOS\//.test(navigator.userAgent)) return false;
  const message: NativeSignInMessage = {
    action,
    mode: input.mode,
    returnTo: mobileReturnPath(input.returnTo),
  };
  if (input.intent) message.intent = input.intent;
  if (input.calendar) message.calendar = input.calendar;
  handler.postMessage(message);
  return true;
}
