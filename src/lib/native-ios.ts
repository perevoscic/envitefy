import { mobileReturnPath } from "./mobile-auth-contract";
import type { SignupIntent } from "./signup-intent";

type NativeSignIn = {
  returnTo: string;
  mode: "login" | "signup";
  intent?: SignupIntent;
  calendar?: "google" | "outlook";
};
type NativeMessage = NativeSignIn & { action: "request-authenticate" | "authenticate" };
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

function postNativeSignIn(action: NativeMessage["action"], input: NativeSignIn): boolean {
  if (typeof window === "undefined") return false;
  const handler = (window as NativeWindow).webkit?.messageHandlers?.envitefy;
  if (!handler || !/EnvitefyIOS\//.test(navigator.userAgent)) return false;
  const message: NativeMessage = {
    action,
    mode: input.mode,
    returnTo: mobileReturnPath(input.returnTo),
  };
  if (input.intent) message.intent = input.intent;
  if (input.calendar) message.calendar = input.calendar;
  handler.postMessage(message);
  return true;
}
