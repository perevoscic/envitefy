import type { Metadata } from "next";
import { isMobileAuthRandom, mobileReturnPath } from "@/lib/mobile-auth-contract";
import { normalizeSignupIntent } from "@/lib/signup-intent";
import MobileSignIn from "./MobileSignIn";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign in to Envitefy",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function MobileSignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const challenge = params.challenge;
  const state = params.state;
  if (!isMobileAuthRandom(challenge) || !isMobileAuthRandom(state)) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-semibold">Open Envitefy to sign in</h1>
        <p className="mt-4">Start sign-in from the iPhone app, then return here.</p>
      </main>
    );
  }
  return (
    <MobileSignIn
      challenge={challenge}
      state={state}
      returnTo={mobileReturnPath(typeof params.returnTo === "string" ? params.returnTo : "/")}
      initialMode={params.mode === "signup" ? "signup" : "login"}
      intent={
        normalizeSignupIntent(typeof params.intent === "string" ? params.intent : null) || "snap"
      }
      calendar={
        params.calendar === "google" || params.calendar === "outlook" ? params.calendar : null
      }
      calendarDone={params.calendarDone === "1"}
      calendarConnected={params.googleAuth === "stored" || params.outlookAuth === "stored"}
    />
  );
}
